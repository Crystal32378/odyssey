import assert from "node:assert/strict";
import test from "node:test";
import { readJsonWithLimit, resetRateLimitForTests, isRateLimited } from "../lib/api-boundary.ts";
import { cleanPayload } from "../lib/homer-payload.ts";
import { createJourneyMemory } from "../lib/journey.ts";

test("request bodies over the server limit are rejected before parsing", async () => {
  const request = new Request("http://odyssey.test/api/homer", {
    method: "POST",
    body: JSON.stringify({ text: "x".repeat(50) }),
  });

  const parsed = await readJsonWithLimit(request, 10);
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.status, 413);
});

test("rate limiting blocks repeated requests from the same client", () => {
  resetRateLimitForTests();
  const request = new Request("http://odyssey.test/api/homer", { headers: { "cf-connecting-ip": "203.0.113.7" } });
  for (let i = 0; i < 30; i += 1) assert.equal(isRateLimited(request, "homer", 1_000), false);
  assert.equal(isRateLimited(request, "homer", 1_000), true);
  assert.equal(isRateLimited(request, "audio", 1_000), false);
});

test("Homer payload reconstruction drops untrusted client fields", () => {
  const clean = cleanPayload({
    phase: "resolve",
    islandIndex: 0,
    homeGoal: " Return home ",
    timeline: [],
    playerInput: " I carry the ashes. ",
    allowedActionTags: ["CLIENT_FORGED_TAG"],
    hugeUntrustedBlob: "x".repeat(100),
  }, "resolve");

  assert.deepEqual(clean, {
    phase: "resolve",
    islandIndex: 0,
    homeGoal: "Return home",
    timeline: [],
    playerInput: "I carry the ashes.",
  });
});

test("summary payload accepts only strict Journey Memory shape", () => {
  const memory = createJourneyMemory("Return to the work");
  const clean = cleanPayload({ phase: "summary", memory: { ...memory, intruder: "no" } }, "summary");
  assert.deepEqual(clean, { phase: "summary", memory });

  const invalid = cleanPayload({ phase: "summary", memory: { ...memory, stats: { ...memory.stats, unknown: 1 } } }, "summary");
  assert.equal(invalid, null);
});
