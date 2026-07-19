import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  activateDivineEncounter,
  createDivineSession,
  dismissDivineEncounter,
  queueDivineEncounter,
} from "../lib/divine-session.ts";
import { composeDivineEncounter } from "../lib/divine.ts";
import { createJourneyMemory, getIsland, resolveIsland } from "../lib/journey.ts";

const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";

function poseidonContext() {
  let memory = createJourneyMemory("a home that still knows me");
  while (memory.currentIsland < 4) {
    const island = getIsland(memory.currentIsland);
    memory = resolveIsland(memory, island, island.allowedActionTags[0], `answer at ${island.name}`);
  }
  return { homeGoal: memory.homeGoal, currentIslandIndex: memory.currentIsland, timeline: memory.timeline };
}

test("Divine requests require a hydrated stable island and stale state is reset without Journey Memory", () => {
  assert.match(source, /const stableDivineRequestState = phase === "island" && Boolean\(memory && scene\);/);
  assert.match(source, /if \(!hydrated \|\| !stableDivineRequestState \|\| !divineSession\?\.pending\) return;/);
  assert.match(source, /if \(divineRequestRef\.current === requestKey\) return;/);
  assert.match(source, /restoredMemory\s*\? recoverDivineEncounter\(readDivineSession\(sessionStorage\), restoredMemory\)\s*: resetDivineSession\(sessionStorage\)/);
});

test("the voyage remains the render and settlement gate before Divine Presence", () => {
  const resolveIndex = source.indexOf("const updated = resolveIsland(");
  const triggerIndex = source.indexOf("const divineTrigger = getDivineTriggerForResolvedDeparture(");
  const voyageRenderIndex = source.indexOf('if (phase === "voyaging" && voyage)');
  const divineRenderIndex = source.indexOf("if (divineSession?.active || divineSession?.pending)");

  assert.ok(resolveIndex >= 0 && resolveIndex < triggerIndex, "the resolved Engine result must precede trigger eligibility");
  assert.ok(voyageRenderIndex >= 0 && voyageRenderIndex < divineRenderIndex, "voyage must own the screen until settlement");
  assert.match(source, /if \(!crossingCanSettle\(crossing\.gate\)\) return;/);
  assert.match(source, /crossing\.divineTrigger && crossing\.resolvedMemory && !crossing\.ending/);
  assert.doesNotMatch(source, /\/divine\/v1\/|preloadDivine|decodeDivine/);
});

test("dismissing a pending presence makes a late async result harmless", () => {
  const pending = queueDivineEncounter(
    createDivineSession(() => JOURNEY_ID),
    "cyclops_departure",
    poseidonContext(),
  );
  const dismissed = dismissDivineEncounter(pending);
  const lateEncounter = composeDivineEncounter("cyclops_departure", {
    spokenLine: "The sea heard the name you carried from the cave.",
    mark: "THE SEA KNOWS YOUR NAME",
    memoryRefs: ["cyclops.answer"],
  }, ["troy.answer", "cicones.answer", "lotus.answer", "cyclops.answer"]);

  assert.deepEqual(dismissed.seenTriggerIds, ["cyclops_departure"]);
  assert.equal(activateDivineEncounter(dismissed, lateEncounter), dismissed);
  assert.match(source, /clearDivineSession\(sessionStorage\); divineRequestRef\.current = null; updateDivineSession\(null\)/);
});
