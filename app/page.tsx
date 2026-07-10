"use client";

import { useEffect, useRef, useState } from "react";
import {
  createJourneyMemory,
  HomerScene,
  HomerTransition,
  JourneyMemory,
  resolveTroy,
  TROY_ALLOWED_ACTION_TAGS,
} from "../lib/journey";

const mapLabels = [
  "TROY",
  "CICONES",
  "LOTUS-EATERS",
  "CYCLOPS",
  "AEOLIA",
  "LAESTRYGONIANS",
  "CIRCE",
  "HADES · UNDERWORLD",
  "SIRENS",
  "SCYLLA & CHARYBDIS",
  "THRINACIA · HELIOS’ CATTLE",
  "CALYPSO",
  "PHAEACIA",
  "ITHACA",
];

type JourneyPhase = "map" | "loading_troy" | "troy" | "resolving_troy" | "cicones";
type AudioStatus = "idle" | "loading" | "ready" | "playing" | "error";

interface SavedJourney {
  goal: string;
  phase: JourneyPhase;
  memory: JourneyMemory | null;
  scene: HomerScene | null;
  troyAnswer: string;
  troyResolution: string;
}

const SESSION_KEY = "odyssey.troy.vertical-slice.v1";

async function requestHomer<T>(payload: object): Promise<T> {
  const response = await fetch("/api/homer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "The sea has not answered.");
    Object.assign(error, { requestId: data.requestId });
    throw error;
  }
  return data as T;
}

export default function Home() {
  const [goal, setGoal] = useState("");
  const [phase, setPhase] = useState<JourneyPhase>("map");
  const [memory, setMemory] = useState<JourneyMemory | null>(null);
  const [scene, setScene] = useState<HomerScene | null>(null);
  const [troyAnswer, setTroyAnswer] = useState("");
  const [troyResolution, setTroyResolution] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [requestId, setRequestId] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedJourney;
        const restoredPhase =
          saved.phase === "loading_troy"
            ? "map"
            : saved.phase === "resolving_troy"
              ? "troy"
              : saved.phase;
        setGoal(saved.goal || "");
        setPhase(restoredPhase);
        setMemory(saved.memory || null);
        setScene(saved.scene || null);
        setTroyAnswer(saved.troyAnswer || "");
        setTroyResolution(saved.troyResolution || "");
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || phase === "map") return;
    const saved: SavedJourney = {
      goal,
      phase,
      memory,
      scene,
      troyAnswer,
      troyResolution,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
  }, [goal, hydrated, memory, phase, scene, troyAnswer, troyResolution]);

  useEffect(() => {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioRef.current = null;
    audioUrlRef.current = null;
    setAudioStatus("idle");
  }, [scene?.narrative]);

  function recordError(error: unknown) {
    const known = error as Error & { requestId?: string };
    setErrorMessage(known.message || "The sea has not answered.");
    setRequestId(known.requestId || "");
  }

  async function beginJourney() {
    const homeGoal = goal.trim();
    if (!homeGoal || phase === "loading_troy") return;
    setErrorMessage("");
    setRequestId("");
    setPhase("loading_troy");
    const initialMemory = createJourneyMemory(homeGoal);
    setMemory(initialMemory);

    try {
      const troyScene = await requestHomer<HomerScene>({
        phase: "enter",
        currentIsland: "Troy",
        homeGoal,
        timeline: [],
      });
      setScene(troyScene);
      setPhase("troy");
    } catch (error) {
      setPhase("map");
      recordError(error);
    }
  }

  async function resolveTroyAnswer() {
    const playerInput = troyAnswer.trim();
    if (!playerInput || !memory || phase === "resolving_troy") return;
    setErrorMessage("");
    setRequestId("");
    setPhase("resolving_troy");

    try {
      const transition = await requestHomer<HomerTransition>({
        phase: "resolve",
        currentIsland: "Troy",
        nextIsland: "Cicones",
        homeGoal: memory.homeGoal,
        timeline: memory.timeline,
        playerInput,
        allowed_action_tags: TROY_ALLOWED_ACTION_TAGS,
      });
      const nextMemory = resolveTroy(memory, transition.action_tag, playerInput);
      setMemory(nextMemory);
      setTroyResolution(transition.resolution);
      setScene({
        narrative: transition.next_narrative,
        question: transition.next_question,
      });
      setPhase("cicones");
    } catch (error) {
      setPhase("troy");
      recordError(error);
    }
  }

  async function hearHomer() {
    if (!scene?.narrative || audioStatus === "loading") return;
    if (audioStatus === "playing" && audioRef.current) {
      audioRef.current.pause();
      setAudioStatus("ready");
      return;
    }
    if (audioStatus === "ready" && audioRef.current) {
      try {
        await audioRef.current.play();
        setAudioStatus("playing");
      } catch (error) {
        const known = error as Error;
        console.error(`Homer playback failure: ${known.name}: ${known.message}`);
        setAudioStatus("error");
      }
      return;
    }

    setAudioStatus("loading");
    try {
      const audioText = `${scene.narrative} ${scene.question}`;
      const response = await fetch("/api/homer/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: audioText }),
      });
      if (!response.ok) throw new Error("Homer's voice could not cross the sea.");
      const url = URL.createObjectURL(await response.blob());
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setAudioStatus("ready");
      audio.onerror = () => setAudioStatus("error");
      setAudioStatus("ready");
    } catch (error) {
      const known = error as Error;
      console.error(`Homer audio client failure: ${known.name}: ${known.message}`);
      setAudioStatus("error");
    }
  }

  function resetJourney() {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    sessionStorage.removeItem(SESSION_KEY);
    setGoal("");
    setMemory(null);
    setScene(null);
    setTroyAnswer("");
    setTroyResolution("");
    setErrorMessage("");
    setRequestId("");
    setAudioStatus("idle");
    setPhase("map");
  }

  if (phase === "map") {
    return (
      <main className="landing map-world">
        <div className="map-plane">
          <img className="world-map" src="/odyssey-map.png" alt="The fourteen shores of the Aegean world" />
          <div className="island-layer" aria-hidden="true">
            {mapLabels.map((name, index) => (
              <button
                type="button"
                aria-label={name}
                key={name}
                className={`island-node node-${index + 1}${index === 0 ? " is-start" : ""}`}
              >
                <b>{name}</b>
              </button>
            ))}
            <span className="ship-token" />
          </div>
        </div>
        <div className="map-wash" />
        <header className="world-title"><span>ODYSSEY</span><i>✦　返 鄉 之 旅　✦</i></header>
        <section className="world-entry">
          <h1>What are you trying to return to?</h1>
          <p>Fourteen islands.<br />One question at every shore.<br /><em>The map never changes. You will.</em></p>
          <div className="world-form">
            <input
              aria-label="Your return goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && beginJourney()}
              placeholder="Speak your Ithaca…"
            />
            <button onClick={beginJourney}>BEGIN YOUR ODYSSEY <span>→</span></button>
          </div>
          {errorMessage && <p className="map-error" role="alert">{errorMessage} <button onClick={beginJourney}>TRY AGAIN</button></p>}
        </section>
        <footer className="world-mark"><span>14 ISLANDS</span><span>✦</span><span>ONE JOURNEY</span><span>✦</span><span>COUNTLESS TRUTHS</span></footer>
      </main>
    );
  }

  if (phase === "loading_troy" || !scene || !memory) {
    return (
      <main className="journey voyage-loading">
        <p className="eyebrow">THE FIRST SHORE</p>
        <h1>Troy is rising from the ash.</h1>
        <p>Homer gathers the first words of your return.</p>
      </main>
    );
  }

  const isResolving = phase === "resolving_troy";
  const isCicones = phase === "cicones";

  return (
    <main className="journey">
      <header className="journey-top">
        <span className="brand">ODYSSEY <small>返鄉之旅</small></span>
        <span className="goal-label">RETURNING TO <b>{memory.homeGoal}</b></span>
        <span className="island-count">{isCicones ? "02" : "01"} / 14</span>
      </header>
      <div className="progress"><span style={{ width: isCicones ? "14.28%" : "7.14%" }} /></div>
      <section className="island-layout">
        <div className="island-art">
          <img src="/odyssey-board.png" alt="An ancient Aegean voyage rendered in bronze and marble" />
          <div className="art-overlay">
            <span>SHORE {isCicones ? "02" : "01"}</span>
            <strong>{isCicones ? "The Red Shore" : "The City of Ash"}</strong>
          </div>
        </div>
        <article className="narrative">
          <p className="eyebrow">ISLAND {isCicones ? "02 · CICONES" : "01 · TROY"}</p>
          <h1>{isCicones ? "Cicones" : "Troy"}</h1>
          {isCicones && troyResolution && <p className="resolution">TROY REMEMBERED · {troyResolution}</p>}
          <p className="story" aria-live="polite">{scene.narrative}</p>

          <div className="homer-audio">
            <button type="button" onClick={hearHomer} disabled={audioStatus === "loading"}>
              {audioStatus === "loading" ? "SUMMONING HOMER…" : audioStatus === "playing" ? "PAUSE HOMER" : audioStatus === "ready" ? "PLAY HOMER" : "HEAR HOMER"}
            </button>
            <small>Homer’s voice is AI-generated. The written words remain the record.</small>
            {audioStatus === "error" && <p role="alert">His voice was lost at sea. The journey may continue. <button onClick={hearHomer}>TRY AGAIN</button></p>}
          </div>

          <p className="island-question">{scene.question}</p>

          {!isCicones ? (
            <>
              <label className="answer-label" htmlFor="answer">THE TRAVELER SPEAKS</label>
              <textarea
                id="answer"
                value={troyAnswer}
                onChange={(event) => setTroyAnswer(event.target.value)}
                placeholder="Leave a few words for the sea…"
                disabled={isResolving}
              />
              <button className="answer-shore" onClick={resolveTroyAnswer} disabled={isResolving || !troyAnswer.trim()}>
                {isResolving ? "THE SEA REMEMBERS…" : "ANSWER THE SHORE"}
              </button>
            </>
          ) : (
            <div className="slice-complete">
              <span>VERTICAL SLICE COMPLETE</span>
              <strong>Troy is recorded. Cicones has opened.</strong>
              <small>{memory.timeline.length} shore recorded · Journey Memory is intact.</small>
            </div>
          )}

          {errorMessage && (
            <div className="journey-error" role="alert">
              <strong>{errorMessage}</strong>
              <span>Your answer has been preserved.</span>
              {requestId && <small>Sea mark: {requestId}</small>}
              <button onClick={resolveTroyAnswer}>TRY THE CROSSING AGAIN</button>
            </div>
          )}
          <button className="new-voyage" onClick={resetJourney}>START A NEW JOURNEY</button>
        </article>
      </section>
    </main>
  );
}
