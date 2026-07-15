export type JourneyPhase = "map" | "loading" | "island" | "resolving" | "voyaging" | "ending" | "generating_end";

export interface VoyagePoint {
  x: number;
  y: number;
}

export interface VoyageLeg {
  from: VoyagePoint;
  to: VoyagePoint;
  path: string;
}

export const VOYAGE_DURATION_MS = 1500;

// These centers match the fourteen medallions already painted into the landing map.
export const VOYAGE_POINTS: readonly VoyagePoint[] = [
  { x: 36.1, y: 49.7 }, { x: 26, y: 46.8 }, { x: 23.7, y: 36.2 }, { x: 30.2, y: 27.4 },
  { x: 29.8, y: 18.9 }, { x: 35.8, y: 7.9 }, { x: 55.8, y: 8.5 }, { x: 68.4, y: 16.3 },
  { x: 69, y: 26.3 }, { x: 75.3, y: 34.8 }, { x: 75.3, y: 47 }, { x: 64.8, y: 51 },
  { x: 57.6, y: 42.9 }, { x: 48.6, y: 12.4 },
] as const;

export function getVoyageLeg(fromIndex: number, toIndex: number): VoyageLeg {
  const from = VOYAGE_POINTS[fromIndex];
  const to = VOYAGE_POINTS[toIndex];
  if (!from || !to || toIndex !== fromIndex + 1) throw new Error("Voyage legs must connect consecutive canonical shores.");
  const middleX = (from.x + to.x) / 2;
  const middleY = (from.y + to.y) / 2 - Math.min(3.8, Math.abs(to.x - from.x) * 0.16 + 1.2);
  return { from, to, path: `M ${from.x} ${from.y} Q ${middleX} ${middleY} ${to.x} ${to.y}` };
}

export function shouldAnimateVoyage(reducedMotion: boolean) {
  return !reducedMotion;
}

export function recoverJourneyPhase(phase: JourneyPhase, hasScene: boolean): JourneyPhase {
  if (phase === "loading" && !hasScene) return "map";
  if (phase === "loading" || phase === "resolving" || phase === "voyaging") return "island";
  if (phase === "generating_end") return "ending";
  return phase;
}
