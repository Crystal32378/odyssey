import { env } from "cloudflare:workers";
import { handleDivineRequest } from "../../../lib/server/divine-handler.ts";
import {
  createD1EncounterReceiptLedger,
  type EncounterD1Database,
} from "../../../lib/server/encounters/d1-receipt-ledger.ts";

export async function POST(request: Request) {
  const database = (env as { DB?: EncounterD1Database }).DB;
  return handleDivineRequest(request, {
    ledger: createD1EncounterReceiptLedger(database),
    apiKey: process.env.OPENAI_API_KEY,
    logger: console,
  });
}
