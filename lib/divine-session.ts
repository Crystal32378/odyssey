import {
  validateDivineEncounterResponse,
  type DivineRequestContext,
} from "./divine-client.ts";
import {
  DIVINE_REGISTRY,
  getDivineTriggerForResolvedDeparture,
  isDivineTriggerId,
  type DivineEncounter,
  type DivineTriggerId,
} from "./divine.ts";
import { ISLANDS, type JourneyMemory, type TimelineEntry } from "./journey.ts";

export const DIVINE_SESSION_KEY = "odyssey.divine-presence.v1";

export interface PendingDivineEncounter {
  readonly triggerId: DivineTriggerId;
  readonly context: DivineRequestContext;
}

export interface DivineSession {
  readonly version: 1;
  readonly journeyId: string;
  readonly seenTriggerIds: readonly DivineTriggerId[];
  readonly pending: PendingDivineEncounter | null;
  readonly active: DivineEncounter | null;
}

export interface DivineSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type JourneyIdFactory = () => string;

export function createDivineSession(createJourneyId: JourneyIdFactory = defaultJourneyId): DivineSession {
  const journeyId = createJourneyId().trim().toLowerCase();
  if (!isJourneyId(journeyId)) throw new Error("Divine journey IDs must be UUID v4 values.");
  return { version: 1, journeyId, seenTriggerIds: [], pending: null, active: null };
}

export function restoreDivineSession(
  raw: string | null,
  createJourneyId: JourneyIdFactory = defaultJourneyId,
): DivineSession {
  if (raw) {
    try {
      const hydrated = validateDivineSession(JSON.parse(raw));
      if (hydrated) return hydrated;
    } catch {
      // A malformed external snapshot is replaced by a new, empty journey receipt.
    }
  }
  return createDivineSession(createJourneyId);
}

export function readDivineSession(
  storage: Pick<DivineSessionStorage, "getItem">,
  createJourneyId: JourneyIdFactory = defaultJourneyId,
) {
  return restoreDivineSession(storage.getItem(DIVINE_SESSION_KEY), createJourneyId);
}

export function writeDivineSession(
  storage: Pick<DivineSessionStorage, "setItem">,
  session: DivineSession,
) {
  storage.setItem(DIVINE_SESSION_KEY, JSON.stringify(session));
}

export function clearDivineSession(storage: Pick<DivineSessionStorage, "removeItem">) {
  storage.removeItem(DIVINE_SESSION_KEY);
}

export function resetDivineSession(
  storage: Pick<DivineSessionStorage, "removeItem">,
  createJourneyId: JourneyIdFactory = defaultJourneyId,
) {
  clearDivineSession(storage);
  return createDivineSession(createJourneyId);
}

export function queueDivineEncounter(
  session: DivineSession,
  triggerId: DivineTriggerId,
  context: DivineRequestContext,
): DivineSession {
  if (session.seenTriggerIds.includes(triggerId)) return session;
  if (session.active?.triggerId === triggerId || session.pending?.triggerId === triggerId) return session;
  if (session.active || session.pending || !validatePending({ triggerId, context })) return session;
  return { ...session, pending: { triggerId, context: cloneContext(context) } };
}

export function recoverDivineEncounter(session: DivineSession, memory: JourneyMemory): DivineSession {
  if (session.active || session.pending || memory.timeline.length === 0) return session;
  const triggerId = getDivineTriggerForResolvedDeparture({
    departureIslandIndex: memory.timeline.length - 1,
    resolvedCurrentIsland: memory.currentIsland,
    resolvedEnding: memory.ending,
  });
  if (!triggerId) return session;
  return queueDivineEncounter(session, triggerId, {
    homeGoal: memory.homeGoal,
    currentIslandIndex: memory.currentIsland,
    timeline: memory.timeline,
  });
}

export function activateDivineEncounter(session: DivineSession, encounter: DivineEncounter): DivineSession {
  if (!session.pending || session.pending.triggerId !== encounter.triggerId) return session;
  if (session.seenTriggerIds.includes(encounter.triggerId)) return { ...session, pending: null };
  const validated = validateDivineEncounterResponse(encounter, encounter.triggerId, session.pending.context);
  if (!validated) return session;
  return { ...session, pending: null, active: validated };
}

export function dismissDivineEncounter(session: DivineSession): DivineSession {
  const triggerId = session.active?.triggerId || session.pending?.triggerId;
  if (!triggerId) return session;
  const seenTriggerIds = session.seenTriggerIds.includes(triggerId)
    ? session.seenTriggerIds
    : [...session.seenTriggerIds, triggerId];
  return { ...session, seenTriggerIds, pending: null, active: null };
}

export function validateDivineSession(raw: unknown): DivineSession | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["active", "journeyId", "pending", "seenTriggerIds", "version"])) return null;
  if (raw.version !== 1 || typeof raw.journeyId !== "string" || !isJourneyId(raw.journeyId)) return null;
  if (!Array.isArray(raw.seenTriggerIds) || raw.seenTriggerIds.length > Object.keys(DIVINE_REGISTRY).length) return null;

  const seenTriggerIds: DivineTriggerId[] = [];
  for (const value of raw.seenTriggerIds) {
    if (typeof value !== "string" || !isDivineTriggerId(value) || seenTriggerIds.includes(value)) return null;
    seenTriggerIds.push(value);
  }

  const pending = raw.pending === null ? null : validatePending(raw.pending);
  const active = raw.active === null ? null : validateStoredEncounter(raw.active);
  if ((raw.pending !== null && !pending) || (raw.active !== null && !active) || (pending && active)) return null;
  if (pending && seenTriggerIds.includes(pending.triggerId)) return null;
  if (active && seenTriggerIds.includes(active.triggerId)) return null;

  return {
    version: 1,
    journeyId: raw.journeyId,
    seenTriggerIds,
    pending,
    active,
  };
}

function validatePending(raw: unknown): PendingDivineEncounter | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["context", "triggerId"])) return null;
  if (typeof raw.triggerId !== "string" || !isDivineTriggerId(raw.triggerId)) return null;
  const context = validateContext(raw.context, raw.triggerId);
  return context ? { triggerId: raw.triggerId, context } : null;
}

function validateStoredEncounter(raw: unknown) {
  if (!isRecord(raw) || typeof raw.triggerId !== "string" || !isDivineTriggerId(raw.triggerId)) return null;
  return validateDivineEncounterResponse(raw, raw.triggerId);
}

function validateContext(raw: unknown, triggerId: DivineTriggerId): DivineRequestContext | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["currentIslandIndex", "homeGoal", "timeline"])) return null;
  const registry = DIVINE_REGISTRY[triggerId];
  if (typeof raw.homeGoal !== "string" || !cleanText(raw.homeGoal, 300)) return null;
  if (!Number.isInteger(raw.currentIslandIndex) || raw.currentIslandIndex !== registry.destinationIslandIndex) return null;
  if (!Array.isArray(raw.timeline) || raw.timeline.length !== registry.destinationIslandIndex) return null;

  const timeline: TimelineEntry[] = [];
  for (let index = 0; index < raw.timeline.length; index += 1) {
    const entry = raw.timeline[index];
    const island = ISLANDS[index];
    if (!isRecord(entry) || !hasExactKeys(entry, ["action", "island", "quote"])) return null;
    if (
      entry.island !== island.name
      || typeof entry.action !== "string"
      || !island.allowedActionTags.includes(entry.action)
      || typeof entry.quote !== "string"
      || !cleanText(entry.quote, 1_000)
    ) return null;
    timeline.push({ island: entry.island, action: entry.action, quote: entry.quote });
  }
  return { homeGoal: raw.homeGoal, currentIslandIndex: registry.destinationIslandIndex, timeline };
}

function cloneContext(context: DivineRequestContext): DivineRequestContext {
  return {
    homeGoal: context.homeGoal,
    currentIslandIndex: context.currentIslandIndex,
    timeline: context.timeline.map((entry) => ({ ...entry })),
  };
}

function defaultJourneyId() {
  return globalThis.crypto.randomUUID();
}

function isJourneyId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function cleanText(value: string, maxLength: number) {
  return value === value.trim()
    && value.length > 0
    && value.length <= maxLength
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
