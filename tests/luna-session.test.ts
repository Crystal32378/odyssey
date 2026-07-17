import assert from "node:assert/strict";
import test from "node:test";
import { authoredLunaFallback, type LunaOutcome } from "../lib/luna-client.ts";
import { composeLunaEncounter } from "../lib/luna.ts";
import {
  LUNA_SESSION_KEY,
  activateLunaEncounter,
  createLunaSession,
  queueLunaEncounter,
  readLunaSession,
  reconcileLunaSession,
  restoreLunaSession,
  writeLunaSession,
} from "../lib/luna-session.ts";
import { createJourneyMemory, ISLANDS, resolveIsland, type JourneyMemory } from "../lib/journey.ts";

const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_ID = "123e4567-e89b-42d3-a456-426614174001";

test("only Circe, Sirens, and Calypso can be explicitly queued", () => {
  for (const [index, triggerId] of [[6, "circe_threshold"], [8, "sirens_threshold"], [11, "calypso_threshold"]] as const) {
    const queued = queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(index));
    assert.equal(queued.pending?.triggerId, triggerId);
    assert.equal(queued.pending?.context.currentIslandIndex, index);
    assert.equal(queued.active, null);
  }
  assert.equal(queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(7)).pending, null);
});

test("generated, authored-fallback, and failed outcomes preserve distinct session states", () => {
  const cases: LunaOutcome[] = [
    { state: "generated", encounter: composeLunaEncounter("circe_threshold", { spokenLine: "Generated threshold.", memoryRefs: [] }, []) },
    { state: "authored_fallback", encounter: authoredLunaFallback("circe_threshold") },
    { state: "failed", encounter: authoredLunaFallback("circe_threshold") },
  ];
  for (const outcome of cases) {
    const active = activateLunaEncounter(queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(6)), outcome);
    assert.equal(active.active?.state, outcome.state);
    assert.equal(active.pending, null);
    assert.equal(active.recovered, false);
  }
});

test("refresh recovers one settled outcome without replay or conflict", () => {
  const queued = queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(8));
  const outcome: LunaOutcome = {
    state: "generated",
    encounter: composeLunaEncounter("sirens_threshold", { spokenLine: "Recovered chorus.", memoryRefs: [] }, []),
  };
  const active = activateLunaEncounter(queued, outcome);
  const restored = restoreLunaSession(JSON.stringify(active), JOURNEY_ID);
  assert.equal(restored.active?.encounter.spokenLine, "Recovered chorus.");
  assert.equal(restored.recovered, true);
  assert.equal(queueLunaEncounter(restored, atIsland(8)), restored);
});

test("leaving a threshold seals it once and makes late outcomes harmless", () => {
  const queued = queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(6));
  const nextMemory = atIsland(7);
  const reconciled = reconcileLunaSession(queued, nextMemory);
  assert.deepEqual(reconciled.seenTriggerIds, ["circe_threshold"]);
  assert.equal(reconciled.pending, null);
  const late = activateLunaEncounter(reconciled, {
    state: "generated",
    encounter: composeLunaEncounter("circe_threshold", { spokenLine: "Late.", memoryRefs: [] }, []),
  });
  assert.equal(late, reconciled);
});

test("Calypso stay preserves the immediate ending and prevents replay or Penelope state", () => {
  const calypso = atIsland(11);
  const queued = queueLunaEncounter(createLunaSession(JOURNEY_ID), calypso);
  const active = activateLunaEncounter(queued, { state: "authored_fallback", encounter: authoredLunaFallback("calypso_threshold") });
  const ended = resolveIsland(calypso, ISLANDS[11], "STAY_WITH_CALYPSO", "I remain.");
  assert.equal(ended.ending, "calypso");
  assert.equal(ended.currentIsland, 11);
  const reconciled = reconcileLunaSession(active, ended);
  assert.deepEqual(reconciled.seenTriggerIds, ["calypso_threshold"]);
  assert.equal(reconciled.active, null);
  assert.equal(queueLunaEncounter(reconciled, ended), reconciled);
  assert.equal("penelope" in reconciled, false);
});

test("session hydration rejects cross-journey and forged authority state", () => {
  const active = activateLunaEncounter(
    queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(6)),
    { state: "authored_fallback", encounter: authoredLunaFallback("circe_threshold") },
  );
  assert.equal(restoreLunaSession(JSON.stringify(active), SECOND_ID).journeyId, SECOND_ID);
  for (const forged of [
    { ...active, model: "gpt-5.6-sol" },
    { ...active, active: { ...active.active, state: "generated" } },
    { ...active, active: { ...active.active, encounter: { ...active.active?.encounter, actorId: "calypso" } } },
  ]) assert.equal(restoreLunaSession(JSON.stringify(forged), JOURNEY_ID).active, null);
});

test("storage round-trips without touching Journey Memory", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const session = queueLunaEncounter(createLunaSession(JOURNEY_ID), atIsland(6));
  writeLunaSession(storage, session);
  assert.equal(values.has(LUNA_SESSION_KEY), true);
  assert.equal(values.has("odyssey.fourteen-islands.v1"), false);
  assert.equal(readLunaSession(storage, JOURNEY_ID).pending?.triggerId, "circe_threshold");
});

function atIsland(index: number): JourneyMemory {
  let memory = createJourneyMemory("home");
  for (let islandIndex = 0; islandIndex < index; islandIndex += 1) {
    memory = resolveIsland(memory, ISLANDS[islandIndex], "UNRESOLVED", `shore ${islandIndex + 1}`);
  }
  return memory;
}
