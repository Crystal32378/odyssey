import assert from "node:assert/strict";
import test from "node:test";
import {
  composeDivineEncounter,
  DIVINE_REGISTRY,
  DIVINE_TRIGGER_IDS,
  getDivineTriggerForResolvedDeparture,
  validateDivineModelOutput,
} from "../lib/divine.ts";
import { createJourneyMemory, ISLANDS, resolveIsland, type JourneyMemory } from "../lib/journey.ts";

const EXPECTED = [
  ["cyclops_departure", "poseidon", 3, 4],
  ["circe_threshold", "hermes", 5, 6],
  ["thrinacia_arrival", "helios", 9, 10],
  ["thrinacia_departure", "zeus", 10, 11],
  ["calypso_departure", "ino", 11, 12],
  ["ithaca_threshold", "athena", 12, 13],
] as const;

test("the divine registry locks six canonical actors to exact resolved crossings", () => {
  assert.deepEqual(DIVINE_TRIGGER_IDS, EXPECTED.map(([triggerId]) => triggerId));
  assert.equal(Object.keys(DIVINE_REGISTRY).length, 6);
  for (const [triggerId, actorId, departureIslandIndex, destinationIslandIndex] of EXPECTED) {
    const entry = DIVINE_REGISTRY[triggerId];
    assert.equal(entry.actorId, actorId);
    assert.equal(entry.departureIslandIndex, departureIslandIndex);
    assert.equal(entry.destinationIslandIndex, destinationIslandIndex);
    assert.equal(entry.triggerId, triggerId);
    assert.equal(entry.layer, "divine");
    assert.match(entry.presentation.imageSrc, new RegExp(`^/divine/v1/${actorId}\\.webp$`));
  }
});

test("Helios appears on arrival at Thrinacia, before the Thrinacia choice", () => {
  const memory = atIsland(9);
  const resolved = resolveIsland(memory, ISLANDS[9], "UNRESOLVED", "I steer onward.");
  assert.equal(resolved.currentIsland, 10);
  assert.equal(getDivineTriggerForResolvedDeparture({
    departureIslandIndex: memory.currentIsland,
    resolvedCurrentIsland: resolved.currentIsland,
    resolvedEnding: resolved.ending,
  }), "thrinacia_arrival");
});

test("staying with Calypso excludes Ino and every later divine presence", () => {
  const memory = atIsland(11);
  const stayed = resolveIsland(memory, ISLANDS[11], "STAY_WITH_CALYPSO", "I remain.");
  assert.equal(stayed.ending, "calypso");
  assert.equal(getDivineTriggerForResolvedDeparture({
    departureIslandIndex: memory.currentIsland,
    resolvedCurrentIsland: stayed.currentIsland,
    resolvedEnding: stayed.ending,
  }), null);

  const left = resolveIsland(memory, ISLANDS[11], "LEAVE_CALYPSO", "I leave.");
  assert.equal(getDivineTriggerForResolvedDeparture({
    departureIslandIndex: memory.currentIsland,
    resolvedCurrentIsland: left.currentIsland,
    resolvedEnding: left.ending,
  }), "calypso_departure");
});

test("the complete Ithaca route yields each divine trigger exactly once", () => {
  let memory = createJourneyMemory("home");
  const triggers: string[] = [];
  while (!memory.ending) {
    const departureIslandIndex = memory.currentIsland;
    const next = resolveIsland(memory, ISLANDS[departureIslandIndex], "UNRESOLVED", `shore ${departureIslandIndex + 1}`);
    const trigger = getDivineTriggerForResolvedDeparture({
      departureIslandIndex,
      resolvedCurrentIsland: next.currentIsland,
      resolvedEnding: next.ending,
    });
    if (trigger) triggers.push(trigger);
    memory = next;
  }
  assert.equal(memory.ending, "ithaca");
  assert.deepEqual(triggers, DIVINE_TRIGGER_IDS);
});

test("server-owned actor, trigger, voice, persona, and presentation cannot be overridden", () => {
  const encounter = composeDivineEncounter("cyclops_departure", {
    spokenLine: "The sea has heard the name you chose.",
    mark: "THE DEBT BEGINS",
    memoryRefs: ["cyclops.answer"],
    actorId: "athena",
    triggerId: "ithaca_threshold",
    voiceFamily: "marin",
    personaKey: "client.forged",
    presentation: { imageSrc: "https://attacker.invalid/false-god.png" },
  }, ["cyclops.answer"]);

  assert.equal(encounter.source, "authored_fallback");
  assert.equal(encounter.actorId, "poseidon");
  assert.equal(encounter.triggerId, "cyclops_departure");
  assert.equal(encounter.presentation.voiceFamily, "cedar");
  assert.equal(encounter.presentation.imageSrc, "/divine/v1/poseidon.webp");
  assert.equal("personaKey" in encounter, false);
});

test("manual validation accepts only bounded output and allowlisted memory references", () => {
  assert.deepEqual(validateDivineModelOutput({
    spokenLine: "Your answer crossed the water.",
    mark: "THE SEA REMEMBERS",
    memoryRefs: ["cyclops.answer"],
  }, ["cyclops.answer"]), {
    spokenLine: "Your answer crossed the water.",
    mark: "THE SEA REMEMBERS",
    memoryRefs: ["cyclops.answer"],
  });
  assert.equal(validateDivineModelOutput({
    spokenLine: "One. Two. Three.",
    mark: "TOO MANY SENTENCES",
    memoryRefs: [],
  }, []), null);
  assert.equal(validateDivineModelOutput({
    spokenLine: "The sea remembers.",
    mark: "THE SEA REMEMBERS",
    memoryRefs: ["client.forged"],
  }, ["cyclops.answer"]), null);
});

function atIsland(index: number): JourneyMemory {
  let memory = createJourneyMemory("home");
  for (let i = 0; i < index; i += 1) memory = resolveIsland(memory, ISLANDS[i], "UNRESOLVED", `shore ${i + 1}`);
  return memory;
}
