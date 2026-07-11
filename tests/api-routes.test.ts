import assert from "node:assert/strict";
import test from "node:test";
import { isRateLimited, readJsonWithLimit, resetRateLimitForTests } from "../lib/api-boundary.ts";
import { POST as homerPost } from "../app/api/homer/route.ts";
import { POST as audioPost } from "../app/api/homer/audio/route.ts";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;

test.beforeEach(() => {
  resetRateLimitForTests();
  process.env.OPENAI_API_KEY = "test-key";
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
});

function request(path: string, body: unknown, ip = "203.0.113.10") {
  return new Request(`http://odyssey.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });
}

test("64 KiB Homer boundary accepts fourteen long Chinese quotes", async () => {
  const timeline = Array.from({ length: 14 }, (_, index) => ({
    island: `島嶼${index + 1}`,
    action: "UNRESOLVED",
    quote: "海風記得我的歸途，而我仍背負故鄉的名字。".repeat(20),
  }));
  const candidate = request("/api/homer", { phase: "enter", islandIndex: 0, homeGoal: "回到真正的家", timeline });
  const parsed = await readJsonWithLimit(candidate, 64 * 1024);
  assert.equal(parsed.ok, true);
});

test("oversized Homer request returns 413 without calling OpenAI", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("must not call OpenAI"); };
  const response = await homerPost(request("/api/homer", { phase: "enter", islandIndex: 0, homeGoal: "x".repeat(70_000), timeline: [] }));
  assert.equal(response.status, 413);
  assert.equal(calls, 0);
});

test("invalid island index returns 400 without calling OpenAI", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("must not call OpenAI"); };
  const response = await homerPost(request("/api/homer", { phase: "enter", islandIndex: 14, homeGoal: "Home", timeline: [] }));
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("Homer route returns 429 after its namespaced allowance", async () => {
  const ip = "203.0.113.20";
  const seed = request("/api/homer", {}, ip);
  const now = Date.now();
  for (let index = 0; index < 30; index += 1) assert.equal(isRateLimited(seed, "homer", now), false);
  const response = await homerPost(request("/api/homer", { phase: "enter", islandIndex: 0, homeGoal: "Home", timeline: [] }, ip));
  assert.equal(response.status, 429);
});

test("normal Homer request sends only the allowlisted payload to OpenAI", async () => {
  let upstreamBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ narrative: "Ash falls behind you.", question: "What do you carry from Troy?" }) }] }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  const response = await homerPost(request("/api/homer", {
    phase: "enter", islandIndex: 0, homeGoal: "Home", timeline: [],
    allowedActionTags: ["FORGED"], intruder: "do not forward",
  }));
  assert.equal(response.status, 200);
  const input = upstreamBody?.input as Array<{ role: string; content: string }>;
  const sentPayload = JSON.parse(input.find((item) => item.role === "user")?.content || "null");
  assert.deepEqual(sentPayload, { phase: "enter", islandIndex: 0, homeGoal: "Home", timeline: [] });
});

test("audio route returns 413 for oversized input", async () => {
  const response = await audioPost(request("/api/homer/audio", { text: "x".repeat(2_100) }));
  assert.equal(response.status, 413);
});

test("audio route returns 429 after its independent allowance", async () => {
  const ip = "203.0.113.30";
  const seed = request("/api/homer/audio", {}, ip);
  const now = Date.now();
  for (let index = 0; index < 30; index += 1) assert.equal(isRateLimited(seed, "audio", now), false);
  const response = await audioPost(request("/api/homer/audio", { text: "Sing." }, ip));
  assert.equal(response.status, 429);
});
