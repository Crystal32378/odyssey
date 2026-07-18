import { isRateLimited, readJsonWithLimit } from "../api-boundary.ts";
import {
  composeLunaEncounter,
  getLunaTriggerForIslandIndex,
  LUNA_REGISTRY,
  validateLunaModelOutput,
  type LunaEncounter,
  type LunaTriggerId,
} from "../luna.ts";
import { createJourneyMemory, ISLANDS, resolveIsland, type TimelineEntry } from "../journey.ts";
import {
  EncounterReceiptHashConflictError,
  executeEncounterAtMostOnce,
  type EncounterReceiptLedger,
} from "./encounters/receipt-ledger.ts";

export const LUNA_MODEL = "gpt-5.6-luna";
export const LUNA_MAX_BODY_BYTES = 24 * 1024;
export const LUNA_MODEL_TIMEOUT_MS = 8_000;

export interface CleanLunaRequest {
  readonly journeyId: string;
  readonly triggerId: LunaTriggerId;
  readonly context: {
    readonly homeGoal: string;
    readonly currentIslandIndex: number;
    readonly timeline: readonly TimelineEntry[];
  };
}

export interface LunaHandlerDependencies {
  readonly ledger: EncounterReceiptLedger | null | undefined;
  readonly apiKey?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly logger?: Pick<Console, "info" | "error">;
}

interface OpenAIResponseBody {
  status?: string;
  incomplete_details?: unknown;
  output?: Array<{ type?: string; status?: string; content?: Array<{ type?: string; text?: string }> }>;
}

const SERVER_PROMPTS: Readonly<Record<LunaTriggerId, { persona: string; lore: string }>> = Object.freeze({
  circe_threshold: {
    persona: "Circe speaks as a sovereign keeper of thresholds: transformation has terms, appetite has direction, and agency includes knowing what must not be surrendered.",
    lore: "At Circe's hall, hospitality, appetite, transformation, and the risk of forgetting the voyage coexist. She does not decide the route or diagnose the traveler.",
  },
  sirens_threshold: {
    persona: "The Sirens speak as a plural, compelling chorus of knowledge, recognition, and certainty. They clarify the cost of stopping without shaming curiosity or desire.",
    lore: "The Sirens promise complete knowledge and recognition. Their danger is not that knowledge is evil, but that perfect understanding can ask the voyage to stop.",
  },
  calypso_threshold: {
    persona: "Calypso speaks with genuine tenderness and protection: rest is real, time can pause, and safety can make an unfinished return feel unnecessary.",
    lore: "Calypso offers shelter and suspended time. Staying is an existing valid ending; she cannot grade it, force continuation, or alter the Engine's decision.",
  },
});

export async function handleLunaRequest(request: Request, dependencies: LunaHandlerDependencies): Promise<Response> {
  const parsedBody = await readJsonWithLimit(request, LUNA_MAX_BODY_BYTES);
  if (!parsedBody.ok) return json({ error: "LUNA_INPUT_INVALID", message: `Invalid ${parsedBody.field}.` }, parsedBody.status);

  const payload = cleanLunaRequest(parsedBody.value);
  if (!payload) return json({ error: "LUNA_INPUT_INVALID", message: "The Luna threshold context is not canonical." }, 400);

  const fallback = composeLunaEncounter(payload.triggerId, null, []);
  let payloadHash: string;
  try {
    payloadHash = await hashLunaPayload(payload);
  } catch (error) {
    dependencies.logger?.error("Luna payload hashing failed", { triggerId: payload.triggerId, error });
    return json(fallback);
  }

  try {
    const execution = await executeEncounterAtMostOnce<LunaEncounter>({
      ledger: dependencies.ledger,
      key: { journeyId: payload.journeyId, layer: "luna", triggerId: payload.triggerId },
      payloadHash,
      authoredFallback: fallback,
      now: dependencies.now,
      pendingTimeoutMs: dependencies.timeoutMs ?? LUNA_MODEL_TIMEOUT_MS,
      invoke: (remainingMs) => {
        if (isRateLimited(request, "luna")) throw new Error("The Luna model rate limit has been reached.");
        return invokeLuna(payload, {
          ...dependencies,
          timeoutMs: Math.max(1, Math.min(remainingMs, dependencies.timeoutMs ?? LUNA_MODEL_TIMEOUT_MS)),
        });
      },
    });

    if (execution.kind === "pending") {
      return json(
        { status: "pending", retryAfterMs: execution.retryAfterMs },
        202,
        { "Retry-After": String(Math.max(1, Math.ceil(execution.retryAfterMs / 1_000))) },
      );
    }
    return json(execution.value);
  } catch (error) {
    if (error instanceof EncounterReceiptHashConflictError) {
      return json({ error: "LUNA_RECEIPT_CONFLICT", message: "This Luna threshold already has a different receipt." }, 409);
    }
    dependencies.logger?.error("Luna encounter execution failed", { triggerId: payload.triggerId, error });
    return json(fallback);
  }
}

export function cleanLunaRequest(raw: unknown): CleanLunaRequest | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["context", "journeyId"]) || !isRecord(raw.context)) return null;
  if (!hasExactKeys(raw.context, ["currentIslandIndex", "homeGoal", "timeline"])) return null;

  const journeyId = cleanJourneyId(raw.journeyId);
  const homeGoal = cleanText(raw.context.homeGoal, 300);
  const currentIslandIndex = raw.context.currentIslandIndex;
  const timeline = cleanCanonicalTimeline(raw.context.timeline);
  if (!journeyId || !homeGoal || !Number.isInteger(currentIslandIndex) || !timeline) return null;

  const triggerId = getLunaTriggerForIslandIndex(currentIslandIndex as number);
  if (!triggerId || timeline.length !== currentIslandIndex) return null;
  if (!reachesCanonicalThreshold(homeGoal, timeline, currentIslandIndex as number)) return null;

  return {
    journeyId,
    triggerId,
    context: { homeGoal, currentIslandIndex: currentIslandIndex as number, timeline },
  };
}

export async function hashLunaPayload(payload: CleanLunaRequest) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function invokeLuna(payload: CleanLunaRequest, dependencies: LunaHandlerDependencies): Promise<LunaEncounter> {
  if (!dependencies.apiKey) throw new Error("Luna API key is unavailable.");
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch;
  const timeoutMs = dependencies.timeoutMs ?? LUNA_MODEL_TIMEOUT_MS;
  const registry = LUNA_REGISTRY[payload.triggerId];
  const memory = compressedMemory(payload.context.timeline);
  const allowedMemoryRefs = memory.map((item) => item.ref);
  const prompt = SERVER_PROMPTS[payload.triggerId];
  const deadlineAt = Date.now() + timeoutMs;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) throw new DOMException("The Luna request exceeded its authoritative window.", "TimeoutError");
    const controller = new AbortController();
    const result = await withAbortTimeout((async () => {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${dependencies.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: LUNA_MODEL,
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content: [
              "You render one brief literary threshold encounter in Odyssey. You deepen the dilemma already present without changing the route, choice, score, history, statistics, or ending.",
              `Actor: ${registry.displayName}.`,
              `Persona: ${prompt.persona}`,
              `Canonical lore capsule: ${prompt.lore}`,
              ...registry.languageRules,
              "Do not summarize the journey. Leave space for the traveler rather than resolving the tension.",
              "Return only the strict structured output. memoryRefs may cite only references supplied by the user payload.",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              homeGoal: payload.context.homeGoal,
              currentShore: ISLANDS[payload.context.currentIslandIndex].name,
              journeyMemory: memory,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "luna_threshold",
            strict: true,
            schema: lunaOutputSchema(allowedMemoryRefs),
          },
        },
        max_output_tokens: 180,
      }),
    });
    const requestId = response.headers.get("x-request-id");
    if (!response.ok) {
      dependencies.logger?.error("Luna API failure", { status: response.status, requestId, triggerId: registry.triggerId });
      throw new Error("Luna request failed.");
    }
    return { requestId, body: await response.json() as OpenAIResponseBody };
    })(), controller, remainingMs);

    const rawText = outputText(result.body);
    let rawOutput: unknown = null;
    if (rawText) {
      try { rawOutput = JSON.parse(rawText); } catch { /* Invalid output is retried once by the receipt owner. */ }
    }

    if (!isIncompleteLunaResponse(result.body) && validateLunaModelOutput(rawOutput, allowedMemoryRefs)) {
      dependencies.logger?.info("Luna threshold completed", { requestId: result.requestId, triggerId: registry.triggerId, attempt: attempt + 1 });
      return composeLunaEncounter(payload.triggerId, rawOutput, allowedMemoryRefs);
    }
    dependencies.logger?.error("Luna returned incomplete or invalid structured output", {
      requestId: result.requestId, triggerId: registry.triggerId, attempt: attempt + 1,
    });
  }
  throw new Error("Luna returned incomplete or invalid structured output twice.");
}

function reachesCanonicalThreshold(homeGoal: string, timeline: readonly TimelineEntry[], islandIndex: number) {
  let memory = createJourneyMemory(homeGoal);
  for (let index = 0; index < timeline.length; index += 1) {
    if (memory.ending || memory.currentIsland !== index) return false;
    const entry = timeline[index];
    memory = resolveIsland(memory, ISLANDS[index], entry.action, entry.quote);
  }
  return !memory.ending && memory.currentIsland === islandIndex;
}

function compressedMemory(timeline: readonly TimelineEntry[]) {
  const start = Math.max(0, timeline.length - 4);
  return timeline.slice(start).map((entry, offset) => {
    const islandIndex = start + offset;
    return {
      ref: `${ISLANDS[islandIndex].id}.answer`,
      island: entry.island,
      action: entry.action,
      quote: entry.quote.slice(0, 320),
    };
  });
}

function lunaOutputSchema(memoryRefs: readonly string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      spokenLine: {
        type: "string",
        minLength: 1,
        maxLength: 180,
        description: "One or two short sentences, 18 to 32 English words, expressing one unresolved character-specific tension.",
      },
      memoryRefs: {
        type: "array",
        maxItems: 1,
        items: { type: "string", enum: memoryRefs },
      },
    },
    required: ["spokenLine", "memoryRefs"],
  };
}

function cleanCanonicalTimeline(raw: unknown): TimelineEntry[] | null {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > ISLANDS.length - 1) return null;
  const timeline: TimelineEntry[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const value = raw[index];
    const island = ISLANDS[index];
    if (!isRecord(value) || !hasExactKeys(value, ["action", "island", "quote"])) return null;
    const islandName = cleanText(value.island, 80);
    const action = cleanText(value.action, 80);
    const quote = cleanText(value.quote, 1_000);
    if (!islandName || islandName !== island.name || !action || !island.allowedActionTags.includes(action) || !quote) return null;
    timeline.push({ island: islandName, action, quote });
  }
  return timeline;
}

async function withAbortTimeout<T>(operation: Promise<T>, controller: AbortController, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("The Luna request exceeded its authoritative window.", "TimeoutError"));
    }, Math.max(1, timeoutMs));
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function outputText(data: OpenAIResponseBody) {
  return data.output?.find((item) => item.type === "message")?.content?.find((item) => item.type === "output_text")?.text;
}

function isIncompleteLunaResponse(data: OpenAIResponseBody) {
  return data.status === "incomplete"
    || data.incomplete_details != null
    || Boolean(data.output?.some((item) => item.status === "incomplete"));
}

function cleanJourneyId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized) ? normalized : null;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalized)) return null;
  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function json(value: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}
