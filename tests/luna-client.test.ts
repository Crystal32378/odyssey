import assert from "node:assert/strict";
import test from "node:test";
import {
  LUNA_DEFAULT_RETRY_AFTER_MS,
  authoredLunaFallback,
  requestLunaEncounter,
  validateLunaEncounterResponse,
} from "../lib/luna-client.ts";
import { composeLunaEncounter } from "../lib/luna.ts";

const VALID_LINE = "One quiet threshold reveals the cost of stopping here, while the road beyond remains entirely yours to choose.";
import { createJourneyMemory, ISLANDS, resolveIsland, type JourneyMemory } from "../lib/journey.ts";

const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";

function payloadAt(index: number) {
  const memory = atIsland(index);
  return { journeyId: JOURNEY_ID, context: { homeGoal: memory.homeGoal, currentIslandIndex: index, timeline: memory.timeline } };
}

test("Luna client sends only journeyId and canonical context to the shared encounter route", async () => {
  let sentUrl: RequestInfo | URL | undefined;
  let sentInit: RequestInit | undefined;
  const expected = composeLunaEncounter("circe_threshold", { spokenLine: VALID_LINE, memoryRefs: [] }, []);
  const result = await requestLunaEncounter(payloadAt(6), {
    minimumPendingMs: 0,
    fetcher: async (input, init) => { sentUrl = input; sentInit = init; return Response.json(expected); },
  });
  assert.equal(result.state, "generated");
  assert.equal(sentUrl, "/api/divine");
  assert.equal(new Headers(sentInit?.headers).get("x-odyssey-encounter-layer"), "luna");
  const body = JSON.parse(String(sentInit?.body));
  assert.deepEqual(Object.keys(body).sort(), ["context", "journeyId"]);
  assert.equal("triggerId" in body, false);
  assert.equal("model" in body, false);
  assert.equal("persona" in body, false);
});

test("generated and server-authored fallback remain explicitly distinguishable", async () => {
  const generated = composeLunaEncounter("sirens_threshold", { spokenLine: VALID_LINE, memoryRefs: [] }, []);
  const generatedResult = await requestLunaEncounter(payloadAt(8), { minimumPendingMs: 0, fetcher: async () => Response.json(generated) });
  assert.equal(generatedResult.state, "generated");
  assert.equal(generatedResult.encounter.source, "generated");

  const fallback = authoredLunaFallback("sirens_threshold");
  const fallbackResult = await requestLunaEncounter(payloadAt(8), { minimumPendingMs: 0, fetcher: async () => Response.json(fallback) });
  assert.equal(fallbackResult.state, "authored_fallback");
  assert.equal(fallbackResult.encounter.source, "authored_fallback");
});

test("pending receipts poll with one unchanged payload until one terminal result", async () => {
  const bodies: string[] = [];
  let calls = 0;
  const generated = composeLunaEncounter("calypso_threshold", { spokenLine: VALID_LINE, memoryRefs: [] }, []);
  const result = await requestLunaEncounter(payloadAt(11), {
    minimumPendingMs: 0,
    sleep: async () => {},
    fetcher: async (_input, init) => {
      calls += 1; bodies.push(String(init?.body));
      return calls < 3 ? Response.json({ status: "pending", retryAfterMs: 250 }, { status: 202 }) : Response.json(generated);
    },
  });
  assert.equal(result.state, "generated");
  assert.equal(calls, 3);
  assert.equal(new Set(bodies).size, 1);
});

test("transport deadline becomes a failed authored outcome and late data cannot replace it", async () => {
  const late = composeLunaEncounter("circe_threshold", { spokenLine: VALID_LINE, memoryRefs: [] }, []);
  const result = await requestLunaEncounter(payloadAt(6), {
    timeoutMs: 2,
    minimumPendingMs: 0,
    fetcher: async () => ({
      status: 200,
      headers: new Headers(),
      json: async () => new Promise((resolve) => setTimeout(() => resolve(late), 20)),
    }) as unknown as Response,
  });
  assert.equal(result.state, "failed");
  assert.equal(result.encounter.spokenLine, authoredLunaFallback("circe_threshold").spokenLine);
  assert.notEqual(result.encounter.spokenLine, "Late generated words.");
});

test("forged actor, mark, source, asset, and memory references are rejected", () => {
  const context = payloadAt(6).context;
  const valid = composeLunaEncounter("circe_threshold", { spokenLine: VALID_LINE, memoryRefs: [] }, []);
  for (const forged of [
    { ...valid, actorId: "calypso" },
    { ...valid, mark: "CLIENT MARK" },
    { ...valid, source: "ready" },
    { ...valid, presentation: { ...valid.presentation, imageSrc: "/client.png" } },
    { ...valid, memoryRefs: ["private.fact"] },
  ]) assert.equal(validateLunaEncounterResponse(forged, "circe_threshold", context), null);
});

test("invalid HTTP responses retry using the stable bounded default", async () => {
  let calls = 0;
  const waits: number[] = [];
  let now = 0;
  const result = await requestLunaEncounter(payloadAt(6), {
    timeoutMs: LUNA_DEFAULT_RETRY_AFTER_MS * 2,
    minimumPendingMs: 0,
    now: () => now,
    sleep: async (milliseconds) => { waits.push(milliseconds); now += milliseconds; },
    fetcher: async () => { calls += 1; return new Response("bad", { status: 500 }); },
  });
  assert.equal(result.state, "failed");
  assert.equal(calls, 2);
  assert.deepEqual(waits, [LUNA_DEFAULT_RETRY_AFTER_MS, LUNA_DEFAULT_RETRY_AFTER_MS]);
});

function atIsland(index: number): JourneyMemory {
  let memory = createJourneyMemory("home");
  for (let islandIndex = 0; islandIndex < index; islandIndex += 1) {
    memory = resolveIsland(memory, ISLANDS[islandIndex], "UNRESOLVED", `shore ${islandIndex + 1}`);
  }
  return memory;
}
