"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ENDING_REQUEST_TIMEOUT_MS, requestHomer } from "../lib/homer-client";
import { ISLAND_ART, ISLAND_FOCAL_POINTS } from "../lib/island-art";
import { createJourneyMemory, getIsland, HomerScene, HomerTransition, ISLANDS, JourneyCard, JourneyMemory, JourneySummary, resolveIsland } from "../lib/journey";
import { getVoyageLeg, JourneyPhase, recoverJourneyPhase, shouldAnimateVoyage, VOYAGE_DURATION_MS } from "../lib/voyage";

type Phase = JourneyPhase;
type AudioStatus = "idle" | "loading" | "ready" | "playing" | "error";
type EndingStage = "idle" | "summarizing" | "sealing";
interface SavedJourney { goal: string; phase: Phase; memory: JourneyMemory | null; scene: HomerScene | null; answer: string; resolution: string; summary: JourneySummary | null; card: JourneyCard | null; }
interface VoyageState { fromIndex: number; toIndex: number; }
const SESSION_KEY = "odyssey.fourteen-islands.v1";

export default function Home() {
  const [goal, setGoal] = useState(""); const [phase, setPhase] = useState<Phase>("map"); const [memory, setMemory] = useState<JourneyMemory | null>(null);
  const [scene, setScene] = useState<HomerScene | null>(null); const [answer, setAnswer] = useState(""); const [resolution, setResolution] = useState("");
  const [summary, setSummary] = useState<JourneySummary | null>(null); const [card, setCard] = useState<JourneyCard | null>(null);
  const [errorMessage, setErrorMessage] = useState(""); const [requestId, setRequestId] = useState(""); const [hydrated, setHydrated] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle"); const audioRef = useRef<HTMLAudioElement | null>(null); const audioUrlRef = useRef<string | null>(null);
  const [endingStage, setEndingStage] = useState<EndingStage>("idle");
  const [voyage, setVoyage] = useState<VoyageState | null>(null); const reducedMotion = usePrefersReducedMotion();

  // Session storage is an external source; this one-time hydration intentionally restores its snapshot.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { const raw = sessionStorage.getItem(SESSION_KEY); if (raw) { const s = JSON.parse(raw) as SavedJourney; const interruptedEntry = s.phase === "loading" && !s.scene; setGoal(s.goal || ""); setPhase(recoverJourneyPhase(s.phase, Boolean(s.scene))); setMemory(interruptedEntry ? null : s.memory); setScene(s.scene); setAnswer(s.answer || ""); setResolution(s.resolution || ""); setSummary(s.summary); setCard(s.card); if (interruptedEntry) setErrorMessage("The first crossing was interrupted. Your Ithaca is preserved; begin again when ready."); } } catch { sessionStorage.removeItem(SESSION_KEY); } finally { setHydrated(true); } }, []);
  useEffect(() => { if (!hydrated || phase === "map") return; sessionStorage.setItem(SESSION_KEY, JSON.stringify({ goal, phase, memory, scene, answer, resolution, summary, card } satisfies SavedJourney)); }, [answer, card, goal, hydrated, memory, phase, resolution, scene, summary]);
  // A changed scene invalidates the browser audio resource and its playback state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { audioRef.current?.pause(); if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); audioRef.current = null; audioUrlRef.current = null; setAudioStatus("idle"); }, [scene?.narrative]);
  function recordError(error: unknown) { const e = error as Error & { requestId?: string }; setErrorMessage(e.message || "The sea has not answered."); setRequestId(e.requestId || ""); }

  async function beginJourney() { const homeGoal = goal.trim(); if (!homeGoal) return; setErrorMessage(""); setPhase("loading"); const initial = createJourneyMemory(homeGoal); setMemory(initial); try { setScene(await requestHomer<HomerScene>({ phase: "enter", islandIndex: 0, homeGoal, timeline: [] })); setPhase("island"); } catch (e) { setPhase("map"); recordError(e); } }
  async function resolveAnswer() {
    const playerInput = answer.trim(); if (!playerInput || !memory || phase === "resolving") return;
    const island = getIsland(memory.currentIsland); if (!island) return; setErrorMessage(""); setPhase("resolving");
    try {
      const transition = await requestHomer<HomerTransition>({ phase: "resolve", islandIndex: memory.currentIsland, homeGoal: memory.homeGoal, timeline: memory.timeline, playerInput });
      const updated = resolveIsland(memory, island, transition.action_tag, playerInput); setMemory(updated); setResolution(transition.resolution); setAnswer("");
      if (updated.ending) { setScene({ narrative: transition.next_narrative, question: transition.next_question }); setPhase("ending"); return; }
      setScene({ narrative: transition.next_narrative, question: transition.next_question });
      if (shouldAnimateVoyage(reducedMotion)) { setVoyage({ fromIndex: memory.currentIsland, toIndex: updated.currentIsland }); setPhase("voyaging"); }
      else setPhase("island");
    } catch (e) { setPhase("island"); recordError(e); }
  }
  async function generateEnding() {
    if (!memory || phase === "generating_end") return;
    setErrorMessage(""); setRequestId(""); setEndingStage(summary ? "sealing" : "summarizing"); setPhase("generating_end");
    try {
      const nextSummary = summary || await requestHomer<JourneySummary>({ phase: "summary", memory }, { timeoutMs: ENDING_REQUEST_TIMEOUT_MS });
      setSummary(nextSummary); setEndingStage("sealing");
      const nextCard = await requestHomer<JourneyCard>({ phase: "card", memory, summary: nextSummary.summary }, { timeoutMs: ENDING_REQUEST_TIMEOUT_MS });
      setCard(nextCard); setEndingStage("idle"); setPhase("ending");
    } catch (e) { setEndingStage("idle"); setPhase("ending"); recordError(e); }
  }
  async function hearHomer() { if (!scene || audioStatus === "loading") return; if (audioStatus === "playing" && audioRef.current) { audioRef.current.pause(); setAudioStatus("ready"); return; } if (audioStatus === "ready" && audioRef.current) { try { await audioRef.current.play(); setAudioStatus("playing"); } catch { setAudioStatus("error"); } return; } setAudioStatus("loading"); try { const response = await fetch("/api/homer/audio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `${scene.narrative} ${scene.question}` }) }); if (!response.ok) throw new Error(); const url = URL.createObjectURL(await response.blob()); audioUrlRef.current = url; const audio = new Audio(url); audioRef.current = audio; audio.onended = () => setAudioStatus("ready"); audio.onerror = () => setAudioStatus("error"); await audio.play(); setAudioStatus("playing"); } catch { setAudioStatus("error"); } }
  function finishVoyage() { setVoyage(null); setPhase("island"); }
  function resetJourney() { audioRef.current?.pause(); if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current); sessionStorage.removeItem(SESSION_KEY); setGoal(""); setPhase("map"); setMemory(null); setScene(null); setAnswer(""); setResolution(""); setSummary(null); setCard(null); setEndingStage("idle"); setVoyage(null); setErrorMessage(""); setRequestId(""); }

  if (phase === "map") return <Map goal={goal} setGoal={setGoal} begin={beginJourney} error={errorMessage} />;
  if (!memory || !scene || phase === "loading") return <main className="journey voyage-loading"><p className="eyebrow">THE FIRST SHORE</p><h1>The map remembers your name.</h1><p>Homer gathers the words of your return.</p></main>;
  if (phase === "voyaging" && voyage) return <VoyageOverlay fromIndex={voyage.fromIndex} toIndex={voyage.toIndex} reducedMotion={reducedMotion} complete={finishVoyage}/>;
  if (memory.ending) return <Ending memory={memory} scene={scene} summary={summary} card={card} phase={phase} stage={endingStage} generate={generateEnding} reset={resetJourney} error={errorMessage} />;

  const island = getIsland(memory.currentIsland); const index = memory.currentIsland;
  return <main className="journey">
    <header className="journey-top"><span className="brand">ODYSSEY <small>返鄉之旅</small></span><span className="goal-label">RETURNING TO <b>{memory.homeGoal}</b></span><span className="island-count">{String(index + 1).padStart(2, "0")} / 14</span></header>
    <div className="progress"><span style={{ width: `${((index + 1) / 14) * 100}%` }} /></div>
    <section className="island-layout" key={island.id}>
      <IslandArtwork islandId={island.id} name={island.name}/>
      <article className="narrative">
        <div className="arrival-name stage-step stage-step-name"><p className="eyebrow">ISLAND {String(index + 1).padStart(2, "0")} · {island.name.toUpperCase()}</p><h1>{island.name}</h1></div>
        <p className="stage-epithet stage-step stage-step-epithet">{island.epithet}</p>
        {resolution && <p className="resolution">THE SEA REMEMBERS · {resolution}</p>}
        <section className="homer-witness stage-step stage-step-homer" aria-label="Homer bears witness">
          <p className="homer-cue"><span>HOMER</span> BEARS WITNESS</p>
          <p className="story" aria-live="polite">{scene.narrative}</p>
          <AudioButton status={audioStatus} play={hearHomer}/>
        </section>
        <p className="island-question stage-step stage-step-question">{scene.question}</p>
        <div className="response-band stage-step stage-step-response">
          <label className="answer-label" htmlFor="answer">THE TRAVELER SPEAKS</label>
          <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Leave a few words for the sea…" disabled={phase === "resolving"}/>
          <div className="journey-actions"><button className="answer-shore" onClick={resolveAnswer} disabled={phase === "resolving" || !answer.trim()}>{phase === "resolving" ? "THE SEA REMEMBERS…" : island.id === "ithaca" ? "COMPLETE THE RETURN" : "ANSWER THE SHORE"}</button>{errorMessage && <ErrorBox message={errorMessage} requestId={requestId} retry={resolveAnswer}/>}<button className="new-voyage" onClick={resetJourney}>START A NEW JOURNEY</button></div>
        </div>
      </article>
    </section>
  </main>;
}

function VoyageOverlay({ fromIndex, toIndex, reducedMotion, complete }: { fromIndex: number; toIndex: number; reducedMotion: boolean; complete: () => void }) {
  const leg = getVoyageLeg(fromIndex, toIndex);
  const from = ISLANDS[fromIndex]; const to = ISLANDS[toIndex];
  const copyPosition = fromIndex <= 4 ? "right-top" : fromIndex <= 8 ? "left-bottom" : "left-top";
  useEffect(() => { const timer = setTimeout(complete, reducedMotion ? 0 : VOYAGE_DURATION_MS); return () => clearTimeout(timer); }, [complete, reducedMotion]);
  return <main className="voyage-stage" aria-label={`Voyaging from ${from.name} to ${to.name}`}>
    <div className="voyage-map-plane" aria-hidden="true">
      <img src="/odyssey-map.png" alt=""/>
      <svg viewBox="0 0 100 66.67" role="presentation">
        <path className="voyage-leg" d={leg.path}/>
        <g className="voyage-vessel">
          <circle className="voyage-halo" cx="0" cy="0" r="5"/>
          <image className="voyage-ship" href="/assets/ship-token.webp" x="-5" y="-3.8" width="10" height="7.6"/>
          <animateMotion dur={`${VOYAGE_DURATION_MS}ms`} path={leg.path} fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.55 1"/>
        </g>
      </svg>
    </div>
    <div className="voyage-scrim"/>
    <header className="journey-top voyage-top"><span className="brand">ODYSSEY <small>返鄉之旅</small></span><span className="island-count">{String(toIndex + 1).padStart(2, "0")} / 14</span></header>
    <section className={`voyage-copy voyage-copy-${copyPosition}`} role="status"><p className="eyebrow">THE SEA REMEMBERS</p><h1>{from.name} <span>to</span> {to.name}</h1><p>Your answer is safe. Homer carries it toward the next shore.</p><button type="button" onClick={complete}>SKIP TO THE SHORE</button></section>
  </main>;
}

function IslandArtwork({ islandId, name }: { islandId: string; name: string }) {
  const source = ISLAND_ART[islandId];
  const focal = ISLAND_FOCAL_POINTS[islandId];
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (retryTimer.current) clearTimeout(retryTimer.current); }, []);
  function retryImage() {
    if (attempt >= 2 || retryTimer.current) return;
    retryTimer.current = setTimeout(() => { retryTimer.current = null; setAttempt((value) => value + 1); }, 450);
  }
  const retrySuffix = attempt ? `?retry=${attempt}` : "";
  const focalStyle = { "--focal-desktop": focal.desktop, "--focal-mobile": focal.mobile } as CSSProperties;
  return <div className={`island-art island-art-${islandId}`} style={focalStyle}><img src={`${source}${retrySuffix}`} alt={`${name}, the present shore`} decoding="async" fetchPriority="high" onError={retryImage}/><div className="island-art-veil"/></div>;
}

function Map({ goal, setGoal, begin, error }: { goal: string; setGoal: (v: string) => void; begin: () => void; error: string }) { return <main className="landing map-world"><div className="map-plane"><img className="world-map" src="/odyssey-map.png" alt="The fourteen shores of the Aegean world"/><div className="island-layer" aria-hidden="true">{ISLANDS.map((island, i) => <button type="button" key={island.id} className={`island-node node-${i + 1}${i === 0 ? " is-start" : ""}`}><b>{island.name.toUpperCase()}</b></button>)}<span className="ship-token"/></div></div><div className="map-wash"/><header className="world-title"><span>ODYSSEY</span><i>✦　返 鄉 之 旅　✦</i></header><section className="world-entry"><h1>What are you trying to return to?</h1><p>Fourteen islands.<br/>One question at every shore.<br/><em>The map never changes. You will.</em></p><div className="world-form"><input aria-label="Your return goal" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && begin()} placeholder="Speak your Ithaca…"/><button onClick={begin}>BEGIN YOUR ODYSSEY <span>→</span></button></div>{error && <p className="map-error" role="alert">{error} <button onClick={begin}>TRY AGAIN</button></p>}</section><footer className="world-mark"><span>14 ISLANDS</span><span>✦</span><span>ONE JOURNEY</span><span>✦</span><span>COUNTLESS TRUTHS</span></footer></main>; }
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
