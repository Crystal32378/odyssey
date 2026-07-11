type Phase = "enter" | "resolve" | "summary" | "card";
const ISLAND_COUNT = 14;

export type CleanPayload =
  | { phase: "enter"; islandIndex: number; homeGoal: string; timeline: CleanTimelineEntry[] }
  | { phase: "resolve"; islandIndex: number; homeGoal: string; timeline: CleanTimelineEntry[]; playerInput: string }
  | { phase: "summary"; memory: CleanMemory }
  | { phase: "card"; memory: CleanMemory; summary: string };

export interface CleanTimelineEntry { island: string; action: string; quote: string; }
export interface CleanMemory { homeGoal: string; stats: Record<string, number>; timeline: CleanTimelineEntry[]; currentIsland: number; ending?: "ithaca" | "calypso"; }

export function cleanPayload(body: Record<string, unknown>, phase: Phase): CleanPayload | null {
  if (phase === "enter" || phase === "resolve") {
    const homeGoal = cleanText(body.homeGoal, 300);
    const timeline = cleanTimeline(body.timeline);
    if (!homeGoal || !timeline) return null;
    if (!Number.isInteger(body.islandIndex) || (body.islandIndex as number) < 0 || (body.islandIndex as number) >= ISLAND_COUNT) return null;
    if (phase === "enter") return { phase, islandIndex: body.islandIndex as number, homeGoal, timeline };
    const playerInput = cleanText(body.playerInput, 1000);
    return playerInput ? { phase, islandIndex: body.islandIndex as number, homeGoal, timeline, playerInput } : null;
  }

  const memory = cleanMemory(body.memory);
  if (!memory) return null;
  if (phase === "summary") return { phase, memory };
  const summary = cleanText(body.summary, 1400);
  return summary ? { phase, memory, summary } : null;
}

function cleanMemory(value: unknown): CleanMemory | null {
  const input = value as Record<string, unknown>;
  if (!input || typeof input !== "object") return null;
  const homeGoal = cleanText(input.homeGoal, 300);
  const timeline = cleanTimeline(input.timeline);
  const stats = cleanStats(input.stats);
  if (!homeGoal || !timeline || !stats || !Number.isInteger(input.currentIsland) || (input.currentIsland as number) < 0 || (input.currentIsland as number) >= ISLAND_COUNT) return null;
  if (input.ending !== undefined && input.ending !== "ithaca" && input.ending !== "calypso") return null;
  return { homeGoal, stats, timeline, currentIsland: input.currentIsland as number, ...(input.ending ? { ending: input.ending as "ithaca" | "calypso" } : {}) };
}

function cleanTimeline(value: unknown): CleanTimelineEntry[] | null {
  if (!Array.isArray(value) || value.length > 14) return null;
  const entries: CleanTimelineEntry[] = [];
  for (const entry of value) {
    const input = entry as Record<string, unknown>;
    if (!input || typeof input !== "object") return null;
    const island = cleanText(input.island, 80);
    const action = cleanText(input.action, 80);
    const quote = cleanText(input.quote, 1000);
    if (!island || !action || !quote) return null;
    entries.push({ island, action, quote });
  }
  return entries;
}

function cleanStats(value: unknown) {
  const input = value as Record<string, unknown>;
  if (!input || typeof input !== "object") return null;
  const statKeys = ["metis", "hubris", "nostos", "trust", "temptation", "compassion", "hope"] as const;
  if (Object.keys(input).some((key) => !statKeys.includes(key as (typeof statKeys)[number]))) return null;
  const stats: Record<string, number> = {};
  for (const key of statKeys) {
    if (typeof input[key] !== "number" || !Number.isFinite(input[key])) return null;
    stats[key] = input[key];
  }
  return stats;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}
