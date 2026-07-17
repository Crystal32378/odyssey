import assert from "node:assert/strict";
import test from "node:test";
import {
  composeLunaEncounter,
  getLunaTriggerForIslandIndex,
  LUNA_REGISTRY,
  validateLunaModelOutput,
} from "../lib/luna.ts";

const expected = [
  ["circe_threshold", "circe", 6, "THE SHAPE YOU KEEP", "/luna/v1/wine.webp"],
  ["sirens_threshold", "sirens", 8, "WE KNOW THE ANSWER", "/luna/v1/tail.webp"],
  ["calypso_threshold", "calypso", 11, "THE SHORE WITHOUT TOMORROW", "/luna/v1/veil.webp"],
] as const;

test("Luna registry fixes exactly three literary thresholds and their presentation", () => {
  assert.equal(Object.keys(LUNA_REGISTRY).length, 3);
  for (const [triggerId, actorId, islandIndex, mark, imageSrc] of expected) {
    const entry = LUNA_REGISTRY[triggerId];
    assert.equal(entry.layer, "luna");
    assert.equal(entry.actorId, actorId);
    assert.equal(entry.islandIndex, islandIndex);
    assert.equal(entry.mark, mark);
    assert.equal(entry.presentation.imageSrc, imageSrc);
    assert.equal(getLunaTriggerForIslandIndex(islandIndex), triggerId);
    assert.equal(entry.fallback.memoryRefs.length, 0);
  }
  assert.equal(getLunaTriggerForIslandIndex(7), null);
});

test("Luna output accepts only bounded lines and allowlisted journey references", () => {
  const refs = ["lotus.answer", "cyclops.answer"];
  assert.deepEqual(validateLunaModelOutput({ spokenLine: "You kept one direction through the change.", memoryRefs: refs }, refs), {
    spokenLine: "You kept one direction through the change.", memoryRefs: refs,
  });
  for (const invalid of [
    { spokenLine: "Valid.", memoryRefs: [], mark: "CLIENT MARK" },
    { spokenLine: "One. Two. Three.", memoryRefs: [] },
    { spokenLine: "Invented.", memoryRefs: ["private.fact"] },
    { spokenLine: "Duplicate.", memoryRefs: ["lotus.answer", "lotus.answer"] },
  ]) assert.equal(validateLunaModelOutput(invalid, refs), null);
});

test("marks, actors, assets, and authored fallbacks remain server-owned", () => {
  for (const [triggerId] of expected) {
    const fallback = composeLunaEncounter(triggerId, null, []);
    assert.equal(fallback.source, "authored_fallback");
    assert.equal(fallback.actorId, LUNA_REGISTRY[triggerId].actorId);
    assert.equal(fallback.mark, LUNA_REGISTRY[triggerId].mark);
    assert.deepEqual(fallback.presentation, LUNA_REGISTRY[triggerId].presentation);
  }
  assert.equal(LUNA_REGISTRY.circe_threshold.fallback.spokenLine, "Drink, and the shape you guard will answer before your name does. Cross my threshold only if you know what in you must not be surrendered.");
  assert.equal(LUNA_REGISTRY.sirens_threshold.fallback.spokenLine, "We know the answer your own memory cannot finish. Listen, and we will give every loss a meaning, every question an end.");
  assert.equal(LUNA_REGISTRY.calypso_threshold.fallback.spokenLine, "Rest here, and departure will slowly begin to feel like harm. I offer no chain-only a shore gentle enough to make the road seem unnecessary.");
});
