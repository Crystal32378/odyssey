import assert from "node:assert/strict";
import test from "node:test";
import {
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
  type EncounterD1Database,
} from "../lib/server/encounters/d1-receipt-ledger.ts";

interface StoredReceipt {
  payloadHash: string;
  status: "pending" | "ready" | "authored_fallback";
  value?: unknown;
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
        updatedAt: input.nowMs,
        expiresAt: input.expiresAtMs,
      });
      return { kind: "winner" };
    }
    if (receipt.payloadHash !== input.payloadHash) return { kind: "hash_conflict" };
    if (receipt.status !== "pending") {
      return { kind: "terminal", status: receipt.status, value: receipt.value as T };
    }
    if (receipt.updatedAt <= input.stalePendingBeforeMs) {
      receipt.status = "authored_fallback";
      receipt.value = input.staleFallback;
      receipt.updatedAt = input.nowMs;
      return { kind: "terminal", status: "authored_fallback", value: input.staleFallback };
    }
    return { kind: "pending", retryAfterMs: receipt.updatedAt - input.stalePendingBeforeMs };
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
