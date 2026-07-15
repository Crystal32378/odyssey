import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { ISLAND_ART, ISLAND_FOCAL_POINTS } from "../lib/island-art.ts";
import { createJourneyMemory, ISLANDS, resolveIsland, type JourneyMemory, type JourneyStats } from "../lib/journey.ts";

const ORDER = ["troy", "cicones", "lotus", "cyclops", "aeolia", "laestrygonians", "circe", "underworld", "sirens", "scylla", "thrinacia", "calypso", "phaeacia", "ithaca"];
const STAT_KEYS: (keyof JourneyStats)[] = ["metis", "hubris", "nostos", "trust", "temptation", "compassion", "hope"];

test("the canonical map has fourteen unique islands in fixed order", () => {
  assert.equal(ISLANDS.length, 14);
  assert.equal(new Set(ISLANDS.map((island) => island.id)).size, 14);
  assert.deepEqual(ISLANDS.map((island) => island.id), ORDER);
});

test("every canonical island maps to an artwork file", () => {
  assert.deepEqual(Object.keys(ISLAND_ART).sort(), [...ORDER].sort());
  for (const island of ISLANDS) {
    const source = ISLAND_ART[island.id];
    assert.ok(source, `${island.name} is missing an artwork mapping`);
    assert.equal(
      existsSync(join(process.cwd(), "public", source.replace(/^\//, ""))),
      true,
      `${island.name} artwork does not exist at ${source}`,
    );
  }
});

test("every canonical island protects its focal subject on desktop and mobile", () => {
  assert.deepEqual(Object.keys(ISLAND_FOCAL_POINTS).sort(), [...ORDER].sort());
  for (const island of ISLANDS) {
    const focal = ISLAND_FOCAL_POINTS[island.id];
    assert.match(focal.desktop, /^\d+% \d+%$/);
    assert.match(focal.mobile, /^\d+% \d+%$/);
  }
});

test("every island permits UNRESOLVED and only legal stat keys", () => {
  for (const island of ISLANDS) {
    assert.ok(island.allowedActionTags.includes("UNRESOLVED"), island.name);
    for (const delta of Object.values(island.statDeltas)) for (const key of Object.keys(delta)) assert.ok(STAT_KEYS.includes(key as keyof JourneyStats), `${island.name}: ${key}`);
  }
});

test("ordinary islands advance exactly one shore", () => {
  const memory = createJourneyMemory("home");
  const next = resolveIsland(memory, ISLANDS[0], "UNRESOLVED", "I do not know yet.");
  assert.equal(next.currentIsland, 1); assert.equal(next.timeline.length, 1); assert.equal(next.ending, undefined);
});

test("Calypso stay ends the journey; every other action advances to Phaeacia", () => {
  const memory = atIsland(11);
  const stayed = resolveIsland(memory, ISLANDS[11], "STAY_WITH_CALYPSO", "I stay.");
  assert.equal(stayed.ending, "calypso"); assert.equal(stayed.currentIsland, 11); assert.equal(stayed.timeline.length, 12);
  for (const tag of ISLANDS[11].allowedActionTags.filter((tag) => tag !== "STAY_WITH_CALYPSO")) {
    const continued = resolveIsland(memory, ISLANDS[11], tag, "I continue.");
    assert.equal(continued.ending, undefined, tag); assert.equal(continued.currentIsland, 12, tag);
  }
});

test("Ithaca always creates the Ithaca ending and a full timeline", () => {
  const memory = atIsland(13);
  for (const tag of ISLANDS[13].allowedActionTags) {
    const ended = resolveIsland(memory, ISLANDS[13], tag, "I return.");
    assert.equal(ended.ending, "ithaca", tag); assert.equal(ended.timeline.length, 14, tag);
  }
});

function atIsland(index: number): JourneyMemory {
  let memory = createJourneyMemory("home");
  for (let i = 0; i < index; i += 1) memory = resolveIsland(memory, ISLANDS[i], "UNRESOLVED", `shore ${i + 1}`);
  return memory;
}
