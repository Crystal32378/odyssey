export const TROY_ALLOWED_ACTION_TAGS = [
  "CARRY_THE_MEMORY",
  "RELEASE_THE_ASHES",
  "CLAIM_THE_VICTORY",
  "MOURN_THE_LOST",
  "UNRESOLVED",
] as const;

export type TroyActionTag = (typeof TROY_ALLOWED_ACTION_TAGS)[number];

export interface JourneyStats {
  metis: number;
  hubris: number;
  nostos: number;
  trust: number;
  temptation: number;
  compassion: number;
  hope: number;
}

export interface TimelineEntry {
  island: string;
  action: string;
  quote: string;
}

export interface JourneyMemory {
  homeGoal: string;
  stats: JourneyStats;
  timeline: TimelineEntry[];
  currentIsland: number;
}

export interface HomerScene {
  narrative: string;
  question: string;
}

export interface HomerTransition {
  resolution: string;
  action_tag: TroyActionTag;
  next_narrative: string;
  next_question: string;
}

const TROY_STAT_DELTAS: Record<TroyActionTag, Partial<JourneyStats>> = {
  CARRY_THE_MEMORY: { nostos: 1, hope: 1 },
  RELEASE_THE_ASHES: { metis: 1, hope: 1 },
  CLAIM_THE_VICTORY: { hubris: 1, hope: 1 },
  MOURN_THE_LOST: { compassion: 1, nostos: 1 },
  UNRESOLVED: {},
};

export function createJourneyMemory(homeGoal: string): JourneyMemory {
  return {
    homeGoal,
    stats: {
      metis: 0,
      hubris: 0,
      nostos: 0,
      trust: 0,
      temptation: 0,
      compassion: 0,
      hope: 0,
    },
    timeline: [],
    currentIsland: 0,
  };
}

export function resolveTroy(
  memory: JourneyMemory,
  actionTag: TroyActionTag,
  playerQuote: string,
): JourneyMemory {
  const delta = TROY_STAT_DELTAS[actionTag];
  const stats = { ...memory.stats };

  for (const [key, value] of Object.entries(delta)) {
    const stat = key as keyof JourneyStats;
    stats[stat] += value ?? 0;
  }

  return {
    ...memory,
    stats,
    timeline: [
      ...memory.timeline,
      { island: "Troy", action: actionTag, quote: playerQuote },
    ],
    currentIsland: 1,
  };
}
