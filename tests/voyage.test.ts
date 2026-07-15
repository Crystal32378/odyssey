import assert from "node:assert/strict";
import test from "node:test";
import { advanceCrossingGate, canBeginCrossing, createCrossingGate, crossingCanSettle, getVoyageLeg, recoverJourneyPhase, shouldAnimateVoyage, VOYAGE_DURATION_MS, VOYAGE_POINTS } from "../lib/voyage.ts";

test("the presentation route has one point for every canonical shore", () => {
  assert.equal(VOYAGE_POINTS.length, 14);
  for (const point of VOYAGE_POINTS) {
    assert.ok(point.x >= 0 && point.x <= 100);
    assert.ok(point.y >= 0 && point.y <= 66.67);
  }
});

test("every voyage leg connects consecutive shores", () => {
  for (let index = 0; index < 13; index += 1) {
    const leg = getVoyageLeg(index, index + 1);
    assert.equal(leg.from, VOYAGE_POINTS[index]);
    assert.equal(leg.to, VOYAGE_POINTS[index + 1]);
    assert.match(leg.path, /^M .+ Q .+$/);
  }
  assert.throws(() => getVoyageLeg(0, 2));
});

test("voyage motion is restrained and removed for reduced motion", () => {
  assert.ok(VOYAGE_DURATION_MS >= 3600 && VOYAGE_DURATION_MS <= 4200);
  assert.equal(shouldAnimateVoyage(false), true);
  assert.equal(shouldAnimateVoyage(true), false);
});

test("a fast API response cannot cut the voyage short", () => {
  const resolved = advanceCrossingGate(createCrossingGate(false), { type: "api-resolved" });
  assert.equal(crossingCanSettle(resolved), false);
  assert.equal(crossingCanSettle(advanceCrossingGate(resolved, { type: "visual-complete" })), true);
});

test("a slow API response waits at the destination after the voyage", () => {
  const arrived = advanceCrossingGate(createCrossingGate(false), { type: "visual-complete" });
  assert.equal(arrived.status, "pending");
  assert.equal(crossingCanSettle(arrived), false);
  assert.equal(crossingCanSettle(advanceCrossingGate(arrived, { type: "api-resolved" })), true);
});

test("a failed API passage never settles and remains retryable", () => {
  const failed = advanceCrossingGate(createCrossingGate(false), { type: "api-failed" });
  assert.deepEqual(failed, { visualDone: true, status: "error" });
  assert.equal(crossingCanSettle(failed), false);
});

test("an active crossing rejects duplicate submission", () => {
  assert.equal(canBeginCrossing("island", false), true);
  assert.equal(canBeginCrossing("island", true), false);
  assert.equal(canBeginCrossing("voyaging", false), false);
});

test("reduced motion enters the visible waiting state without spatial motion", () => {
  const gate = createCrossingGate(true);
  assert.deepEqual(gate, { visualDone: true, status: "pending" });
  assert.equal(crossingCanSettle(gate), false);
});

test("refresh recovers presentation-only phases to stable states", () => {
  assert.equal(recoverJourneyPhase("loading", false), "map");
  assert.equal(recoverJourneyPhase("loading", true), "island");
  assert.equal(recoverJourneyPhase("resolving", true), "island");
  assert.equal(recoverJourneyPhase("voyaging", true), "island");
  assert.equal(recoverJourneyPhase("generating_end", true), "ending");
  assert.equal(recoverJourneyPhase("island", true), "island");
});
