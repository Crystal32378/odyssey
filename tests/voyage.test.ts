import assert from "node:assert/strict";
import test from "node:test";
import { advanceCrossingGate, canBeginCrossing, createCrossingGate, crossingCanSettle, getVoyageLeg, recoverJourneyPhase, shouldAnimateVoyage, VOYAGE_CAMERA_MOBILE_START_SCALE, VOYAGE_CAMERA_START_SCALE, VOYAGE_CAMERA_ZOOM_OUT_AT, VOYAGE_DURATION_MS, VOYAGE_MOTION_SAMPLE_COUNT, VOYAGE_POINTS, VOYAGE_SAFE_MIN_Y } from "../lib/voyage.ts";

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
    assert.equal(leg.from.x, VOYAGE_POINTS[index].x);
    assert.equal(leg.to.x, VOYAGE_POINTS[index + 1].x);
    assert.ok(leg.from.y >= VOYAGE_SAFE_MIN_Y);
    assert.ok(leg.to.y >= VOYAGE_SAFE_MIN_Y);
    assert.match(leg.path, /^M .+ Q .+$/);
    assert.equal(leg.motionPoints.length, VOYAGE_MOTION_SAMPLE_COUNT);
    assert.deepEqual(leg.motionPoints[0], leg.from);
    assert.deepEqual(leg.motionPoints.at(-1), leg.to);
  }
  assert.throws(() => getVoyageLeg(0, 2));
});

test("the voyage camera begins close and reserves the final passage for zooming out", () => {
  assert.ok(VOYAGE_CAMERA_START_SCALE >= 1.45 && VOYAGE_CAMERA_START_SCALE <= 1.55);
  assert.ok(VOYAGE_CAMERA_MOBILE_START_SCALE > VOYAGE_CAMERA_START_SCALE);
  assert.equal(VOYAGE_CAMERA_ZOOM_OUT_AT, 70);
});

test("top-edge crossings keep the whole vessel inside the presentation safe zone", () => {
  for (const [fromIndex, toIndex] of [[4, 5], [5, 6], [6, 7], [12, 13]] as const) {
    const leg = getVoyageLeg(fromIndex, toIndex);
    for (const point of leg.motionPoints) assert.ok(point.y >= VOYAGE_SAFE_MIN_Y - 3.8);
  }
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
