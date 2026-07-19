import {
  authoredLunaFallback,
  validateLunaEncounterResponse,
  type LunaOutcome,
  type LunaOutcomeState,
  type LunaRequestContext,
} from "./luna-client.ts";
import {
  getLunaTriggerForIslandIndex,
  isLunaTriggerId,
  LUNA_REGISTRY,
  type LunaEncounter,
  type LunaTriggerId,
} from "./luna.ts";
import { ISLANDS, type JourneyMemory, type TimelineEntry } from "./journey.ts";

export const LUNA_SESSION_KEY = "odyssey.luna-thresholds.v1";

export interface PendingLunaEncounter {
  readonly triggerId: LunaTriggerId;
  readonly context: LunaRequestContext;
}

export interface ActiveLunaEncounter {
  readonly state: LunaOutcomeState;
  readonly encounter: LunaEncounter;
}

export interface LunaSession {
  readonly version: 1;
  readonly journeyId: string;
  readonly seenTriggerIds: readonly LunaTriggerId[];
  readonly pending: PendingLunaEncounter | null;
  readonly active: ActiveLunaEncounter | null;
  readonly recovered: boolean;
}

export interface LunaSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createLunaSession(journeyId: string): LunaSession {
  const normalized = journeyId.trim().toLowerCase();
  if (!isJourneyId(normalized)) throw new Error("Luna journey IDs must be UUID v4 values.");
  return { version: 1, journeyId: normalized, seenTriggerIds: [], pending: null, active: null, recovered: false };
}

export function restoreLunaSession(raw: string | null, journeyId: string): LunaSession {
  if (raw) {
    try {
      const hydrated = validateLunaSession(JSON.parse(raw));
      if (hydrated && hydrated.journeyId === journeyId) {
        return { ...hydrated, recovered: Boolean(hydrated.active) };
      }
    } catch {
      // Malformed or cross-journey snapshots cannot become threshold authority.
    }
  }
  return createLunaSession(journeyId);
}

export function readLunaSession(storage: Pick<LunaSessionStorage, "getItem">, journeyId: string) {
  return restoreLunaSession(storage.getItem(LUNA_SESSION_KEY), journeyId);
}

export function writeLunaSession(storage: Pick<LunaSessionStorage, "setItem">, session: LunaSession) {
  storage.setItem(LUNA_SESSION_KEY, JSON.stringify(session));
}

export function clearLunaSession(storage: Pick<LunaSessionStorage, "removeItem">) {
  storage.removeItem(LUNA_SESSION_KEY);
}

export function resetLunaSession(storage: Pick<LunaSessionStorage, "removeItem">, journeyId: string) {
  clearLunaSession(storage);
  return createLunaSession(journeyId);
}

export function queueLunaEncounter(session: LunaSession, memory: JourneyMemory): LunaSession {
  const triggerId = getLunaTriggerForIslandIndex(memory.currentIsland);
  if (!triggerId || memory.ending || session.seenTriggerIds.includes(triggerId)) return session;
  if (session.pending || session.active) return session;
  const context: LunaRequestContext = {
    homeGoal: memory.homeGoal,
    currentIslandIndex: memory.currentIsland,
    timeline: memory.timeline,
  };
  if (!validateContext(context, triggerId)) return session;
  return { ...session, pending: { triggerId, context: cloneContext(context) }, recovered: false };
}

export function activateLunaEncounter(session: LunaSession, outcome: LunaOutcome): LunaSession {
  if (!session.pending || session.pending.triggerId !== outcome.encounter.triggerId) return session;
  if (session.seenTriggerIds.includes(outcome.encounter.triggerId)) return { ...session, pending: null };
  const validated = validateStoredOutcome(outcome, session.pending.context);
  if (!validated) return session;
  return { ...session, pending: null, active: validated, recovered: false };
}

export function reconcileLunaSession(session: LunaSession, memory: JourneyMemory): LunaSession {
  const currentTriggerId = memory.ending ? null : getLunaTriggerForIslandIndex(memory.currentIsland);
  const ownedTriggerId = session.active?.encounter.triggerId || session.pending?.triggerId;
  if (!ownedTriggerId || ownedTriggerId === currentTriggerId) return session;
  const seenTriggerIds = session.seenTriggerIds.includes(ownedTriggerId)
    ? session.seenTriggerIds
    : [...session.seenTriggerIds, ownedTriggerId];
  return { ...session, seenTriggerIds, pending: null, active: null, recovered: false };
}

export function validateLunaSession(raw: unknown): LunaSession | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["active", "journeyId", "pending", "recovered", "seenTriggerIds", "version"])) return null;
  if (raw.version !== 1 || typeof raw.journeyId !== "string" || !isJourneyId(raw.journeyId) || typeof raw.recovered !== "boolean") return null;
  if (!Array.isArray(raw.seenTriggerIds) || raw.seenTriggerIds.length > Object.keys(LUNA_REGISTRY).length) return null;

  const seenTriggerIds: LunaTriggerId[] = [];
  for (const value of raw.seenTriggerIds) {
    if (typeof value !== "string" || !isLunaTriggerId(value) || seenTriggerIds.includes(value)) return null;
    seenTriggerIds.push(value);
  }

  const pending = raw.pending === null ? null : validatePending(raw.pending);
  const active = raw.active === null ? null : validateStoredOutcome(raw.active);
  if ((raw.pending !== null && !pending) || (raw.active !== null && !active) || (pending && active)) return null;
  if (pending && seenTriggerIds.includes(pending.triggerId)) return null;
  if (active && seenTriggerIds.includes(active.encounter.triggerId)) return null;

  return { version: 1, journeyId: raw.journeyId, seenTriggerIds, pending, active, recovered: raw.recovered };
}

function validatePending(raw: unknown): PendingLunaEncounter | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["context", "triggerId"])) return null;
  if (typeof raw.triggerId !== "string" || !isLunaTriggerId(raw.triggerId)) return null;
  const context = validateContext(raw.context, raw.triggerId);
  return context ? { triggerId: raw.triggerId, context } : null;
}

function validateStoredOutcome(raw: unknown, context?: LunaRequestContext): ActiveLunaEncounter | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["encounter", "state"])) return null;
  if (raw.state !== "generated" && raw.state !== "authored_fallback" && raw.state !== "failed") return null;
  if (!isRecord(raw.encounter) || typeof raw.encounter.triggerId !== "string" || !isLunaTriggerId(raw.encounter.triggerId)) return null;
  const encounter = validateLunaEncounterResponse(raw.encounter, raw.encounter.triggerId, context);
  if (!encounter) return null;
  if (raw.state === "generated" && encounter.source !== "generated") return null;
  if (raw.state === "authored_fallback" && encounter.source !== "authored_fallback") return null;
  if (raw.state === "failed") {
    const fallback = authoredLunaFallback(encounter.triggerId);
    if (encounter.source !== "authored_fallback" || encounter.spokenLine !== fallback.spokenLine) return null;
  }
  return { state: raw.state, encounter };
}

function validateContext(raw: unknown, triggerId: LunaTriggerId): LunaRequestContext | null {
  if (!isRecord(raw) || !hasExactKeys(raw, ["currentIslandIndex", "homeGoal", "timeline"])) return null;
  const registry = LUNA_REGISTRY[triggerId];
  if (typeof raw.homeGoal !== "string" || !cleanText(raw.homeGoal, 300)) return null;
  if (!Number.isInteger(raw.currentIslandIndex) || raw.currentIslandIndex !== registry.islandIndex) return null;
  if (!Array.isArray(raw.timeline) || raw.timeline.length !== registry.islandIndex) return null;

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
  return { homeGoal: raw.homeGoal, currentIslandIndex: registry.islandIndex, timeline };
}

function cloneContext(context: LunaRequestContext): LunaRequestContext {
  return { homeGoal: context.homeGoal, currentIslandIndex: context.currentIslandIndex, timeline: context.timeline.map((entry) => ({ ...entry })) };
}

function isJourneyId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
}

function cleanText(value: string, maxLength: number) {
  return value === value.trim() && value.length > 0 && value.length <= maxLength && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
