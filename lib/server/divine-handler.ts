import { isRateLimited, readJsonWithLimit } from "../api-boundary.ts";
import {
  composeDivineEncounter,
  DIVINE_REGISTRY,
  getDivineTriggerForResolvedDeparture,
  getDivineRegistryEntry,
  validateDivineModelOutput,
  type DivineEncounter,
  type DivineTriggerId,
} from "../divine.ts";
import {
  createJourneyMemory,
  ISLANDS,
  resolveIsland,
  type TimelineEntry,
} from "../journey.ts";
import {
  EncounterReceiptHashConflictError,
  executeEncounterAtMostOnce,
  type EncounterReceiptLedger,
} from "./encounters/receipt-ledger.ts";

export const DIVINE_MODEL = "gpt-5.6-terra";
export const DIVINE_MAX_BODY_BYTES = 24 * 1024;
export const DIVINE_MODEL_TIMEOUT_MS = 15_000;

export interface CleanDivineRequest {
  readonly journeyId: string;
  readonly triggerId: DivineTriggerId;
  readonly context: {
    readonly homeGoal: string;
    readonly currentIslandIndex: number;
    readonly timeline: readonly TimelineEntry[];
  };
}

export interface DivineHandlerDependencies {
  readonly ledger: EncounterReceiptLedger | null | undefined;
  readonly apiKey?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly logger?: Pick<Console, "info" | "error">;
}

interface OpenAIResponseBody {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

const SERVER_PROMPTS: Readonly<Record<DivineTriggerId, { persona: string; lore: string }>> = Object.freeze({
  cyclops_departure: {
    persona: "Poseidon speaks as the distant, judicial force of the sea: names, pride, debts, and pursuit.",
    lore: "After Polyphemus is blinded, the revealed name allows the Cyclops to call upon Poseidon and place the voyage under pursuit.",
  },
  circe_threshold: {
    persona: "Hermes speaks with lucid speed: a messenger who offers aid and passage without taking the traveler's choice.",
    lore: "Before Circe can transform Odysseus, Hermes gives him moly and the knowledge needed to meet her terms without surrendering himself.",
  },
  thrinacia_arrival: {
    persona: "Helios speaks with radiant exactness: hunger does not erase a boundary that was visible before it was crossed.",
    lore: "The cattle on Thrinacia belong to Helios and are forbidden; the warning exists before hunger and consequence.",
  },
  thrinacia_departure: {
    persona: "Zeus speaks as measured consequence rather than temper: responsibility, judgment, and the weight of a deed.",
    lore: "After Helios appeals over the cattle, Zeus enforces the consequence without changing the voyage into a moral score.",
  },
  calypso_departure: {
    persona: "Ino, also called Leucothea, speaks near the water: survival through release, trust, and the relinquishing of what cannot carry the traveler.",
    lore: "During the sea passage from Calypso toward Phaeacia, Ino gives Odysseus her veil and tells him when to release the raft.",
  },
  ithaca_threshold: {
    persona: "Athena speaks with intimate strategic clarity: disguise, patience, recognition, and truth choosing its moment.",
    lore: "At the threshold of Ithaca, Athena guides concealment and strategy; return does not require the traveler to enter unchanged or immediately recognized.",
  },
});

export async function handleDivineRequest(request: Request, dependencies: DivineHandlerDependencies): Promise<Response> {
  if (isRateLimited(request, "divine")) {
    return json({ error: "DIVINE_RATE_LIMITED", message: "The gods withdraw for a brief silence." }, 429);
  }
  const parsedBody = await readJsonWithLimit(request, DIVINE_MAX_BODY_BYTES);
  if (!parsedBody.ok) return json({ error: "DIVINE_INPUT_INVALID", message: `Invalid ${parsedBody.field}.` }, parsedBody.status);

  const payload = cleanDivineRequest(parsedBody.value);
  if (!payload) return json({ error: "DIVINE_INPUT_INVALID", message: "The divine encounter context is not canonical." }, 400);

  const registry = DIVINE_REGISTRY[payload.triggerId];
  const fallback = composeDivineEncounter(payload.triggerId, null, []);
  let payloadHash: string;
  try {
    payloadHash = await hashDivinePayload(payload);
  } catch (error) {
    dependencies.logger?.error("Divine payload hashing failed", { triggerId: payload.triggerId, error });
    return json(fallback);
  }

  try {
    const execution = await executeEncounterAtMostOnce<DivineEncounter>({
      ledger: dependencies.ledger,
      key: { journeyId: payload.journeyId, layer: "divine", triggerId: registry.triggerId },
      payloadHash,
      authoredFallback: fallback,
      now: dependencies.now,
      invoke: () => invokeTerra(payload, dependencies),
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
      return json({ error: "DIVINE_RECEIPT_CONFLICT", message: "This divine encounter already has a different receipt." }, 409);
    }
    dependencies.logger?.error("Divine encounter execution failed", { triggerId: payload.triggerId, error });
    return json(fallback);
  }
}

export function cleanDivineRequest(raw: unknown): CleanDivineRequest | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["context", "journeyId", "triggerId"])) return null;
  const journeyId = cleanJourneyId(raw.journeyId);
  const triggerId = typeof raw.triggerId === "string" ? raw.triggerId : "";
  const registry = getDivineRegistryEntry(triggerId);
  if (!journeyId || !registry || !isRecord(raw.context)) return null;
  if (!hasExactKeys(raw.context, ["currentIslandIndex", "homeGoal", "timeline"])) return null;

  const homeGoal = cleanText(raw.context.homeGoal, 300);
  const currentIslandIndex = raw.context.currentIslandIndex;
  const timeline = cleanCanonicalTimeline(raw.context.timeline);
  if (!homeGoal || !Number.isInteger(currentIslandIndex) || !timeline) return null;
  if (currentIslandIndex !== registry.destinationIslandIndex || timeline.length !== currentIslandIndex) return null;
  if (timeline.length - 1 !== registry.departureIslandIndex) return null;
  if (!reachesCanonicalDestination(homeGoal, timeline, currentIslandIndex as number)) return null;
  if (getDivineTriggerForResolvedDeparture({
    departureIslandIndex: registry.departureIslandIndex,
    resolvedCurrentIsland: currentIslandIndex as number,
  }) !== registry.triggerId) return null;

  return {
    journeyId,
    triggerId: registry.triggerId,
    context: { homeGoal, currentIslandIndex: currentIslandIndex as number, timeline },
  };
}

function reachesCanonicalDestination(
  homeGoal: string,
  timeline: readonly TimelineEntry[],
  destinationIslandIndex: number,
) {
  let memory = createJourneyMemory(homeGoal);
  for (let index = 0; index < timeline.length; index += 1) {
    if (memory.ending || memory.currentIsland !== index) return false;
    const entry = timeline[index];
    memory = resolveIsland(memory, ISLANDS[index], entry.action, entry.quote);
  }
  return !memory.ending && memory.currentIsland === destinationIslandIndex;
}

export async function hashDivinePayload(payload: CleanDivineRequest) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function invokeTerra(payload: CleanDivineRequest, dependencies: DivineHandlerDependencies): Promise<DivineEncounter> {
  if (!dependencies.apiKey) throw new Error("Terra API key is unavailable.");
  const fetchImpl = dependencies.fetchImpl || globalThis.fetch;
  const timeoutMs = dependencies.timeoutMs ?? DIVINE_MODEL_TIMEOUT_MS;
  const registry = DIVINE_REGISTRY[payload.triggerId];
  const memory = compressedMemory(payload.context.timeline);
  const allowedMemoryRefs = memory.map((item) => item.ref);
  const prompt = SERVER_PROMPTS[payload.triggerId];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${dependencies.apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: DIVINE_MODEL,
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content: [
              "You render one brief presence from a canonical deity in Odyssey. The deity interprets evidence but never changes the route, Engine result, choice, score, or ending.",
              `Actor: ${registry.displayName}.`,
              `Persona: ${prompt.persona}`,
              `Canonical lore capsule: ${prompt.lore}`,
              ...registry.languageRules,
              "Return only the strict structured output. memoryRefs may cite only references supplied by the user payload.",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              homeGoal: payload.context.homeGoal,
              triggerId: registry.triggerId,
              currentShore: ISLANDS[payload.context.currentIslandIndex].name,
              journeyMemory: memory,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "divine_presence",
            strict: true,
            schema: divineOutputSchema(allowedMemoryRefs),
          },
        },
        max_output_tokens: 300,
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  const requestId = response.headers.get("x-request-id");
  if (!response.ok) {
    dependencies.logger?.error("Terra API failure", { status: response.status, requestId, triggerId: registry.triggerId });
    throw new Error("Terra request failed.");
  }

  const rawText = outputText(await response.json() as OpenAIResponseBody);
  if (!rawText) {
    dependencies.logger?.error("Terra returned no structured output", { requestId, triggerId: registry.triggerId });
    throw new Error("Terra returned no output.");
  }

  let rawOutput: unknown;
  try {
    rawOutput = JSON.parse(rawText);
  } catch {
    dependencies.logger?.error("Terra returned malformed JSON", { requestId, triggerId: registry.triggerId });
    throw new Error("Terra returned malformed JSON.");
  }
  if (!validateDivineModelOutput(rawOutput, allowedMemoryRefs)) {
    dependencies.logger?.error("Terra returned invalid structured output", { requestId, triggerId: registry.triggerId });
    throw new Error("Terra returned invalid structured output.");
  }

  dependencies.logger?.info("Terra divine presence completed", { requestId, triggerId: registry.triggerId });
  return composeDivineEncounter(payload.triggerId, rawOutput, allowedMemoryRefs);
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

function divineOutputSchema(memoryRefs: readonly string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      spokenLine: { type: "string", maxLength: 240 },
      mark: { type: "string", maxLength: 64 },
      memoryRefs: {
        type: "array",
        maxItems: 2,
        items: { type: "string", enum: memoryRefs },
      },
    },
    required: ["spokenLine", "mark", "memoryRefs"],
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

function outputText(data: OpenAIResponseBody) {
  return data.output?.find((item) => item.type === "message")?.content?.find((item) => item.type === "output_text")?.text;
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
