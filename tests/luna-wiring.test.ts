import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createJourneyMemory, ISLANDS, resolveIsland } from "../lib/journey.ts";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../app/api/divine/route.ts", import.meta.url), "utf8");
const journeyBefore = readFileSync(new URL("../lib/journey.ts", import.meta.url), "utf8");

test("stable Homer witness precedes the explicit Luna threshold, then choice and response", () => {
  const witness = page.indexOf('<section className="homer-witness');
  const threshold = page.indexOf("<LunaThreshold");
  const choice = page.indexOf('{lunaSettled && <section className="choice-beat');
  const response = page.indexOf('{lunaSettled && <div className="response-band');
  assert.ok(witness >= 0 && witness < threshold && threshold < choice && choice < response);
  assert.match(page, /const lunaSettled = !lunaTriggerId \|\| lunaSeen \|\| Boolean\(lunaActive\)/);
  assert.match(page, /onOpen=\{openLunaThreshold\}/);
});

test("no Luna request begins before a stable island and an explicit queued threshold", () => {
  assert.match(page, /const stableLunaRequestState = phase === "island" && Boolean\(memory && scene\)/);
  assert.match(page, /if \(!hydrated \|\| !stableLunaRequestState \|\| !lunaSession\?\.pending\) return;/);
  assert.match(page, /if \(lunaRequestRef\.current === requestKey\) return;/);
  assert.doesNotMatch(page, /preloadLuna|decodeLuna|LUNA_ASSETS/);
});

test("shared route dispatch cannot give the browser model, persona, prompt, or trigger authority", () => {
  assert.match(route, /request\.headers\.get\("x-odyssey-encounter-layer"\) === "luna"/);
  assert.match(route, /\? handleLunaRequest\(request, dependencies\)/);
  assert.match(route, /: handleDivineRequest\(request, dependencies\)/);
  assert.doesNotMatch(page, /LUNA_MODEL|personaKey|loreKey|prompt:/);
});

test("refresh, reset, and late completion are bounded to the tab-local Luna session", () => {
  assert.match(page, /readLunaSession\(sessionStorage, nextDivine\.journeyId\)/);
  assert.match(page, /writeLunaSession\(sessionStorage, lunaSession\)/);
  assert.match(page, /clearLunaSession\(sessionStorage\)/);
  assert.match(page, /if \(!current \|\| current\.journeyId !== journeyId\) return current;/);
  assert.match(page, /reconcileLunaSession\(lunaSessionRef\.current, updated\)/);
});

test("Calypso stay and all Engine-owned state remain unchanged", () => {
  let memory = createJourneyMemory("home");
  while (memory.currentIsland < 11) memory = resolveIsland(memory, ISLANDS[memory.currentIsland], "UNRESOLVED", "answer");
  const beforeStats = { ...memory.stats };
  const ended = resolveIsland(memory, ISLANDS[11], "STAY_WITH_CALYPSO", "I remain.");
  assert.equal(ended.ending, "calypso");
  assert.equal(ended.currentIsland, 11);
  assert.equal(ended.timeline.length, 12);
  assert.equal(ended.stats.temptation, beforeStats.temptation + 3);
  assert.equal(ended.stats.nostos, beforeStats.nostos - 2);
  assert.match(page, /if \(memory\.ending\) return <Ending/);
  assert.match(page, /\{!calypso && card && <PenelopeRecognition\/>\}/);
  assert.doesNotMatch(journeyBefore, /luna|threshold|receipt/i);
});

test("Homer, Divine, voyage, Journey Card, Penelope, and Restart render paths remain present", () => {
  for (const contract of [
    "requestHomer<HomerTransition>",
    "getDivineTriggerForResolvedDeparture",
    "<DivinePresenceStage",
    "<VoyageOverlay",
    "<JourneyCardResult",
    "<PenelopeRecognition/>",
    "BEGIN ANOTHER ODYSSEY",
  ]) assert.ok(page.includes(contract), contract);
});
