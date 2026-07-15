export type JourneyPhase = "map" | "loading" | "island" | "resolving" | "voyaging" | "ending" | "generating_end";

export interface VoyagePoint {
  x: number;
  y: number;
}

export interface VoyageLeg {
  from: VoyagePoint;
  to: VoyagePoint;
  control: VoyagePoint;
  focus: VoyagePoint;
  path: string;
  motionPoints: readonly VoyagePoint[];
}

export type CrossingStatus = "pending" | "resolved" | "error";

export interface CrossingGate {
  visualDone: boolean;
  status: CrossingStatus;
}

export type CrossingEvent =
  | { type: "visual-complete" }
  | { type: "api-resolved" }
  | { type: "api-failed" };

export const VOYAGE_DURATION_MS = 4000;
export const VOYAGE_CAMERA_START_SCALE = 1.52;
export const VOYAGE_CAMERA_MOBILE_START_SCALE = 1.62;
export const VOYAGE_CAMERA_ZOOM_OUT_AT = 70;
export const VOYAGE_SAFE_MIN_Y = 16;
export const VOYAGE_MOTION_SAMPLE_COUNT = 11;
export const ARRIVAL_REVEAL_DURATION_MS = 400;
export const ARRIVAL_STAGE_DELAYS_MS = {
  name: 350,
  memory: 850,
  homer: 1300,
  question: 1800,
  response: 2300,
} as const;

// These centers match the fourteen medallions already painted into the landing map.
export const VOYAGE_POINTS: readonly VoyagePoint[] = [
  { x: 36.1, y: 49.7 }, { x: 26, y: 46.8 }, { x: 23.7, y: 36.2 }, { x: 30.2, y: 27.4 },
  { x: 29.8, y: 18.9 }, { x: 35.8, y: 7.9 }, { x: 55.8, y: 8.5 }, { x: 68.4, y: 16.3 },
  { x: 69, y: 26.3 }, { x: 75.3, y: 34.8 }, { x: 75.3, y: 47 }, { x: 64.8, y: 51 },
  { x: 57.6, y: 42.9 }, { x: 48.6, y: 12.4 },
] as const;

export function getVoyageLeg(fromIndex: number, toIndex: number): VoyageLeg {
  const canonicalFrom = VOYAGE_POINTS[fromIndex];
  const canonicalTo = VOYAGE_POINTS[toIndex];
  if (!canonicalFrom || !canonicalTo || toIndex !== fromIndex + 1) throw new Error("Voyage legs must connect consecutive canonical shores.");
  const from = keepVesselInsideViewport(canonicalFrom);
  const to = keepVesselInsideViewport(canonicalTo);
  const middleX = (from.x + to.x) / 2;
  const middleY = (from.y + to.y) / 2 - Math.min(3.8, Math.abs(to.x - from.x) * 0.16 + 1.2);
  const control = keepVesselInsideViewport({ x: middleX, y: middleY });
  const motionPoints = Array.from({ length: VOYAGE_MOTION_SAMPLE_COUNT }, (_, index) => {
    const progress = index / (VOYAGE_MOTION_SAMPLE_COUNT - 1);
    return pointOnQuadratic(from, control, to, easeInOut(progress));
  });
  return {
    from,
    to,
    control,
    focus: pointOnQuadratic(from, control, to, 0.52),
    path: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    motionPoints,
  };
}

function keepVesselInsideViewport(point: VoyagePoint): VoyagePoint {
  return { x: point.x, y: Math.max(VOYAGE_SAFE_MIN_Y, point.y) };
}

function pointOnQuadratic(from: VoyagePoint, control: VoyagePoint, to: VoyagePoint, progress: number): VoyagePoint {
  const inverse = 1 - progress;
  return {
    x: inverse * inverse * from.x + 2 * inverse * progress * control.x + progress * progress * to.x,
    y: inverse * inverse * from.y + 2 * inverse * progress * control.y + progress * progress * to.y,
  };
}

function easeInOut(progress: number) {
  return progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
}

export function shouldAnimateVoyage(reducedMotion: boolean) {
  return !reducedMotion;
}

export function createCrossingGate(reducedMotion: boolean): CrossingGate {
  return { visualDone: reducedMotion, status: "pending" };
}

export function advanceCrossingGate(gate: CrossingGate, event: CrossingEvent): CrossingGate {
  if (event.type === "visual-complete") return { ...gate, visualDone: true };
  if (event.type === "api-resolved") return { ...gate, status: "resolved" };
  return { visualDone: true, status: "error" };
}

export function crossingCanSettle(gate: CrossingGate) {
  return gate.visualDone && gate.status === "resolved";
}

export function canBeginCrossing(phase: JourneyPhase, hasActiveCrossing: boolean) {
  return phase === "island" && !hasActiveCrossing;
}

export function recoverJourneyPhase(phase: JourneyPhase, hasScene: boolean): JourneyPhase {
  if (phase === "loading" && !hasScene) return "map";
  if (phase === "loading" || phase === "resolving" || phase === "voyaging") return "island";
  if (phase === "generating_end") return "ending";
  return phase;
}
