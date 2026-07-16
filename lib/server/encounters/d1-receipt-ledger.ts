import type {
  EncounterReceiptKey,
  EncounterReceiptLedger,
  ReceiptReservation,
  ReserveReceiptInput,
  SettleReceiptInput,
} from "./receipt-ledger";

interface ReceiptRow {
  payload_hash: string;
  status: "pending" | "ready" | "authored_fallback";
  result_json: string | null;
  updated_at: number;
}

interface D1RunResultLike {
  meta?: { changes?: number };
}

export interface EncounterD1PreparedStatement {
  bind(...values: Array<string | number | null>): EncounterD1PreparedStatement;
  run(): Promise<D1RunResultLike>;
  first<T>(): Promise<T | null>;
}

export interface EncounterD1Database {
  prepare(query: string): EncounterD1PreparedStatement;
}

function changes(result: D1RunResultLike): number {
  return Number(result.meta?.changes ?? 0);
}

function bindKey(statement: EncounterD1PreparedStatement, key: EncounterReceiptKey) {
  return statement.bind(key.journeyId, key.layer, key.triggerId);
}

function terminalReservation<T>(row: ReceiptRow): ReceiptReservation<T> {
  if (row.status === "pending") {
    throw new Error("A pending receipt cannot be deserialized as terminal.");
  }
  if (!row.result_json) throw new Error("A terminal receipt is missing its result.");
  return { kind: "terminal", status: row.status, value: JSON.parse(row.result_json) as T };
}

export class D1EncounterReceiptLedger implements EncounterReceiptLedger {
  private readonly db: EncounterD1Database;

  constructor(db: EncounterD1Database) {
    this.db = db;
  }

  async reserve<T>(input: ReserveReceiptInput<T>): Promise<ReceiptReservation<T>> {
    const { key } = input;

    await this.db
      .prepare(
        "DELETE FROM encounter_receipts WHERE journey_id = ? AND layer = ? AND trigger_id = ? AND expires_at <= ?",
      )
      .bind(key.journeyId, key.layer, key.triggerId, input.nowMs)
      .run();

    const inserted = await this.db
      .prepare(
        `INSERT OR IGNORE INTO encounter_receipts
          (journey_id, layer, trigger_id, payload_hash, status, result_json, created_at, updated_at, expires_at)
         VALUES (?, ?, ?, ?, 'pending', NULL, ?, ?, ?)`,
      )
      .bind(
        key.journeyId,
        key.layer,
        key.triggerId,
        input.payloadHash,
        input.nowMs,
        input.nowMs,
        input.expiresAtMs,
      )
      .run();

    if (changes(inserted) === 1) return { kind: "winner" };

    let row = await bindKey(
      this.db.prepare(
        "SELECT payload_hash, status, result_json, updated_at FROM encounter_receipts WHERE journey_id = ? AND layer = ? AND trigger_id = ?",
      ),
      key,
    ).first<ReceiptRow>();

    if (!row) throw new Error("The encounter receipt disappeared during reservation.");
    if (row.payload_hash !== input.payloadHash) return { kind: "hash_conflict" };
    if (row.status !== "pending") return terminalReservation<T>(row);

    if (row.updated_at <= input.stalePendingBeforeMs) {
      const expired = await this.db
        .prepare(
          `UPDATE encounter_receipts
              SET status = 'authored_fallback', result_json = ?, updated_at = ?
            WHERE journey_id = ? AND layer = ? AND trigger_id = ?
              AND payload_hash = ? AND status = 'pending' AND updated_at <= ?`,
        )
        .bind(
          JSON.stringify(input.staleFallback),
          input.nowMs,
          key.journeyId,
          key.layer,
          key.triggerId,
          input.payloadHash,
          input.stalePendingBeforeMs,
        )
        .run();

      if (changes(expired) === 1) {
        return { kind: "terminal", status: "authored_fallback", value: input.staleFallback };
      }

      row = await bindKey(
        this.db.prepare(
          "SELECT payload_hash, status, result_json, updated_at FROM encounter_receipts WHERE journey_id = ? AND layer = ? AND trigger_id = ?",
        ),
        key,
      ).first<ReceiptRow>();
      if (!row) throw new Error("The encounter receipt disappeared after pending recovery.");
      if (row.payload_hash !== input.payloadHash) return { kind: "hash_conflict" };
      if (row.status !== "pending") return terminalReservation<T>(row);
    }

    return {
      kind: "pending",
      retryAfterMs: Math.max(250, row.updated_at - input.stalePendingBeforeMs),
    };
  }

  async settle<T>(input: SettleReceiptInput<T>): Promise<boolean> {
    const { key } = input;
    const result = await this.db
      .prepare(
        `UPDATE encounter_receipts
            SET status = ?, result_json = ?, updated_at = ?
          WHERE journey_id = ? AND layer = ? AND trigger_id = ?
            AND payload_hash = ? AND status = 'pending'`,
      )
      .bind(
        input.status,
        JSON.stringify(input.value),
        input.nowMs,
        key.journeyId,
        key.layer,
        key.triggerId,
        input.payloadHash,
      )
      .run();
    return changes(result) === 1;
  }
}

export function createD1EncounterReceiptLedger(db: EncounterD1Database | undefined) {
  return db ? new D1EncounterReceiptLedger(db) : null;
}

export async function cleanupExpiredEncounterReceipts(db: EncounterD1Database, nowMs: number): Promise<number> {
  const result = await db
    .prepare("DELETE FROM encounter_receipts WHERE expires_at <= ?")
    .bind(nowMs)
    .run();
  return changes(result);
}
