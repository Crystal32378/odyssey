export const ENCOUNTER_RECEIPT_TTL_MS = 24 * 60 * 60 * 1_000;
export const ENCOUNTER_PENDING_TIMEOUT_MS = 45_000;

export type EncounterLayer = "divine" | "luna";
export type EncounterReceiptStatus = "pending" | "ready" | "authored_fallback";

export interface EncounterReceiptKey {
  journeyId: string;
  layer: EncounterLayer;
  triggerId: string;
}

export interface ReserveReceiptInput<T> {
  key: EncounterReceiptKey;
  payloadHash: string;
  nowMs: number;
  expiresAtMs: number;
  stalePendingBeforeMs: number;
  staleFallback: T;
}

export type ReceiptReservation<T> =
  | { kind: "winner" }
  | { kind: "pending"; retryAfterMs: number }
  | { kind: "terminal"; status: "ready" | "authored_fallback"; value: T }
  | { kind: "hash_conflict" };

export interface SettleReceiptInput<T> {
  key: EncounterReceiptKey;
  payloadHash: string;
  status: "ready" | "authored_fallback";
  value: T;
  nowMs: number;
}

export interface EncounterReceiptLedger {
  reserve<T>(input: ReserveReceiptInput<T>): Promise<ReceiptReservation<T>>;
  settle<T>(input: SettleReceiptInput<T>): Promise<boolean>;
}

export type EncounterExecution<T> =
  | {
      kind: "ready";
      source: "generated" | "authored_fallback";
      value: T;
      cached: boolean;
    }
  | { kind: "pending"; retryAfterMs: number };

export class EncounterReceiptHashConflictError extends Error {
  readonly status = 409;

  constructor() {
    super("The encounter receipt key already exists with a different payload.");
    this.name = "EncounterReceiptHashConflictError";
  }
}

interface ExecuteEncounterInput<T> {
  ledger: EncounterReceiptLedger | null | undefined;
  key: EncounterReceiptKey;
  payloadHash: string;
  authoredFallback: T;
  invoke: () => Promise<T>;
  now?: () => number;
  receiptTtlMs?: number;
  pendingTimeoutMs?: number;
}

function fallbackExecution<T>(value: T, cached = false): EncounterExecution<T> {
  return { kind: "ready", source: "authored_fallback", value, cached };
}

export async function executeEncounterAtMostOnce<T>({
  ledger,
  key,
  payloadHash,
  authoredFallback,
  invoke,
  now = Date.now,
  receiptTtlMs = ENCOUNTER_RECEIPT_TTL_MS,
  pendingTimeoutMs = ENCOUNTER_PENDING_TIMEOUT_MS,
}: ExecuteEncounterInput<T>): Promise<EncounterExecution<T>> {
  if (!ledger) return fallbackExecution(authoredFallback);

  const reservedAt = now();
  let reservation: ReceiptReservation<T>;

  try {
    reservation = await ledger.reserve({
      key,
      payloadHash,
      nowMs: reservedAt,
      expiresAtMs: reservedAt + receiptTtlMs,
      stalePendingBeforeMs: reservedAt - pendingTimeoutMs,
      staleFallback: authoredFallback,
    });
  } catch {
    return fallbackExecution(authoredFallback);
  }

  if (reservation.kind === "hash_conflict") {
    throw new EncounterReceiptHashConflictError();
  }
  if (reservation.kind === "pending") return reservation;
  if (reservation.kind === "terminal") {
    return reservation.status === "ready"
      ? { kind: "ready", source: "generated", value: reservation.value, cached: true }
      : fallbackExecution(reservation.value, true);
  }

  let generated: T;
  try {
    generated = await invoke();
  } catch {
    try {
      await ledger.settle({
        key,
        payloadHash,
        status: "authored_fallback",
        value: authoredFallback,
        nowMs: now(),
      });
    } catch {
      // A failed ledger must never turn an upstream failure into a journey blocker.
    }
    return fallbackExecution(authoredFallback);
  }

  try {
    const settled = await ledger.settle({
      key,
      payloadHash,
      status: "ready",
      value: generated,
      nowMs: now(),
    });
    if (!settled) return fallbackExecution(authoredFallback, true);
  } catch {
    return fallbackExecution(authoredFallback);
  }

  return { kind: "ready", source: "generated", value: generated, cached: false };
}
