import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const encounterReceipts = sqliteTable(
  "encounter_receipts",
  {
    journeyId: text("journey_id").notNull(),
    layer: text("layer", { enum: ["divine", "luna"] }).notNull(),
    triggerId: text("trigger_id").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: text("status", { enum: ["pending", "ready", "authored_fallback"] }).notNull(),
    resultJson: text("result_json"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.journeyId, table.layer, table.triggerId] }),
    check("encounter_receipts_layer_check", sql`${table.layer} IN ('divine', 'luna')`),
    check(
      "encounter_receipts_status_check",
      sql`${table.status} IN ('pending', 'ready', 'authored_fallback')`,
    ),
    index("encounter_receipts_expires_at_idx").on(table.expiresAt),
  ],
);
