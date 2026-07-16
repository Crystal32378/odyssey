import {
  composeDivineEncounter,
  DIVINE_REGISTRY,
  type DivineEncounter,
  type DivineTriggerId,
  validateDivineModelOutput,
} from "./divine.ts";
import { ISLANDS, type TimelineEntry } from "./journey.ts";

export const DIVINE_REQUEST_TIMEOUT_MS = 18_000;
export const DIVINE_MAX_RETRY_AFTER_MS = 3_000;

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

interface RequestDivineOptions {
  readonly fetcher?: DivineFetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly timeoutMs?: number;
}

export async function requestDivineEncounter(
  payload: DivineRequestPayload,
  options: RequestDivineOptions = {},
): Promise<DivineEncounter> {
  const fallback = authoredDivineFallback(payload.triggerId);
  const fetcher = options.fetcher || globalThis.fetch;
  const sleep = options.sleep || ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const timeoutMs = options.timeoutMs ?? DIVINE_REQUEST_TIMEOUT_MS;

  try {
    const first = await postDivine(payload, fetcher, timeoutMs);
    if (first.status !== 202) return await encounterFromResponse(first, payload) || fallback;

    const retryAfterMs = boundedRetryAfter(first);
    if (retryAfterMs > 0) await sleep(retryAfterMs);
    const retry = await postDivine(payload, fetcher, timeoutMs);
    return await encounterFromResponse(retry, payload) || fallback;
  } catch {
    return fallback;
  }
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

async function postDivine(payload: DivineRequestPayload, fetcher: DivineFetch, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try {
    return await fetcher("/api/divine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeyId: payload.journeyId,
        triggerId: payload.triggerId,
        context: payload.context,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function encounterFromResponse(response: Response, payload: DivineRequestPayload) {
  if (response.status !== 200) return null;
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }
  return validateDivineEncounterResponse(raw, payload.triggerId, payload.context);
}

function boundedRetryAfter(response: Response) {
  const retryAfter = response.headers.get("Retry-After");
  if (!retryAfter) return 0;
  const seconds = Number(retryAfter);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.min(Math.ceil(seconds * 1_000), DIVINE_MAX_RETRY_AFTER_MS);
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
