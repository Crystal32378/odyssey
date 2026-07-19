import assert from "node:assert/strict";
import test from "node:test";
import {
  ENCOUNTER_PENDING_TIMEOUT_MS,
  EncounterReceiptHashConflictError,
  executeEncounterAtMostOnce,
  type EncounterReceiptKey,
  type EncounterReceiptLedger,
  type ReceiptReservation,
  type ReserveReceiptInput,
  type SettleReceiptInput,
} from "../lib/server/encounters/receipt-ledger.ts";
import {
  cleanupExpiredEncounterReceipts,
  D1EncounterReceiptLedger,
  type EncounterD1Database,
} from "../lib/server/encounters/d1-receipt-ledger.ts";

interface StoredReceipt {
  payloadHash: string;
  status: "pending" | "ready" | "authored_fallback";
  value?: unknown;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

function serializedKey(key: EncounterReceiptKey) {
  return `${key.journeyId}:${key.layer}:${key.triggerId}`;
}

class MemoryReceiptLedger implements EncounterReceiptLedger {
  private readonly receipts = new Map<string, StoredReceipt>();

  async reserve<T>(input: ReserveReceiptInput<T>): Promise<ReceiptReservation<T>> {
    const key = serializedKey(input.key);
    let receipt = this.receipts.get(key);
    if (receipt && receipt.expiresAt <= input.nowMs) {
      this.receipts.delete(key);
      receipt = undefined;
    }
    if (!receipt) {
      this.receipts.set(key, {
        payloadHash: input.payloadHash,
        status: "pending",
        createdAt: input.nowMs,
        updatedAt: input.nowMs,
        expiresAt: input.expiresAtMs,
      });
      return { kind: "winner" };
    }
    if (receipt.payloadHash !== input.payloadHash) return { kind: "hash_conflict" };
    if (receipt.status !== "pending") {
      return { kind: "terminal", status: receipt.status, value: receipt.value as T };
    }
    if (receipt.createdAt <= input.stalePendingBeforeMs) {
      receipt.status = "authored_fallback";
      receipt.value = input.staleFallback;
      receipt.updatedAt = input.nowMs;
      return { kind: "terminal", status: "authored_fallback", value: input.staleFallback };
    }
    return { kind: "pending", retryAfterMs: receipt.createdAt - input.stalePendingBeforeMs };
  }

  async settle<T>(input: SettleReceiptInput<T>): Promise<boolean> {
    const receipt = this.receipts.get(serializedKey(input.key));
    if (!receipt || receipt.payloadHash !== input.payloadHash || receipt.status !== "pending") return false;
    receipt.status = input.status;
    receipt.value = input.value;
    receipt.updatedAt = input.nowMs;
    return true;
  }
}

const key: EncounterReceiptKey = {
  journeyId: "journey-7f1c",
  layer: "divine",
  triggerId: "cyclops_departure",
};
const fallback = { spokenLine: "The sea keeps its authored warning." };

test("twenty concurrent requests permit exactly one paid invocation", async () => {
  assert.equal(ENCOUNTER_PENDING_TIMEOUT_MS, 8_000);
  const ledger = new MemoryReceiptLedger();
  let invocations = 0;
  const execute = () => executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => {
      invocations += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return { spokenLine: "The sea knows the name you gave." };
    },
    now: () => 10_000,
  });

  const results = await Promise.all(Array.from({ length: 20 }, execute));
  assert.equal(invocations, 1);
  assert.equal(results.filter((result) => result.kind === "ready" && result.source === "generated").length, 1);
  assert.equal(results.filter((result) => result.kind === "pending").length, 19);

  const cached = await execute();
  assert.deepEqual(cached, {
    kind: "ready",
    source: "generated",
    value: { spokenLine: "The sea knows the name you gave." },
    cached: true,
  });
  assert.equal(invocations, 1);
});

test("an active pending receipt returns pending without invoking again", async () => {
  const ledger = new MemoryReceiptLedger();
  let release!: () => void;
  let invocations = 0;
  const blocked = executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => {
      invocations += 1;
      await new Promise<void>((resolve) => { release = resolve; });
      return { spokenLine: "Generated." };
    },
    now: () => 20_000,
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  const pending = await executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
    now: () => 20_100,
  });
  assert.equal(pending.kind, "pending");
  assert.equal(invocations, 1);
  release();
  await blocked;
});

test("a reused receipt key with a different payload is a 409 conflict", async () => {
  const ledger = new MemoryReceiptLedger();
  let release!: () => void;
  const first = executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => {
      await new Promise<void>((resolve) => { release = resolve; });
      return { spokenLine: "Generated." };
    },
    now: () => 30_000,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  await assert.rejects(
    executeEncounterAtMostOnce({
      ledger,
      key,
      payloadHash: "hash-b",
      authoredFallback: fallback,
      invoke: async () => ({ spokenLine: "Must not run." }),
      now: () => 30_100,
    }),
    EncounterReceiptHashConflictError,
  );
  release();
  await first;
});

test("an expired pending receipt becomes terminal fallback and is never regenerated", async () => {
  const ledger = new MemoryReceiptLedger();
  let release!: () => void;
  let invocations = 0;
  const first = executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => {
      invocations += 1;
      await new Promise<void>((resolve) => { release = resolve; });
      return { spokenLine: "Arrived too late." };
    },
    now: () => 40_000,
    pendingTimeoutMs: 1_000,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  const recovered = await executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
    now: () => 41_001,
    pendingTimeoutMs: 1_000,
  });
  assert.deepEqual(recovered, { kind: "ready", source: "authored_fallback", value: fallback, cached: true });
  assert.equal(invocations, 1);

  release();
  assert.deepEqual(await first, { kind: "ready", source: "authored_fallback", value: fallback, cached: true });
  assert.equal(invocations, 1);
});

test("a model result at the authoritative deadline settles fallback and cannot arrive late", async () => {
  const ledger = new MemoryReceiptLedger();
  let current = 50_000;
  let invocations = 0;
  const result = await executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    pendingTimeoutMs: 1_000,
    now: () => current,
    invoke: async () => {
      invocations += 1;
      current = 51_000;
      return { spokenLine: "Arrived at the deadline." };
    },
  });

  assert.deepEqual(result, { kind: "ready", source: "authored_fallback", value: fallback, cached: false });
  const cached = await executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    pendingTimeoutMs: 1_000,
    now: () => current,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
  });
  assert.deepEqual(cached, { kind: "ready", source: "authored_fallback", value: fallback, cached: true });
  assert.equal(invocations, 1);
});

test("a model result before the authoritative deadline settles generated", async () => {
  const ledger = new MemoryReceiptLedger();
  let current = 60_000;
  const generated = { spokenLine: "Arrived before the deadline." };
  const result = await executeEncounterAtMostOnce({
    ledger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    pendingTimeoutMs: 1_000,
    now: () => current,
    invoke: async () => {
      current = 60_999;
      return generated;
    },
  });
  assert.deepEqual(result, { kind: "ready", source: "generated", value: generated, cached: false });
});

test("a reservation that consumes the authority window settles fallback without invoking", async () => {
  let current = 70_000;
  let invocations = 0;
  const slowLedger: EncounterReceiptLedger = {
    async reserve() {
      current += 1_001;
      return { kind: "winner" };
    },
    async settle() { return true; },
  };
  const result = await executeEncounterAtMostOnce({
    ledger: slowLedger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    pendingTimeoutMs: 1_000,
    now: () => current,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
  });
  assert.deepEqual(result, { kind: "ready", source: "authored_fallback", value: fallback, cached: false });
  assert.equal(invocations, 0);
});

test("a slow reservation passes only the remaining authority budget to the model", async () => {
  let current = 80_000;
  let receivedBudget = 0;
  const delayedLedger: EncounterReceiptLedger = {
    async reserve() {
      current += 400;
      return { kind: "winner" };
    },
    async settle() { return true; },
  };
  const generated = { spokenLine: "Arrived inside the remaining window." };
  const result = await executeEncounterAtMostOnce({
    ledger: delayedLedger,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    pendingTimeoutMs: 1_000,
    now: () => current,
    invoke: async (remainingMs) => {
      receivedBudget = remainingMs;
      current = 80_999;
      return generated;
    },
  });
  assert.equal(receivedBudget, 600);
  assert.deepEqual(result, { kind: "ready", source: "generated", value: generated, cached: false });
});

test("D1 stale recovery is anchored to created_at rather than a refreshed updated_at", async () => {
  const queries: string[] = [];
  const boundValues: unknown[][] = [];
  const db: EncounterD1Database = {
    prepare(query) {
      queries.push(query);
      const values: unknown[] = [];
      boundValues.push(values);
      return {
        bind(...items) { values.push(...items); return this; },
        async run() {
          if (/INSERT OR IGNORE/.test(query)) return { meta: { changes: 0 } };
          if (/status = 'authored_fallback'/.test(query)) return { meta: { changes: 1 } };
          return { meta: { changes: 0 } };
        },
        async first<T>() {
          return {
            payload_hash: "hash-a",
            status: "pending",
            result_json: null,
            created_at: 1_000,
            updated_at: 99_000,
          } as T;
        },
      };
    },
  };
  const ledger = new D1EncounterReceiptLedger(db);
  const reservation = await ledger.reserve({
    key,
    payloadHash: "hash-a",
    nowMs: 9_001,
    expiresAtMs: 100_000,
    stalePendingBeforeMs: 1_001,
    staleFallback: fallback,
  });
  assert.deepEqual(reservation, { kind: "terminal", status: "authored_fallback", value: fallback });
  const staleUpdateIndex = queries.findIndex((query) => /status = 'authored_fallback'/.test(query));
  assert.ok(staleUpdateIndex >= 0);
  assert.match(queries[staleUpdateIndex], /payload_hash = \?/);
  assert.match(queries[staleUpdateIndex], /status = 'pending'/);
  assert.match(queries[staleUpdateIndex], /created_at <= \?/);
  assert.doesNotMatch(queries[staleUpdateIndex], /updated_at <= \?/);
  assert.equal(boundValues[staleUpdateIndex].at(-1), 1_001);
});

test("a D1 stale-recovery loser rereads and returns the winning terminal oracle", async () => {
  const generated = { spokenLine: "The stored oracle wins the recovery race." };
  let selects = 0;
  const db: EncounterD1Database = {
    prepare(query) {
      return {
        bind() { return this; },
        async run() {
          if (/INSERT OR IGNORE/.test(query)) return { meta: { changes: 0 } };
          if (/status = 'authored_fallback'/.test(query)) return { meta: { changes: 0 } };
          return { meta: { changes: 0 } };
        },
        async first<T>() {
          selects += 1;
          return (selects === 1
            ? {
                payload_hash: "hash-a",
                status: "pending",
                result_json: null,
                created_at: 1_000,
                updated_at: 99_000,
              }
            : {
                payload_hash: "hash-a",
                status: "ready",
                result_json: JSON.stringify(generated),
                created_at: 1_000,
                updated_at: 9_001,
              }) as T;
        },
      };
    },
  };
  const ledger = new D1EncounterReceiptLedger(db);
  const reservation = await ledger.reserve({
    key,
    payloadHash: "hash-a",
    nowMs: 9_001,
    expiresAtMs: 100_000,
    stalePendingBeforeMs: 1_001,
    staleFallback: fallback,
  });
  assert.deepEqual(reservation, { kind: "terminal", status: "ready", value: generated });
  assert.equal(selects, 2);
});

test("a missing or failed D1 ledger returns authored fallback without model use", async () => {
  let invocations = 0;
  const missing = await executeEncounterAtMostOnce({
    ledger: null,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
  });
  assert.deepEqual(missing, { kind: "ready", source: "authored_fallback", value: fallback, cached: false });

  const unavailable: EncounterReceiptLedger = {
    async reserve() { throw new Error("D1 unavailable"); },
    async settle() { throw new Error("D1 unavailable"); },
  };
  const failed = await executeEncounterAtMostOnce({
    ledger: unavailable,
    key,
    payloadHash: "hash-a",
    authoredFallback: fallback,
    invoke: async () => { invocations += 1; return { spokenLine: "Must not run." }; },
  });
  assert.deepEqual(failed, { kind: "ready", source: "authored_fallback", value: fallback, cached: false });
  assert.equal(invocations, 0);
});

test("physical cleanup deletes only receipts at or before the supplied cutoff", async () => {
  let sql = "";
  let cutoff: unknown;
  const db: EncounterD1Database = {
    prepare(query) {
      sql = query;
      return {
        bind(value) {
          cutoff = value;
          return this;
        },
        async run() { return { meta: { changes: 3 } }; },
        async first() { return null; },
      };
    },
  };

  const deleted = await cleanupExpiredEncounterReceipts(db, 86_400_000);
  assert.match(sql, /DELETE FROM encounter_receipts WHERE expires_at <= \?/);
  assert.equal(cutoff, 86_400_000);
  assert.equal(deleted, 3);
});
