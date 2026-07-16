import assert from "node:assert/strict";
import test from "node:test";
import {
  activateDivineEncounter,
  clearDivineSession,
  createDivineSession,
  dismissDivineEncounter,
  DIVINE_SESSION_KEY,
  queueDivineEncounter,
  readDivineSession,
  recoverDivineEncounter,
  resetDivineSession,
  restoreDivineSession,
  validateDivineSession,
  writeDivineSession,
  type DivineSessionStorage,
} from "../lib/divine-session.ts";
import { composeDivineEncounter, getDivineTriggerForResolvedDeparture } from "../lib/divine.ts";
import { createJourneyMemory, getIsland, resolveIsland } from "../lib/journey.ts";

const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174001";
const idFactory = () => JOURNEY_ID;

function contextAt(destinationIndex: number) {
  let memory = createJourneyMemory("a home that still knows me");
  while (memory.currentIsland < destinationIndex) {
    const island = getIsland(memory.currentIsland);
    memory = resolveIsland(memory, island, island.allowedActionTags[0], `answer at ${island.name}`);
  }
  return { homeGoal: memory.homeGoal, currentIslandIndex: memory.currentIsland, timeline: memory.timeline };
}

function poseidon() {
  return composeDivineEncounter("cyclops_departure", {
    spokenLine: "The sea heard the name you carried from the cave.",
    mark: "THE SEA KNOWS YOUR NAME",
    memoryRefs: ["cyclops.answer"],
  }, ["troy.answer", "cicones.answer", "lotus.answer", "cyclops.answer"]);
}

class MemoryStorage implements DivineSessionStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) || null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("a Divine session uses its own key and a UUID v4 journey ID", () => {
  const session = createDivineSession(idFactory);
  assert.equal(DIVINE_SESSION_KEY, "odyssey.divine-presence.v1");
  assert.equal(session.journeyId, JOURNEY_ID);
  assert.deepEqual(session.seenTriggerIds, []);
  assert.throws(() => createDivineSession(() => "browser-chosen-profile"), /UUID v4/);
});

test("pending and active encounters survive strict session hydration", () => {
  const pending = queueDivineEncounter(createDivineSession(idFactory), "cyclops_departure", contextAt(4));
  assert.equal(restoreDivineSession(JSON.stringify(pending), () => SECOND_JOURNEY_ID).pending?.triggerId, "cyclops_departure");

  const active = activateDivineEncounter(pending, poseidon());
  const restored = restoreDivineSession(JSON.stringify(active), () => SECOND_JOURNEY_ID);
  assert.equal(restored.journeyId, JOURNEY_ID);
  assert.equal(restored.pending, null);
  assert.equal(restored.active?.actorId, "poseidon");
});

test("hydration rejects extra fields, noncanonical context, duplicate seen IDs, and forged actors", () => {
  const pending = queueDivineEncounter(createDivineSession(idFactory), "cyclops_departure", contextAt(4));
  const invalidSnapshots = [
    { ...pending, model: "gpt-5.6-sol" },
    { ...pending, pending: { ...pending.pending, context: { ...pending.pending?.context, currentIslandIndex: 5 } } },
    { ...pending, seenTriggerIds: ["cyclops_departure", "cyclops_departure"] },
    { ...activateDivineEncounter(pending, poseidon()), active: { ...poseidon(), actorId: "athena" } },
  ];
  for (const invalid of invalidSnapshots) assert.equal(validateDivineSession(invalid), null);

  const recovered = restoreDivineSession(JSON.stringify(invalidSnapshots[0]), () => SECOND_JOURNEY_ID);
  assert.equal(recovered.journeyId, SECOND_JOURNEY_ID);
  assert.equal(recovered.pending, null);
});

test("dismiss records one trigger exactly once and prevents it from being queued again", () => {
  const queued = queueDivineEncounter(createDivineSession(idFactory), "cyclops_departure", contextAt(4));
  const active = activateDivineEncounter(queued, poseidon());
  const dismissed = dismissDivineEncounter(active);
  const dismissedAgain = dismissDivineEncounter(dismissed);
  const requeued = queueDivineEncounter(dismissedAgain, "cyclops_departure", contextAt(4));

  assert.deepEqual(dismissed.seenTriggerIds, ["cyclops_departure"]);
  assert.deepEqual(dismissedAgain.seenTriggerIds, ["cyclops_departure"]);
  assert.equal(dismissed.active, null);
  assert.equal(requeued, dismissedAgain);
});

test("refresh after resolve recovers the canonical pending encounter from advanced memory", () => {
  let memory = createJourneyMemory("a home that still knows me");
  while (memory.currentIsland < 4) {
    const island = getIsland(memory.currentIsland);
    memory = resolveIsland(memory, island, island.allowedActionTags[0], `answer at ${island.name}`);
  }

  const recovered = recoverDivineEncounter(createDivineSession(idFactory), memory);
  assert.equal(recovered.pending?.triggerId, "cyclops_departure");
  assert.equal(recovered.pending?.context.currentIslandIndex, 4);

  const dismissed = dismissDivineEncounter(activateDivineEncounter(recovered, poseidon()));
  assert.equal(recoverDivineEncounter(dismissed, memory), dismissed);
});

test("session storage helpers round-trip and reset without touching the Journey Memory key", () => {
  const storage = new MemoryStorage();
  storage.setItem("odyssey.fourteen-islands.v1", "journey-memory-remains");
  const queued = queueDivineEncounter(createDivineSession(idFactory), "cyclops_departure", contextAt(4));
  writeDivineSession(storage, queued);
  assert.deepEqual(readDivineSession(storage, () => SECOND_JOURNEY_ID), queued);

  const reset = resetDivineSession(storage, () => SECOND_JOURNEY_ID);
  assert.equal(storage.getItem(DIVINE_SESSION_KEY), null);
  assert.equal(storage.getItem("odyssey.fourteen-islands.v1"), "journey-memory-remains");
  assert.equal(reset.journeyId, SECOND_JOURNEY_ID);

  writeDivineSession(storage, reset);
  clearDivineSession(storage);
  assert.equal(storage.getItem(DIVINE_SESSION_KEY), null);
});

test("the Calypso ending never queues Ino merely to complete the six-deity set", () => {
  assert.equal(getDivineTriggerForResolvedDeparture({
    departureIslandIndex: 11,
    resolvedCurrentIsland: 11,
    resolvedEnding: "calypso",
  }), null);

  let memory = createJourneyMemory("a home that still knows me");
  while (memory.currentIsland < 11) {
    const island = getIsland(memory.currentIsland);
    memory = resolveIsland(memory, island, island.allowedActionTags[0], `answer at ${island.name}`);
  }
  const calypso = getIsland(memory.currentIsland);
  memory = resolveIsland(memory, calypso, "STAY_WITH_CALYPSO", "I remain on this shore.");
  assert.equal(memory.ending, "calypso");
  assert.equal(recoverDivineEncounter(createDivineSession(idFactory), memory).pending, null);
});
