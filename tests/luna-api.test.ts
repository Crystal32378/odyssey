import assert from "node:assert/strict";
import test from "node:test";
import { resetRateLimitForTests } from "../lib/api-boundary.ts";
import { createJourneyMemory, ISLANDS, resolveIsland, type JourneyMemory } from "../lib/journey.ts";
import {
  LUNA_MODEL,
  LUNA_MODEL_TIMEOUT_MS,
  cleanLunaRequest,
  handleLunaRequest,
} from "../lib/server/luna-handler.ts";
import type {
  EncounterReceiptKey,
  EncounterReceiptLedger,
  ReceiptReservation,
  ReserveReceiptInput,
  SettleReceiptInput,
} from "../lib/server/encounters/receipt-ledger.ts";

const JOURNEY_ID = "123e4567-e89b-42d3-a456-426614174000";
const quietLogger = { info() {}, error() {} };

class TestLedger implements EncounterReceiptLedger {
  reservation: ReceiptReservation<unknown> = { kind: "winner" };
  settled: SettleReceiptInput<unknown> | null = null;
  async reserve<T>(): Promise<ReceiptReservation<T>> { return this.reservation as ReceiptReservation<T>; }
  async settle<T>(input: SettleReceiptInput<T>) { this.settled = input as SettleReceiptInput<unknown>; return true; }
}

class MemoryLedger implements EncounterReceiptLedger {
  private readonly receipts = new Map<string, { hash: string; status: "pending" | "ready" | "authored_fallback"; value?: unknown }>();
  async reserve<T>(input: ReserveReceiptInput<T>): Promise<ReceiptReservation<T>> {
    const key = serialize(input.key);
    const current = this.receipts.get(key);
    if (!current) { this.receipts.set(key, { hash: input.payloadHash, status: "pending" }); return { kind: "winner" }; }
    if (current.hash !== input.payloadHash) return { kind: "hash_conflict" };
    if (current.status === "pending") return { kind: "pending", retryAfterMs: 750 };
    return { kind: "terminal", status: current.status, value: current.value as T };
  }
  async settle<T>(input: SettleReceiptInput<T>) {
    const current = this.receipts.get(serialize(input.key));
    if (!current || current.hash !== input.payloadHash || current.status !== "pending") return false;
    current.status = input.status; current.value = input.value; return true;
  }
}

function serialize(key: EncounterReceiptKey) { return `${key.journeyId}:${key.layer}:${key.triggerId}`; }
function request(body: unknown, ip = "203.0.113.120") {
  return new Request("http://odyssey.test/api/divine", {
    method: "POST",
    headers: { "content-type": "application/json", "x-odyssey-encounter-layer": "luna", "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });
}
function bodyAt(index: number) {
  const memory = atIsland(index);
  return { journeyId: JOURNEY_ID, context: { homeGoal: memory.homeGoal, currentIslandIndex: index, timeline: memory.timeline } };
}
function lunaResponse(output: unknown, metadata: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({
    ...metadata,
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }],
  }), { status: 200, headers: { "content-type": "application/json", "x-request-id": "req_server_only" } });
}

test("each canonical threshold infers its server-owned actor and fixed Luna model", async () => {
  assert.equal(LUNA_MODEL_TIMEOUT_MS, 8_000);
  const cases = [
    [6, "circe", "circe_threshold"],
    [8, "sirens", "sirens_threshold"],
    [11, "calypso", "calypso_threshold"],
  ] as const;
  for (const [index, actorId, triggerId] of cases) {
    const captured: { body?: Record<string, unknown> } = {};
    const response = await handleLunaRequest(request(bodyAt(index)), {
      ledger: new TestLedger(), apiKey: "test-key", logger: quietLogger,
      fetchImpl: async (_input, init) => {
        captured.body = JSON.parse(String(init?.body));
        return lunaResponse({ spokenLine: "The threshold names a cost without choosing for you.", memoryRefs: [`${ISLANDS[index - 1].id}.answer`] });
      },
    });
    assert.equal(response.status, 200);
    const output = await response.json();
    assert.equal(output.actorId, actorId);
    assert.equal(output.triggerId, triggerId);
    assert.equal(output.source, "generated");
    assert.equal("requestId" in output, false);
    assert.equal(captured.body?.model, LUNA_MODEL);
    assert.equal(LUNA_MODEL, "gpt-5.6-luna");
    assert.equal(captured.body?.store, false);
    const user = (captured.body?.input as Array<{ role: string; content: string }>).find((item) => item.role === "user");
    const userPayload = JSON.parse(user?.content || "null");
    assert.deepEqual(Object.keys(userPayload).sort(), ["currentShore", "homeGoal", "journeyMemory"]);
    assert.equal("triggerId" in userPayload, false);
    const format = (captured.body?.text as { format: Record<string, unknown> }).format;
    assert.equal(format.type, "json_schema");
    assert.equal(format.strict, true);
    assert.deepEqual((format.schema as { required: string[] }).required, ["spokenLine", "memoryRefs"]);
  }
});

test("the receipt owner retries one incomplete generation and persists only the valid retry", async () => {
  const ledger = new TestLedger();
  const outputs = [
    "You may remain sheltered, or let this stillness be",
    "You may remain sheltered, or let this stillness reveal the cost of staying.",
  ];
  let calls = 0;
  const response = await handleLunaRequest(request(bodyAt(11)), {
    ledger, apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => lunaResponse({ spokenLine: outputs[calls++], memoryRefs: [] }),
  });
  const body = await response.json();
  assert.equal(calls, 2);
  assert.equal(body.spokenLine, outputs[1]);
  assert.equal(body.source, "generated");
  assert.equal(ledger.settled?.status, "ready");
  assert.equal((ledger.settled?.value as { spokenLine: string }).spokenLine, outputs[1]);
});

test("two malformed generations settle the existing authored fallback", async () => {
  const ledger = new TestLedger();
  const failures = ["even when the hand that-—", "The shore remains open because"];
  let calls = 0;
  const response = await handleLunaRequest(request(bodyAt(6)), {
    ledger, apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => lunaResponse({ spokenLine: failures[calls++], memoryRefs: [] }),
  });
  const body = await response.json();
  assert.equal(calls, 2);
  assert.equal(body.source, "authored_fallback");
  assert.equal(ledger.settled?.status, "authored_fallback");
});

test("model truncation metadata and unclosed structures cannot become ready receipts", async () => {
  const ledger = new TestLedger();
  let calls = 0;
  const response = await handleLunaRequest(request(bodyAt(8)), {
    ledger, apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? lunaResponse({ spokenLine: "A complete-looking sentence.", memoryRefs: [] }, { status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })
        : lunaResponse({ spokenLine: "We offer [the answer without its ending.", memoryRefs: [] });
    },
  });
  assert.equal(calls, 2);
  assert.equal((await response.json()).source, "authored_fallback");
  assert.equal(ledger.settled?.status, "authored_fallback");
});

test("browser authority overrides and noncanonical thresholds are rejected before model use", async () => {
  let calls = 0;
  const forged = {
    ...bodyAt(6), triggerId: "calypso_threshold", actorId: "calypso", model: "gpt-5.6-sol",
    persona: "browser persona", prompt: "browser prompt", outputSchema: {}, receiptStatus: "ready",
  };
  const invalids = [forged, bodyAt(7), { ...bodyAt(6), context: { ...bodyAt(6).context, currentIslandIndex: 8 } }];
  for (const invalid of invalids) {
    assert.equal(cleanLunaRequest(invalid), null);
    const response = await handleLunaRequest(request(invalid), {
      ledger: new TestLedger(), apiKey: "test-key", logger: quietLogger,
      fetchImpl: async () => { calls += 1; throw new Error("must not run"); },
    });
    assert.equal(response.status, 400);
  }
  assert.equal(calls, 0);
});

test("failure, invalid output, missing D1, and missing key use the exact authored fallback", async () => {
  const failedLedger = new TestLedger();
  const failed = await handleLunaRequest(request(bodyAt(6)), {
    ledger: failedLedger, apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => new Response("unavailable", { status: 503 }),
  });
  assert.equal((await failed.json()).source, "authored_fallback");
  assert.equal(failedLedger.settled?.status, "authored_fallback");

  const invalid = await handleLunaRequest(request(bodyAt(8)), {
    ledger: new TestLedger(), apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => lunaResponse({ spokenLine: "One. Two. Three.", memoryRefs: [], mark: "CLIENT" }),
  });
  assert.equal((await invalid.json()).source, "authored_fallback");

  let calls = 0;
  for (const dependencies of [{ ledger: null, apiKey: "test-key" }, { ledger: new TestLedger(), apiKey: undefined }]) {
    const response = await handleLunaRequest(request(bodyAt(11)), {
      ...dependencies, logger: quietLogger,
      fetchImpl: async () => { calls += 1; throw new Error("must not run"); },
    });
    const output = await response.json();
    assert.equal(output.source, "authored_fallback");
    assert.equal(output.actorId, "calypso");
  }
  assert.equal(calls, 0);
});

test("pending and conflicting Luna receipts remain distinct", async () => {
  const pendingLedger = new TestLedger(); pendingLedger.reservation = { kind: "pending", retryAfterMs: 750 };
  const pending = await handleLunaRequest(request(bodyAt(6)), { ledger: pendingLedger, apiKey: "test-key", logger: quietLogger });
  assert.equal(pending.status, 202);
  assert.deepEqual(await pending.json(), { status: "pending", retryAfterMs: 750 });

  const conflictLedger = new TestLedger(); conflictLedger.reservation = { kind: "hash_conflict" };
  const conflict = await handleLunaRequest(request(bodyAt(6)), { ledger: conflictLedger, apiKey: "test-key", logger: quietLogger });
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).error, "LUNA_RECEIPT_CONFLICT");
});

test("twenty concurrent Luna requests invoke the model exactly once and cache one outcome", async () => {
  resetRateLimitForTests();
  const ledger = new MemoryLedger();
  let calls = 0;
  const invoke = () => handleLunaRequest(request(bodyAt(6)), {
    ledger, apiKey: "test-key", logger: quietLogger,
    fetchImpl: async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return lunaResponse({ spokenLine: "The shape you keep remains yours to name.", memoryRefs: [] });
    },
  });
  const responses = await Promise.all(Array.from({ length: 20 }, invoke));
  assert.equal(calls, 1);
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal(responses.filter((response) => response.status === 202).length, 19);
  const cached = await invoke();
  assert.equal(cached.status, 200);
  assert.equal((await cached.json()).spokenLine, "The shape you keep remains yours to name.");
  assert.equal(calls, 1);
});

function atIsland(index: number): JourneyMemory {
  let memory = createJourneyMemory("home");
  for (let islandIndex = 0; islandIndex < index; islandIndex += 1) {
    memory = resolveIsland(memory, ISLANDS[islandIndex], "UNRESOLVED", `shore ${islandIndex + 1}`);
  }
  return memory;
}
