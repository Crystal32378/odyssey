import {
  composeLunaEncounter,
  getLunaTriggerForIslandIndex,
  LUNA_REGISTRY,
  validateLunaModelOutput,
  type LunaEncounter,
  type LunaTriggerId,
} from "./luna.ts";
import { ISLANDS, type TimelineEntry } from "./journey.ts";

export const LUNA_PRESENTATION_TIMEOUT_MS = 10_000;
export const LUNA_ATTEMPT_TIMEOUT_MS = 7_000;
export const LUNA_MIN_PENDING_MS = 700;
export const LUNA_DEFAULT_RETRY_AFTER_MS = 1_000;
export const LUNA_MIN_RETRY_AFTER_MS = 250;
export const LUNA_MAX_RETRY_AFTER_MS = 1_000;

export interface LunaRequestContext {
  readonly homeGoal: string;
  readonly currentIslandIndex: number;
  readonly timeline: readonly TimelineEntry[];
}

export interface LunaRequestPayload {
  readonly journeyId: string;
  readonly context: LunaRequestContext;
}

export type LunaOutcomeState = "generated" | "authored_fallback" | "failed";

export interface LunaOutcome {
  readonly state: LunaOutcomeState;
  readonly encounter: LunaEncounter;
}

type LunaFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface LunaHttpResult {
  readonly status: number;
  readonly body: unknown;
  readonly retryAfter: string | null;
}

interface RequestLunaOptions {
  readonly fetcher?: LunaFetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly now?: () => number;
  readonly timeoutMs?: number;
  readonly minimumPendingMs?: number;
}

export async function requestLunaEncounter(
  payload: LunaRequestPayload,
  options: RequestLunaOptions = {},
): Promise<LunaOutcome> {
  const triggerId = getLunaTriggerForIslandIndex(payload.context.currentIslandIndex);
  if (!triggerId) throw new Error("Luna requests require a canonical threshold island.");
  const fallback = authoredLunaFallback(triggerId);
  const fetcher = options.fetcher || globalThis.fetch;
  const sleep = options.sleep || ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const now = options.now || Date.now;
  const timeoutMs = Math.max(1, options.timeoutMs ?? LUNA_PRESENTATION_TIMEOUT_MS);
  const startedAtMs = now();
  const deadlineAtMs = startedAtMs + timeoutMs;
  const minimumVisibleAtMs = Math.min(deadlineAtMs, startedAtMs + Math.max(0, options.minimumPendingMs ?? LUNA_MIN_PENDING_MS));

  while (now() < deadlineAtMs) {
    const remainingBeforeRequestMs = deadlineAtMs - now();
    if (remainingBeforeRequestMs <= 0) break;
    let response: LunaHttpResult | null = null;
    try {
      response = await postLuna(payload, fetcher, Math.max(1, Math.min(LUNA_ATTEMPT_TIMEOUT_MS, remainingBeforeRequestMs)));
    } catch {
      // Transport failures remain pending within the single presentation deadline.
    }
    if (now() >= deadlineAtMs) break;

    if (response?.status === 200) {
      const encounter = validateLunaEncounterResponse(response.body, triggerId, payload.context);
      if (encounter) {
        await waitUntil(minimumVisibleAtMs, now, sleep);
        return {
          state: encounter.source === "generated" ? "generated" : "authored_fallback",
          encounter,
        };
      }
    }

    const remainingAfterRequestMs = deadlineAtMs - now();
    if (remainingAfterRequestMs <= 0) break;
    const retryAfterMs = response?.status === 202 ? boundedRetryAfter(response) : LUNA_DEFAULT_RETRY_AFTER_MS;
    await sleep(Math.min(retryAfterMs, remainingAfterRequestMs));
  }

  await waitUntil(minimumVisibleAtMs, now, sleep);
  return { state: "failed", encounter: fallback };
}

export function authoredLunaFallback(triggerId: LunaTriggerId) {
  return composeLunaEncounter(triggerId, null, []);
}

export function validateLunaEncounterResponse(
  raw: unknown,
  triggerId: LunaTriggerId,
  context?: LunaRequestContext,
): LunaEncounter | null {
  if (!isRecord(raw) || !hasExactKeys(raw, [
    "actorId",
    "layer",
    "mark",
    "memoryRefs",
    "presentation",
    "source",
    "spokenLine",
    "triggerId",
    "version",
  ])) return null;

  const registry = LUNA_REGISTRY[triggerId];
  if (
    raw.version !== 1
    || raw.layer !== "luna"
    || raw.actorId !== registry.actorId
    || raw.triggerId !== triggerId
    || raw.mark !== registry.mark
    || (raw.source !== "generated" && raw.source !== "authored_fallback")
    || !samePresentation(raw.presentation, registry.presentation)
  ) return null;

  if (raw.source === "authored_fallback") {
    const fallback = authoredLunaFallback(triggerId);
    if (
      raw.spokenLine !== fallback.spokenLine
      || !sameStringArray(raw.memoryRefs, fallback.memoryRefs)
    ) return null;
    return fallback;
  }

  const allowedMemoryRefs = context ? memoryRefsForContext(context) : allMemoryRefsBefore(triggerId);
  const output = validateLunaModelOutput({ spokenLine: raw.spokenLine, memoryRefs: raw.memoryRefs }, allowedMemoryRefs);
  return output ? composeLunaEncounter(triggerId, output, allowedMemoryRefs) : null;
}

async function postLuna(payload: LunaRequestPayload, fetcher: LunaFetch, timeoutMs: number): Promise<LunaHttpResult> {
  const controller = new AbortController();
  return withAbortTimeout((async () => {
    const response = await fetcher("/api/divine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Odyssey-Encounter-Layer": "luna",
      },
      body: JSON.stringify({ journeyId: payload.journeyId, context: payload.context }),
      signal: controller.signal,
    });
    let body: unknown = null;
    if (response.status === 200 || response.status === 202) {
      try { body = await response.json(); } catch { /* Malformed output remains pending until the shared deadline. */ }
    }
    return { status: response.status, body, retryAfter: response.headers.get("Retry-After") };
  })(), controller, timeoutMs);
}

function memoryRefsForContext(context: LunaRequestContext) {
  const start = Math.max(0, context.timeline.length - 4);
  return context.timeline.slice(start).map((_entry, offset) => `${ISLANDS[start + offset].id}.answer`);
}

function allMemoryRefsBefore(triggerId: LunaTriggerId) {
  const end = LUNA_REGISTRY[triggerId].islandIndex;
  const start = Math.max(0, end - 4);
  return ISLANDS.slice(start, end).map((island) => `${island.id}.answer`);
}

function samePresentation(raw: unknown, expected: LunaEncounter["presentation"]) {
  if (!isRecord(raw) || !hasExactKeys(raw, ["imageSrc", "material", "thresholdLabel"])) return false;
  return raw.imageSrc === expected.imageSrc
    && raw.material === expected.material
    && raw.thresholdLabel === expected.thresholdLabel;
}

function sameStringArray(raw: unknown, expected: readonly string[]) {
  return Array.isArray(raw) && raw.length === expected.length && raw.every((value, index) => value === expected[index]);
}

function boundedRetryAfter(response: LunaHttpResult) {
  let responseMilliseconds: number | null = null;
  if (
    isRecord(response.body)
    && response.body.status === "pending"
    && typeof response.body.retryAfterMs === "number"
    && Number.isFinite(response.body.retryAfterMs)
    && response.body.retryAfterMs > 0
  ) responseMilliseconds = response.body.retryAfterMs;

  const seconds = Number(response.retryAfter);
  const headerMilliseconds = Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : null;
  const requested = responseMilliseconds ?? headerMilliseconds ?? LUNA_DEFAULT_RETRY_AFTER_MS;
  return Math.min(LUNA_MAX_RETRY_AFTER_MS, Math.max(LUNA_MIN_RETRY_AFTER_MS, Math.ceil(requested)));
}

async function withAbortTimeout<T>(operation: Promise<T>, controller: AbortController, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("The Luna request exceeded its presentation budget.", "TimeoutError"));
    }, Math.max(1, timeoutMs));
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function waitUntil(targetMs: number, now: () => number, sleep: (milliseconds: number) => Promise<void>) {
  const remainingMs = targetMs - now();
  if (remainingMs > 0) await sleep(remainingMs);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
