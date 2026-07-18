"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DivinePresenceStage } from "./divine-presence-stage";
import { LunaThreshold } from "./luna-threshold";
import { PenelopeRecognition } from "./penelope-recognition";
import { requestDivineEncounter } from "../lib/divine-client";
import { getDivineTriggerForResolvedDeparture, type DivineTriggerId } from "../lib/divine";
import {
  activateDivineEncounter,
  clearDivineSession,
  createDivineSession,
  dismissDivineEncounter,
  readDivineSession,
  recoverDivineEncounter,
  resetDivineSession,
  writeDivineSession,
  type DivineSession,
} from "../lib/divine-session";
import { ENDING_REQUEST_TIMEOUT_MS, requestHomer } from "../lib/homer-client";
import { ISLAND_ART, ISLAND_PRESENTATION } from "../lib/island-art";
import { createJourneyMemory, getIsland, HomerScene, HomerTransition, ISLANDS, JourneyCard, JourneyMemory, JourneySummary, resolveIsland } from "../lib/journey";
import { requestLunaEncounter } from "../lib/luna-client";
import { getLunaTriggerForIslandIndex } from "../lib/luna";
import {
  activateLunaEncounter,
  clearLunaSession,
  createLunaSession,
  queueLunaEncounter,
  readLunaSession,
  reconcileLunaSession,
  resetLunaSession,
  writeLunaSession,
  type LunaSession,
} from "../lib/luna-session";
import { advanceCrossingGate, ARRIVAL_REVEAL_DURATION_MS, ARRIVAL_STAGE_DELAYS_MS, canBeginCrossing, createCrossingGate, crossingCanSettle, getVoyageLeg, JourneyPhase, recoverJourneyPhase, type CrossingGate, VOYAGE_CAMERA_MOBILE_START_SCALE, VOYAGE_CAMERA_START_SCALE, VOYAGE_DURATION_MS } from "../lib/voyage";
import { PENELOPE_LOOM_SESSION_KEY, soundscape } from "../lib/soundscape";

type Phase = JourneyPhase;
type AudioStatus = "idle" | "loading" | "ready" | "playing" | "error";
type EndingStage = "idle" | "summarizing" | "sealing";
interface SavedJourney { goal: string; phase: Phase; memory: JourneyMemory | null; scene: HomerScene | null; answer: string; resolution: string; summary: JourneySummary | null; card: JourneyCard | null; }
interface VoyageState {
  id: number;
  fromIndex: number;
  toIndex: number;
  playerInput: string;
  gate: CrossingGate;
  ending?: JourneyMemory["ending"];
  errorMessage: string;
  requestId: string;
  divineTrigger?: DivineTriggerId;
  resolvedMemory?: JourneyMemory;
}
const SESSION_KEY = "odyssey.fourteen-islands.v1";
const VOYAGE_ASSETS = ["/odyssey-map.png", "/assets/ship-token.webp"] as const;

async function decodeVoyageAsset(source: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
  try {
    await image.decode();
  } catch {
    if (image.complete) return;
    await new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); });
  }
}

export default function Home() {
  const [goal, setGoal] = useState(""); const [phase, setPhase] = useState<Phase>("map"); const [memory, setMemory] = useState<JourneyMemory | null>(null);
  const [scene, setScene] = useState<HomerScene | null>(null); const [answer, setAnswer] = useState(""); const [resolution, setResolution] = useState("");
  const [summary, setSummary] = useState<JourneySummary | null>(null); const [card, setCard] = useState<JourneyCard | null>(null);
  const [errorMessage, setErrorMessage] = useState(""); const [requestId, setRequestId] = useState(""); const [hydrated, setHydrated] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle"); const audioRef = useRef<HTMLAudioElement | null>(null); const audioUrlRef = useRef<string | null>(null);
  const [endingStage, setEndingStage] = useState<EndingStage>("idle");
  const [voyage, setVoyage] = useState<VoyageState | null>(null); const reducedMotion = usePrefersReducedMotion();
  const voyageRef = useRef<VoyageState | null>(null); const crossingSequenceRef = useRef(0); const crossingBusyRef = useRef(false);
  const [divineSession, setDivineSession] = useState<DivineSession | null>(null); const divineSessionRef = useRef<DivineSession | null>(null); const divineRequestRef = useRef<string | null>(null);
  const [lunaSession, setLunaSession] = useState<LunaSession | null>(null); const lunaSessionRef = useRef<LunaSession | null>(null); const lunaRequestRef = useRef<string | null>(null);
  const [completedLunaPresentation, setCompletedLunaPresentation] = useState<string | null>(null);

  // Session storage is an external source; this one-time hydration intentionally restores its snapshot.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let restoredMemory: JourneyMemory | null = null;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as SavedJourney;
        const interruptedEntry = s.phase === "loading" && !s.scene;
        const interruptedCrossing = (s.phase === "resolving" || s.phase === "voyaging") && Boolean(s.answer?.trim());
        restoredMemory = interruptedEntry ? null : s.memory;
        setGoal(s.goal || ""); setPhase(recoverJourneyPhase(s.phase, Boolean(s.scene))); setMemory(restoredMemory); setScene(s.scene); setAnswer(s.answer || ""); setResolution(s.resolution || ""); setSummary(s.summary); setCard(s.card);
        if (interruptedEntry) setErrorMessage("The first crossing was interrupted. Your Ithaca is preserved; begin again when ready.");
        else if (interruptedCrossing) setErrorMessage("The crossing was interrupted. Your answer is preserved; try the passage again.");
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
    let nextDivine: DivineSession;
    try {
      nextDivine = restoredMemory
        ? recoverDivineEncounter(readDivineSession(sessionStorage), restoredMemory)
        : resetDivineSession(sessionStorage);
    } catch {
      nextDivine = createDivineSession();
    }
    divineSessionRef.current = nextDivine;
    setDivineSession(nextDivine);
    try {
      const restoredLuna = restoredMemory
        ? reconcileLunaSession(readLunaSession(sessionStorage, nextDivine.journeyId), restoredMemory)
        : resetLunaSession(sessionStorage, nextDivine.journeyId);
      lunaSessionRef.current = restoredLuna;
      setLunaSession(restoredLuna);
    } catch {
      const nextLuna = createLunaSession(nextDivine.journeyId);
      lunaSessionRef.current = nextLuna;
      setLunaSession(nextLuna);
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => { if (!hydrated || phase === "map") return; sessionStorage.setItem(SESSION_KEY, JSON.stringify({ goal, phase, memory, scene, answer, resolution, summary, card } satisfies SavedJourney)); }, [answer, card, goal, hydrated, memory, phase, resolution, scene, summary]);
  useEffect(() => {
    if (!hydrated || !divineSession) return;
    try { writeDivineSession(sessionStorage, divineSession); } catch { /* The in-memory receipt still protects this page session. */ }
  }, [divineSession, hydrated]);
  useEffect(() => {
    if (!hydrated || !lunaSession) return;
    try { writeLunaSession(sessionStorage, lunaSession); } catch { /* The D1 receipt remains authoritative. */ }
  }, [hydrated, lunaSession]);
  const stableDivineRequestState = phase === "island" && Boolean(memory && scene);
  useEffect(() => {
    if (!hydrated || !stableDivineRequestState || !divineSession?.pending) return;
    const journeyId = divineSession.journeyId;
    const pending = divineSession.pending;
    const requestKey = `${journeyId}:${pending.triggerId}`;
    if (divineRequestRef.current === requestKey) return;
    divineRequestRef.current = requestKey;
    void requestDivineEncounter({ journeyId, triggerId: pending.triggerId, context: pending.context }).then((encounter) => {
      setDivineSession((current) => {
        if (!current || current.journeyId !== journeyId) return current;
        const next = activateDivineEncounter(current, encounter);
        divineSessionRef.current = next;
        return next;
      });
    });
  }, [divineSession?.journeyId, divineSession?.pending, hydrated, stableDivineRequestState]);
  const stableLunaRequestState = phase === "island" && Boolean(memory && scene);
  useEffect(() => {
    if (!hydrated || !stableLunaRequestState || !lunaSession?.pending) return;
    const journeyId = lunaSession.journeyId;
    const pending = lunaSession.pending;
    const requestKey = `${journeyId}:${pending.triggerId}`;
    if (lunaRequestRef.current === requestKey) return;
    lunaRequestRef.current = requestKey;
    void requestLunaEncounter({ journeyId, context: pending.context }).then((outcome) => {
      setLunaSession((current) => {
        if (!current || current.journeyId !== journeyId) return current;
        const next = activateLunaEncounter(current, outcome);
        lunaSessionRef.current = next;
        return next;
      });
    });
  }, [hydrated, lunaSession?.journeyId, lunaSession?.pending, stableLunaRequestState]);
  // A changed scene invalidates the browser audio resource and its playback state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { audioRef.current?.pause(); if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); audioRef.current = null; audioUrlRef.current = null; setAudioStatus("idle"); }, [scene?.narrative]);
  useEffect(() => {
    if (!hydrated) return;
    if (memory?.ending === "ithaca") return;
    const unlock = () => {
      soundscape?.enterJourney();
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
    };
    const onPointer = () => unlock();
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || ["Tab", "Shift", "Control", "Alt", "Meta", "Escape"].includes(event.key)) return;
      unlock();
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKey, true);
    return () => { window.removeEventListener("pointerdown", onPointer, true); window.removeEventListener("keydown", onKey, true); };
  }, [hydrated, memory?.ending, phase]);
  useEffect(() => {
    if (!hydrated || memory?.ending !== "ithaca") return;
    soundscape?.enterIthacaEnding();
  }, [hydrated, memory?.ending]);
  useEffect(() => { if (phase !== "voyaging") soundscape?.stopSailing(); }, [phase]);
  function describeError(error: unknown) { const e = error as Error & { requestId?: string }; return { message: e.message || "The sea has not answered.", requestId: e.requestId || "" }; }
  function recordError(error: unknown) { const details = describeError(error); setErrorMessage(details.message); setRequestId(details.requestId); }
  function updateVoyage(next: VoyageState | null) { voyageRef.current = next; setVoyage(next); }
  function updateDivineSession(next: DivineSession | null) { divineSessionRef.current = next; setDivineSession(next); }
  function updateLunaSession(next: LunaSession | null) { lunaSessionRef.current = next; setLunaSession(next); }

  function settleCrossing(crossing: VoyageState) {
    if (!crossingCanSettle(crossing.gate)) return;
    soundscape?.stopSailing();
    updateVoyage(null); crossingBusyRef.current = false; setPhase(crossing.ending ? "ending" : "island");
    if (crossing.divineTrigger && crossing.resolvedMemory && !crossing.ending) {
      const current = divineSessionRef.current || createDivineSession();
      const next = recoverDivineEncounter(current, crossing.resolvedMemory);
      updateDivineSession(next);
    }
  }

  async function beginJourney() { const homeGoal = goal.trim(); if (!homeGoal) return; soundscape?.enterJourney(); setCompletedLunaPresentation(null); setErrorMessage(""); setPhase("loading"); const initial = createJourneyMemory(homeGoal); setMemory(initial); let nextDivine: DivineSession; try { nextDivine = resetDivineSession(sessionStorage); } catch { nextDivine = createDivineSession(); } updateDivineSession(nextDivine); try { updateLunaSession(resetLunaSession(sessionStorage, nextDivine.journeyId)); } catch { updateLunaSession(createLunaSession(nextDivine.journeyId)); } try { setScene(await requestHomer<HomerScene>({ phase: "enter", islandIndex: 0, homeGoal, timeline: [] })); setPhase("island"); } catch (e) { soundscape?.leaveJourney(); setPhase("map"); recordError(e); } }
  function resolveAnswer() {
    const playerInput = answer.trim();
    if (!playerInput || !memory || crossingBusyRef.current || !canBeginCrossing(phase, Boolean(voyageRef.current))) return;
    const fromIndex = memory.currentIsland; const island = getIsland(fromIndex); if (!island) return;
    const crossing: VoyageState = {
      id: ++crossingSequenceRef.current,
      fromIndex,
      toIndex: Math.min(fromIndex + 1, ISLANDS.length - 1),
      playerInput,
      gate: createCrossingGate(reducedMotion),
      errorMessage: "",
      requestId: "",
    };
    crossingBusyRef.current = true; setErrorMessage(""); setRequestId(""); updateVoyage(crossing); setPhase("voyaging");
    if (!reducedMotion) soundscape?.startSailing();
    void performResolve(crossing.id, memory, playerInput);
  }

  async function performResolve(crossingId: number, memoryAtDeparture: JourneyMemory, playerInput: string) {
    const island = getIsland(memoryAtDeparture.currentIsland); if (!island) return;
    try {
      const transition = await requestHomer<HomerTransition>({ phase: "resolve", islandIndex: memoryAtDeparture.currentIsland, homeGoal: memoryAtDeparture.homeGoal, timeline: memoryAtDeparture.timeline, playerInput });
      const current = voyageRef.current; if (!current || current.id !== crossingId) return;
      const updated = resolveIsland(memoryAtDeparture, island, transition.action_tag, playerInput); setMemory(updated); setResolution(transition.resolution); setAnswer("");
      if (lunaSessionRef.current) updateLunaSession(reconcileLunaSession(lunaSessionRef.current, updated));
      setScene({ narrative: transition.next_narrative, question: transition.next_question });
      const divineTrigger = getDivineTriggerForResolvedDeparture({ departureIslandIndex: memoryAtDeparture.currentIsland, resolvedCurrentIsland: updated.currentIsland, resolvedEnding: updated.ending }) || undefined;
      const next = { ...current, gate: advanceCrossingGate(current.gate, { type: "api-resolved" }), ending: updated.ending, divineTrigger, resolvedMemory: updated };
      crossingBusyRef.current = false; updateVoyage(next); settleCrossing(next);
    } catch (error) {
      const current = voyageRef.current; if (!current || current.id !== crossingId) return;
      const details = describeError(error);
      const next = { ...current, gate: advanceCrossingGate(current.gate, { type: "api-failed" }), errorMessage: details.message, requestId: details.requestId };
      soundscape?.stopSailing(); crossingBusyRef.current = false; setErrorMessage(details.message); setRequestId(details.requestId); updateVoyage(next);
    }
  }

  function finishVoyageVisual() {
    const current = voyageRef.current; if (!current) return;
    soundscape?.stopSailing();
    const next = { ...current, gate: advanceCrossingGate(current.gate, { type: "visual-complete" }) };
    updateVoyage(next); settleCrossing(next);
  }

  function retryCrossing() {
    const current = voyageRef.current;
    if (!current || current.gate.status !== "error" || crossingBusyRef.current || !memory) return;
    const next = { ...current, gate: createCrossingGate(true), ending: undefined, errorMessage: "", requestId: "" };
    crossingBusyRef.current = true; setErrorMessage(""); setRequestId(""); updateVoyage(next);
    void performResolve(next.id, memory, next.playerInput);
  }
  async function generateEnding() {
    if (!memory || phase === "generating_end") return;
    if (memory.ending === "ithaca") {
      let alreadyPlayed = false;
      try { alreadyPlayed = sessionStorage.getItem(PENELOPE_LOOM_SESSION_KEY) === "played"; } catch { /* The return remains complete without storage. */ }
      if (!alreadyPlayed) {
        void soundscape?.playIthacaLoom().then((played) => {
          if (!played) return;
          try { sessionStorage.setItem(PENELOPE_LOOM_SESSION_KEY, "played"); } catch { /* Audio remains optional without storage. */ }
        });
      }
    }
    setErrorMessage(""); setRequestId(""); setEndingStage(summary ? "sealing" : "summarizing"); setPhase("generating_end");
    try {
      const nextSummary = summary || await requestHomer<JourneySummary>({ phase: "summary", memory }, { timeoutMs: ENDING_REQUEST_TIMEOUT_MS });
      setSummary(nextSummary); setEndingStage("sealing");
      const nextCard = await requestHomer<JourneyCard>({ phase: "card", memory, summary: nextSummary.summary }, { timeoutMs: ENDING_REQUEST_TIMEOUT_MS });
      setCard(nextCard); setEndingStage("idle"); setPhase("ending");
    } catch (e) { setEndingStage("idle"); setPhase("ending"); recordError(e); }
  }
  async function hearHomer() { if (!scene || audioStatus === "loading") return; soundscape?.enterJourney(); if (audioStatus === "playing" && audioRef.current) { audioRef.current.pause(); soundscape?.setVoiceActive(false); setAudioStatus("ready"); return; } if (audioStatus === "ready" && audioRef.current) { try { await audioRef.current.play(); soundscape?.setVoiceActive(true); setAudioStatus("playing"); } catch { soundscape?.setVoiceActive(false); setAudioStatus("error"); } return; } setAudioStatus("loading"); try { const response = await fetch("/api/homer/audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `${scene.narrative} ${scene.question}` }) }); if (!response.ok) throw new Error(); const url = URL.createObjectURL(await response.blob()); audioUrlRef.current = url; const audio = new Audio(url); audioRef.current = audio; audio.onplay = () => soundscape?.setVoiceActive(true); audio.onpause = () => soundscape?.setVoiceActive(false); audio.onended = () => { soundscape?.setVoiceActive(false); setAudioStatus("ready"); }; audio.onerror = () => { soundscape?.setVoiceActive(false); setAudioStatus("error"); }; await audio.play(); soundscape?.setVoiceActive(true); setAudioStatus("playing"); } catch { soundscape?.setVoiceActive(false); setAudioStatus("error"); } }
  function dismissDivinePresence() {
    const current = divineSessionRef.current;
    if (!current) return;
    updateDivineSession(dismissDivineEncounter(current));
  }
  function openLunaThreshold() { if (!memory || !lunaSessionRef.current) return; updateLunaSession(queueLunaEncounter(lunaSessionRef.current, memory)); }
  function continueLunaThreshold() { if (lunaTriggerId && lunaActive) setCompletedLunaPresentation(lunaTriggerId); }
  function resetJourney() { audioRef.current?.pause(); soundscape?.leaveJourney(); if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); sessionStorage.removeItem(PENELOPE_LOOM_SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); clearDivineSession(sessionStorage); divineRequestRef.current = null; updateDivineSession(null); clearLunaSession(sessionStorage); lunaRequestRef.current = null; updateLunaSession(null); setCompletedLunaPresentation(null); crossingBusyRef.current = false; updateVoyage(null); setGoal(""); setPhase("map"); setMemory(null); setScene(null); setAnswer(""); setResolution(""); setSummary(null); setCard(null); setEndingStage("idle"); setErrorMessage(""); setRequestId(""); }

  if (phase === "map") return <Map goal={goal} setGoal={setGoal} begin={beginJourney} error={errorMessage} />;
  if (!memory || !scene || phase === "loading") return <main className="journey voyage-loading"><p className="eyebrow">THE FIRST SHORE</p><h1>The map remembers your name.</h1><p>Homer gathers the words of your return.</p></main>;
  if (phase === "voyaging" && voyage) return <VoyageOverlay crossing={voyage} reducedMotion={reducedMotion} complete={finishVoyageVisual} retry={retryCrossing}/>;
  if (divineSession?.active || divineSession?.pending) {
    const triggerId = divineSession.active?.triggerId || divineSession.pending?.triggerId;
    if (triggerId) return <DivinePresenceStage key={triggerId} triggerId={triggerId} encounter={divineSession.active} pending={Boolean(divineSession.pending)} onContinue={dismissDivinePresence}/>;
  }
  if (memory.ending) return <Ending memory={memory} scene={scene} summary={summary} card={card} phase={phase} stage={endingStage} generate={generateEnding} reset={resetJourney} error={errorMessage} />;

  const island = getIsland(memory.currentIsland); const index = memory.currentIsland; const presentation = ISLAND_PRESENTATION[island.id];
  const lunaTriggerId = getLunaTriggerForIslandIndex(index);
  const lunaSeen = Boolean(lunaTriggerId && lunaSession?.seenTriggerIds.includes(lunaTriggerId));
  const lunaPending = Boolean(lunaTriggerId && lunaSession?.pending?.triggerId === lunaTriggerId);
  const lunaActive = lunaTriggerId && lunaSession?.active?.encounter.triggerId === lunaTriggerId ? lunaSession.active : null;
  const lunaPresentationDone = completedLunaPresentation === lunaTriggerId;
  const lunaSettled = !lunaTriggerId || lunaSeen || lunaPresentationDone;
  const presentationStyle = {
    "--content-width": presentation.contentWidth || "590px",
    "--arrival-reveal-duration": `${ARRIVAL_REVEAL_DURATION_MS}ms`,
    "--arrival-name-delay": `${ARRIVAL_STAGE_DELAYS_MS.name}ms`,
    "--arrival-memory-delay": `${ARRIVAL_STAGE_DELAYS_MS.memory}ms`,
    "--arrival-homer-delay": `${ARRIVAL_STAGE_DELAYS_MS.homer}ms`,
    "--arrival-luna-delay": "1700ms",
    "--arrival-question-delay": `${ARRIVAL_STAGE_DELAYS_MS.question}ms`,
    "--arrival-response-delay": `${ARRIVAL_STAGE_DELAYS_MS.response}ms`,
  } as CSSProperties;
  return <main className={`journey${lunaTriggerId && !lunaSeen && !lunaPresentationDone ? " journey-luna-active" : ""}`}>
    <header className="journey-top"><span className="brand">ODYSSEY <small>返鄉之旅</small></span><span className="goal-label">RETURNING TO <b>{memory.homeGoal}</b></span><span className="island-count">{String(index + 1).padStart(2, "0")} / 14</span></header>
    <div className="progress"><span style={{ width: `${((index + 1) / 14) * 100}%` }} /></div>
    <section className={`island-layout island-${island.id} content-${presentation.contentSide} scrim-${presentation.scrimDirection}`} key={island.id} style={presentationStyle}>
      <IslandArtwork islandId={island.id} name={island.name}/>
      <article className={`narrative${lunaTriggerId && !lunaSeen && !lunaPresentationDone ? " narrative-has-luna" : ""}`}>
        <div className="arrival-name stage-step stage-step-name"><p className="eyebrow">ISLAND {String(index + 1).padStart(2, "0")} · {island.name.toUpperCase()}</p><h1>{island.name}</h1><p className="stage-epithet">{island.epithet}</p></div>
        <section className="memory-beat stage-step stage-step-memory" aria-label="The sea remembers"><span>THE SEA REMEMBERS</span><p>{resolution || `Your Ithaca is named: ${memory.homeGoal}.`}</p></section>
        {lunaTriggerId && !lunaSeen && !lunaPresentationDone && <LunaThreshold triggerId={lunaTriggerId} pending={lunaPending} outcome={lunaActive} recovered={Boolean(lunaSession?.recovered)} onOpen={openLunaThreshold} onContinue={continueLunaThreshold}/>}
        <section className="homer-witness stage-step stage-step-homer" aria-label="Homer bears witness">
          <p className="story" aria-live="polite">{scene.narrative}</p>
          <AudioButton status={audioStatus} play={hearHomer}/>
        </section>
        {lunaSettled && <section className="choice-beat stage-step stage-step-question"><p className="island-question">{scene.question}</p></section>}
        {lunaSettled && <div className="response-band stage-step stage-step-response">
          <label className="answer-label" htmlFor="answer">Your answer</label>
          <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Leave a few words for the sea…"/>
          <div className="journey-actions"><button className="answer-shore" onClick={resolveAnswer} disabled={!answer.trim()}>{island.id === "ithaca" ? "COMPLETE THE RETURN" : "ANSWER THE SHORE"}</button>{errorMessage && <ErrorBox message={errorMessage} requestId={requestId} retry={resolveAnswer}/>}<button className="new-voyage" onClick={resetJourney}>START A NEW JOURNEY</button></div>
        </div>}
      </article>
    </section>
  </main>;
}

function VoyageOverlay({ crossing, reducedMotion, complete, retry }: { crossing: VoyageState; reducedMotion: boolean; complete: () => void; retry: () => void }) {
  const { fromIndex, toIndex, gate, errorMessage, requestId } = crossing;
  const hasLeg = toIndex === fromIndex + 1; const leg = hasLeg ? getVoyageLeg(fromIndex, toIndex) : null;
  const from = ISLANDS[fromIndex]; const to = ISLANDS[toIndex] || from;
  const copyPosition = fromIndex <= 4 ? "right-top" : fromIndex <= 8 ? "left-bottom" : "left-top";
  const [motionReady, setMotionReady] = useState(reducedMotion || gate.visualDone);
  const completeRef = useRef(complete); useEffect(() => { completeRef.current = complete; }, [complete]);
  useEffect(() => {
    if (reducedMotion || gate.visualDone || gate.status === "error") return;
    let cancelled = false; let firstFrame = 0; let secondFrame = 0;
    void Promise.all(VOYAGE_ASSETS.map(decodeVoyageAsset)).finally(() => {
      if (cancelled) return;
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => { if (!cancelled) setMotionReady(true); });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [crossing.id, gate.status, gate.visualDone, reducedMotion]);
  useEffect(() => { if (gate.visualDone || !motionReady) return; const timer = setTimeout(() => completeRef.current(), VOYAGE_DURATION_MS); return () => clearTimeout(timer); }, [crossing.id, gate.visualDone, motionReady]);
  const sailing = !gate.visualDone && gate.status !== "error" && !reducedMotion;
  const motionActive = sailing && motionReady;
  const waiting = gate.visualDone && gate.status === "pending";
  const failed = gate.status === "error";
  const mapStyle = {
    "--voyage-active-scale": VOYAGE_CAMERA_START_SCALE,
    "--voyage-mobile-scale": VOYAGE_CAMERA_MOBILE_START_SCALE,
    "--voyage-from-x": leg ? `${-leg.from.x}%` : "-50%",
    "--voyage-from-y": leg ? `${-(leg.from.y / 66.67) * 100}%` : "-50%",
    "--voyage-focus-x": leg ? `${-leg.focus.x}%` : "-50%",
    "--voyage-focus-y": leg ? `${-(leg.focus.y / 66.67) * 100}%` : "-50%",
    ...Object.fromEntries((leg?.motionPoints || []).flatMap((point, index) => [
      [`--ship-x-${index}`, `${point.x}%`],
      [`--ship-y-${index}`, `${(point.y / 66.67) * 100}%`],
    ])),
  } as CSSProperties;
  return <main className={`voyage-stage voyage-${failed ? "failed" : waiting ? "waiting" : "sailing"}`} aria-label={hasLeg ? `Voyaging from ${from.name} to ${to.name}` : `Gathering the final answer at ${from.name}`}>
    <div className={`voyage-map-plane${sailing ? motionActive ? " is-sailing" : " is-preparing" : ""}`} style={mapStyle} aria-hidden="true">
      <img src="/odyssey-map.png" alt="" decoding="async" fetchPriority="high"/>
      <svg className="voyage-route-layer" viewBox="0 0 100 66.67" role="presentation">
        {leg && <><path className="voyage-leg-underlay" d={leg.path}/><path className="voyage-leg" d={leg.path}/></>}
      </svg>
      {leg && !gate.visualDone && <VoyageVessel className={motionActive ? "is-sailing" : "is-preparing"}/>}
      {leg && gate.visualDone && !failed && <VoyageVessel className="is-arrived"/>}
    </div>
    <div className="voyage-scrim"/>
    <header className="journey-top voyage-top"><span className="brand">ODYSSEY <small>返鄉之旅</small></span><span className="island-count">{String(toIndex + 1).padStart(2, "0")} / 14</span></header>
    <section className={`voyage-copy voyage-copy-${copyPosition}`} role="status">
      <p className="eyebrow">{failed ? "THE CROSSING FALTERS" : waiting ? "THE SEA CARRIES YOUR ANSWER" : "THE SEA REMEMBERS"}</p>
      <h1>{failed ? "Your words remain aboard." : waiting ? "A new shore gathers beyond the mist." : hasLeg ? <>{from.name} <span>to</span> {to.name}</> : "The final word crosses the water."}</h1>
      <p>{failed ? "The shore has not been crossed. Your answer is still safe." : waiting ? "Homer is still gathering what this choice will become." : "Your answer is safe. The world moves while Homer bears witness."}</p>
      {requestId && failed && <small>Sea mark: {requestId}</small>}
      {failed ? <button type="button" onClick={retry}>TRY THE CROSSING AGAIN</button> : !gate.visualDone && <button type="button" onClick={complete}>SKIP TO THE SHORE</button>}
      {failed && errorMessage && <span className="voyage-error-detail">{errorMessage}</span>}
    </section>
  </main>;
}

function VoyageVessel({ className }: { className: "is-preparing" | "is-sailing" | "is-arrived" }) {
  return <div className={`voyage-vessel-motion ${className}`}>
    <span className="voyage-vessel-marker">
      <span className="voyage-halo"/>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="voyage-ship" src="/assets/ship-token.webp" alt="" decoding="async"/>
    </span>
  </div>;
}

function IslandArtwork({ islandId, name }: { islandId: string; name: string }) {
  const source = ISLAND_ART[islandId];
  const presentation = ISLAND_PRESENTATION[islandId];
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (retryTimer.current) clearTimeout(retryTimer.current); }, []);
  function retryImage() {
    if (attempt >= 2 || retryTimer.current) return;
    retryTimer.current = setTimeout(() => { retryTimer.current = null; setAttempt((value) => value + 1); }, 450);
  }
  const retrySuffix = attempt ? `?retry=${attempt}` : "";
  const focalStyle = { "--focal-desktop": presentation.desktopFocal, "--focal-mobile": presentation.mobileFocal } as CSSProperties;
  return <div className={`island-art island-art-${islandId}`} style={focalStyle}><img src={`${source}${retrySuffix}`} alt={`${name}, the present shore`} decoding="async" fetchPriority="high" onError={retryImage}/><div className="island-art-veil"/></div>;
}

function Map({ goal, setGoal, begin, error }: { goal: string; setGoal: (v: string) => void; begin: () => void; error: string }) { return <main className="landing map-world"><link rel="preload" as="image" href="/assets/ship-token.webp"/><div className="map-plane"><img className="world-map" src="/odyssey-map.png" alt="The fourteen shores of the Aegean world"/><div className="island-layer" aria-hidden="true">{ISLANDS.map((island, i) => <button type="button" key={island.id} className={`island-node node-${i + 1}${i === 0 ? " is-start" : ""}`}><b>{island.name.toUpperCase()}</b></button>)}</div></div><div className="map-wash"/><header className="world-title"><span>ODYSSEY</span><i>✦　返 鄉 之 旅　✦</i></header><section className="world-entry"><h1>What are you trying to return to?</h1><p>Fourteen islands.<br/>One question at every shore.<br/><em>The map never changes. You will.</em></p><div className="world-form"><input aria-label="Your return goal" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && begin()} placeholder="Speak your Ithaca…"/><button onClick={begin}>BEGIN YOUR ODYSSEY <span>→</span></button></div>{error && <p className="map-error" role="alert">{error} <button onClick={begin}>TRY AGAIN</button></p>}</section><footer className="world-mark"><span>14 ISLANDS</span><span>✦</span><span>ONE JOURNEY</span><span>✦</span><span>COUNTLESS TRUTHS</span></footer></main>; }
function AudioButton({ status, play }: { status: AudioStatus; play: () => void }) { return <div className="homer-audio"><img className="homer-medallion" src="/assets/homer-medallion.webp" alt="" aria-hidden="true"/><div className="homer-audio-controls"><button type="button" onClick={play} disabled={status === "loading"}>{status === "loading" ? "SUMMONING HOMER…" : status === "playing" ? "PAUSE HOMER" : status === "ready" ? "PLAY HOMER" : "HEAR HOMER"}</button><small>Homer’s voice is AI-generated. The written words remain the record.</small>{status === "error" && <p role="alert">His voice was lost at sea. The journey may continue. <button onClick={play}>TRY AGAIN</button></p>}</div></div>; }
function ErrorBox({ message, requestId, retry }: { message: string; requestId: string; retry: () => void }) { return <div className="journey-error" role="alert"><strong>{message}</strong><span>Your answer has been preserved.</span>{requestId && <small>Sea mark: {requestId}</small>}<button onClick={retry}>TRY THE CROSSING AGAIN</button></div>; }

function Ending({ memory, scene, summary, card, phase, stage, generate, reset, error }: { memory: JourneyMemory; scene: HomerScene; summary: JourneySummary | null; card: JourneyCard | null; phase: Phase; stage: EndingStage; generate: () => void; reset: () => void; error: string }) {
  const calypso = memory.ending === "calypso";
  const generating = phase === "generating_end";
  return <main className={`ending ending-${memory.ending}`}>
    <div className="ending-intro">
      <div className="ending-seal">✦</div>
      <p className="eyebrow">{calypso ? "A VALID ENDING · CALYPSO" : "THE RETURN · ITHACA"}</p>
      <h1>{calypso ? "The sea goes on without you." : "Ithaca remembers."}</h1>
      <p className="ending-lede">{scene.narrative}</p>
      {!card && !generating && !error && <button className="restart" onClick={generate}>REVEAL MY JOURNEY</button>}
      {error && <p className="journey-end-error" role="alert">{error} {summary ? "The Journey Summary is safe; only the card will be retried." : "Your Journey Memory is safe."} <button onClick={generate}>{summary ? "TRY SEALING THE CARD AGAIN" : "TRY GATHERING THE JOURNEY AGAIN"}</button></p>}
    </div>
    {generating && <EndingRitual timeline={memory.timeline} stage={stage}/>}
    {summary && <section className="journey-summary"><p className="card-label">JOURNEY SUMMARY</p><p>{summary.summary}</p></section>}
    {summary && generating && stage === "sealing" && <JourneyCardForming/>}
    {card && <JourneyCardResult card={card} shoreCount={memory.timeline.length}/>}
    {!calypso && card && <PenelopeRecognition/>}
    <p className="timeline-note">{memory.timeline.length} shores recorded · The Journey Memory is intact.</p>
    <button className="restart" onClick={reset} disabled={generating}>BEGIN ANOTHER ODYSSEY</button>
  </main>;
}

function EndingRitual({ timeline, stage }: { timeline: JourneyMemory["timeline"]; stage: EndingStage }) {
  const reducedMotion = usePrefersReducedMotion();
  const lastIndex = Math.max(0, timeline.length - 1);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!timeline.length) return;
    if (reducedMotion) {
      // Reduced motion presents the completed route without timed movement.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(lastIndex);
      return;
    }
    // A fresh ritual always begins at the first recorded shore.
    setActiveIndex(0);
    const timer = setInterval(() => {
      setActiveIndex((current) => {
        if (current >= lastIndex) { clearInterval(timer); return current; }
        return current + 1;
      });
    }, 650);
    return () => clearInterval(timer);
  }, [lastIndex, reducedMotion, timeline.length]);

  const current = timeline[Math.min(activeIndex, lastIndex)];
  const sealing = stage === "sealing";
  return <section className={`ending-ritual ritual-${sealing ? "sealing" : "retracing"}`}>
    <div className="ritual-heading" role="status">
      <p className="card-label">{sealing ? "THE JOURNEY IS GATHERED" : "THE SEA REMEMBERS"}</p>
      <strong>{sealing ? "Homer seals your Journey Card." : `Retracing your ${timeline.length} recorded shores.`}</strong>
    </div>
    <ol className="ritual-shores" aria-label={`${timeline.length} recorded shores`}>
      {timeline.map((entry, index) => <li key={`${entry.island}-${index}`} aria-label={`${index + 1}. ${entry.island}`} className={`${index <= activeIndex ? "is-visited" : ""}${index === activeIndex ? " is-current" : ""}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></li>)}
    </ol>
    {current && <p className="ritual-memory" aria-live="off"><span>SHORE {String(activeIndex + 1).padStart(2, "0")} · {current.island.toUpperCase()}</span><q key={activeIndex}>{current.quote}</q></p>}
  </section>;
}

function JourneyCardForming() {
  return <section className="card card-forming" aria-hidden="true">
    <div className="card-heading"><img className="journey-card-crest" src="/assets/journey-card-crest.webp" alt=""/><div><p className="card-label">JOURNEY CARD</p><h2>The final words are being sealed.</h2></div></div>
    <div className="forming-fields">{["STRENGTH", "TEMPTATION", "TURNING POINT", "TRUE ITHACA"].map((label) => <div key={label}><span>{label}</span><i/></div>)}</div>
    <p className="forming-quote">THE SEA HOLDS THE INK UNTIL HOMER’S WORDS ARRIVE.</p>
  </section>;
}

function JourneyCardResult({ card, shoreCount }: { card: JourneyCard; shoreCount: number }) {
  const quote = card.quote.replace(/^[\s"“”']+|[\s"“”']+$/g, "");
  return <section className="card card-complete">
    <div className="card-heading"><img className="journey-card-crest" src="/assets/journey-card-crest.webp" alt="" aria-hidden="true"/><div><p className="card-label">JOURNEY CARD</p><h2>{card.title}</h2></div></div>
    <dl className="journey-card-fields"><div><dt>STRENGTH</dt><dd>{card.strength}</dd></div><div><dt>TEMPTATION</dt><dd>{card.temptation}</dd></div><div><dt>TURNING POINT</dt><dd>{card.turningPoint}</dd></div><div><dt>TRUE ITHACA</dt><dd>{card.ithaca}</dd></div></dl>
    <blockquote>“{quote}”</blockquote><p className="card-shores">{shoreCount} SHORES · ONE RETURN</p>
  </section>;
}

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reducedMotion;
}
