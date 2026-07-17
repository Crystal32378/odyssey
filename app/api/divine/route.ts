import { env } from "cloudflare:workers";
import { handleDivineRequest } from "../../../lib/server/divine-handler.ts";
import { handleLunaRequest } from "../../../lib/server/luna-handler.ts";
import {
  createD1EncounterReceiptLedger,
  type EncounterD1Database,
} from "../../../lib/server/encounters/d1-receipt-ledger.ts";

export async function POST(request: Request) {
  const database = (env as { DB?: EncounterD1Database }).DB;
  const dependencies = {
    ledger: createD1EncounterReceiptLedger(database),
    apiKey: process.env.OPENAI_API_KEY,
    logger: console,
  };
  return request.headers.get("x-odyssey-encounter-layer") === "luna"
    ? handleLunaRequest(request, dependencies)
    : handleDivineRequest(request, dependencies);
}
