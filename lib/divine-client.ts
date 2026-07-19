import {
  composeDivineEncounter,
  DIVINE_REGISTRY,
  type DivineEncounter,
  type DivineTriggerId,
  validateDivineModelOutput,
} from "./divine.ts";
import { ISLANDS, type TimelineEntry } from "./journey.ts";

export const DIVINE_PRESENTATION_TIMEOUT_MS = 10_000;
export const DIVINE_ATTEMPT_TIMEOUT_MS = 7_000;
export const DIVINE_MIN_PENDING_MS = 700;
export const DIVINE_DEFAULT_RETRY_AFTER_MS = 1_000;
export const DIVINE_MIN_RETRY_AFTER_MS = 250;
export const DIVINE_MAX_RETRY_AFTER_MS = 1_000;

export interface DivineRequestContext {
  readonly homeGoal: string;
  readonly currentIslandIndex: number;
  readonly timeline: readonly TimelineEntry[];
}

export interface DivineRequestPayload {
  readonly journeyId: string;
  readonly triggerId: DivineTriggerId;
  readonly context: DivineRequestContext;
}

type DivineFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface DivineHttpResult {
  readonly status: number;
  readonly body: unknown;
  readonly retryAfter: string | null;
}

interface RequestDivineOptions {
  readonly fetcher?: DivineFetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly now?: () => number;
  readonly timeoutMs?: number;
  readonly minimumPendingMs?: number;
}

export async function requestDivineEncounter(
  payload: DivineRequestPayload,
  options: RequestDivineOptions = {},
): Promise<DivineEncounter> {
  const fallback = authoredDivineFallback(payload.triggerId);
  const fetcher = options.fetcher || globalThis.fetch;
  const sleep = options.sleep || ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const now = options.now || Date.now;
  const timeoutMs = Math.max(1, options.timeoutMs ?? DIVINE_PRESENTATION_TIMEOUT_MS);
  const startedAtMs = now();
  const deadlineAtMs = startedAtMs + timeoutMs;
  const minimumVisibleAtMs = Math.min(
    deadlineAtMs,
    startedAtMs + Math.max(0, options.minimumPendingMs ?? DIVINE_MIN_PENDING_MS),
  );

  while (now() < deadlineAtMs) {
    const remainingBeforeRequestMs = deadlineAtMs - now();
    if (remainingBeforeRequestMs <= 0) break;
    let response: DivineHttpResult | null = null;
    try {
      response = await postDivine(
        payload,
        fetcher,
        Math.max(1, Math.min(DIVINE_ATTEMPT_TIMEOUT_MS, remainingBeforeRequestMs)),
      );
    } catch {
      // Transient transport failures remain pending within the same presentation deadline.
    }
    if (now() >= deadlineAtMs) break;

    if (response?.status === 200) {
      const encounter = encounterFromResponse(response.body, payload);
      if (encounter) {
        await waitUntil(minimumVisibleAtMs, now, sleep);
        return encounter;
      }
    }

    const remainingAfterRequestMs = deadlineAtMs - now();
    if (remainingAfterRequestMs <= 0) break;
    const retryAfterMs = response?.status === 202
      ? boundedRetryAfter(response)
      : DIVINE_DEFAULT_RETRY_AFTER_MS;
    await sleep(Math.min(retryAfterMs, remainingAfterRequestMs));
  }

  await waitUntil(minimumVisibleAtMs, now, sleep);
  return fallback;
}

export function authoredDivineFallback(triggerId: DivineTriggerId): DivineEncounter {
  return composeDivineEncounter(triggerId, null, []);
}

export function validateDivineEncounterResponse(
  raw: unknown,
  triggerId: DivineTriggerId,
  context?: DivineRequestContext,
): DivineEncounter | null {
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

  const registry = DIVINE_REGISTRY[triggerId];
  if (
    raw.version !== 1
    || raw.layer !== "divine"
    || raw.actorId !== registry.actorId
    || raw.triggerId !== triggerId
    || (raw.source !== "generated" && raw.source !== "authored_fallback")
    || !samePresentation(raw.presentation, registry.presentation)
  ) return null;

  if (raw.source === "authored_fallback") {
    const fallback = authoredDivineFallback(triggerId);
    if (
      raw.spokenLine !== fallback.spokenLine
      || raw.mark !== fallback.mark
      || !sameStringArray(raw.memoryRefs, fallback.memoryRefs)
    ) return null;
    return fallback;
  }

  const allowedMemoryRefs = context ? memoryRefsForContext(context) : allMemoryRefsBefore(triggerId);
  const output = validateDivineModelOutput({
    spokenLine: raw.spokenLine,
    mark: raw.mark,
    memoryRefs: raw.memoryRefs,
  }, allowedMemoryRefs);
  return output ? composeDivineEncounter(triggerId, output, allowedMemoryRefs) : null;
}

async function postDivine(
  payload: DivineRequestPayload,
  fetcher: DivineFetch,
  timeoutMs: number,
): Promise<DivineHttpResult> {
  const controller = new AbortController();
  return withAbortTimeout((async () => {
    const response = await fetcher("/api/divine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeyId: payload.journeyId,
        triggerId: payload.triggerId,
        context: payload.context,
      }),
      signal: controller.signal,
    });
    let body: unknown = null;
    if (response.status === 200 || response.status === 202) {
      try { body = await response.json(); } catch { /* A malformed body remains retriable until the shared deadline. */ }
    }
    return {
      status: response.status,
      body,
      retryAfter: response.headers.get("Retry-After"),
    };
  })(), controller, timeoutMs);
}

function encounterFromResponse(raw: unknown, payload: DivineRequestPayload) {
  return validateDivineEncounterResponse(raw, payload.triggerId, payload.context);
}

function boundedRetryAfter(response: DivineHttpResult) {
  let responseMilliseconds: number | null = null;
  if (
    isRecord(response.body)
    && response.body.status === "pending"
    && typeof response.body.retryAfterMs === "number"
    && Number.isFinite(response.body.retryAfterMs)
    && response.body.retryAfterMs > 0
  ) {
    responseMilliseconds = response.body.retryAfterMs;
  }

  const seconds = Number(response.retryAfter);
  const headerMilliseconds = Number.isFinite(seconds) && seconds > 0 ? seconds * 1_000 : null;
  const requested = responseMilliseconds ?? headerMilliseconds ?? DIVINE_DEFAULT_RETRY_AFTER_MS;
  return Math.min(
    DIVINE_MAX_RETRY_AFTER_MS,
    Math.max(DIVINE_MIN_RETRY_AFTER_MS, Math.ceil(requested)),
  );
}

async function withAbortTimeout<T>(
  operation: Promise<T>,
  controller: AbortController,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new DOMException("The divine request exceeded its presentation budget.", "TimeoutError"));
    }, Math.max(1, timeoutMs));
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function waitUntil(
  targetMs: number,
  now: () => number,
  sleep: (milliseconds: number) => Promise<void>,
) {
  const remainingMs = targetMs - now();
  if (remainingMs > 0) await sleep(remainingMs);
}

function memoryRefsForContext(context: DivineRequestContext) {
  const start = Math.max(0, context.timeline.length - 4);
  return context.timeline.slice(start).map((_entry, offset) => `${ISLANDS[start + offset].id}.answer`);
}

function allMemoryRefsBefore(triggerId: DivineTriggerId) {
  const end = DIVINE_REGISTRY[triggerId].destinationIslandIndex;
  const start = Math.max(0, end - 4);
  return ISLANDS.slice(start, end).map((island) => `${island.id}.answer`);
}

function samePresentation(raw: unknown, expected: DivineEncounter["presentation"]) {
  if (!isRecord(raw) || !hasExactKeys(raw, [
    "contentSide",
    "imageSrc",
    "silenceBeforeMs",
    "soundCue",
    "visualCue",
    "voiceDirection",
    "voiceFamily",
  ])) return false;
  return raw.imageSrc === expected.imageSrc
    && raw.visualCue === expected.visualCue
    && raw.soundCue === expected.soundCue
    && raw.contentSide === expected.contentSide
    && raw.voiceFamily === expected.voiceFamily
    && raw.voiceDirection === expected.voiceDirection
    && raw.silenceBeforeMs === expected.silenceBeforeMs;
}

function sameStringArray(raw: unknown, expected: readonly string[]) {
  return Array.isArray(raw)
    && raw.length === expected.length
    && raw.every((value, index) => value === expected[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
