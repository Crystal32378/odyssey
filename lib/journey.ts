export interface JourneyStats {
  metis: number;
  hubris: number;
  nostos: number;
  trust: number;
  temptation: number;
  compassion: number;
  hope: number;
}

export type StatKey = keyof JourneyStats;
export type ActionTag = string;

export interface IslandDefinition {
  id: string;
  name: string;
  epithet: string;
  myth: string;
  allowedActionTags: readonly string[];
  statDeltas: Record<string, Partial<JourneyStats>>;
  canEndJourney?: boolean;
}

export const ISLANDS: readonly IslandDefinition[] = [
  island("troy", "Troy", "The City of Ash", "ash, bronze, memory, victory, and loss", {
    CARRY_THE_MEMORY: { nostos: 1, hope: 1 }, RELEASE_THE_ASHES: { metis: 1, hope: 1 }, CLAIM_THE_VICTORY: { hubris: 1 }, MOURN_THE_LOST: { compassion: 1, nostos: 1 }, UNRESOLVED: {},
  }),
  island("cicones", "Cicones", "The Red Shore", "victory prolonged until it becomes ruin", {
    LEAVE_WITH_ENOUGH: { metis: 1, nostos: 1 }, TAKE_MORE: { hubris: 1, temptation: 1 }, SPARE_THE_DEFEATED: { compassion: 1 }, STAND_WITH_THE_CREW: { trust: 1 }, UNRESOLVED: {},
  }),
  island("lotus", "Lotus-Eaters", "The Shore of Forgetting", "sweet oblivion and the cost of forgetting home", {
    RESIST_FORGETTING: { nostos: 2, hope: 1 }, TASTE_AND_RETURN: { metis: 1, temptation: 1 }, CHOOSE_OBLIVION: { temptation: 2, nostos: -1 }, CALL_OTHERS_HOME: { compassion: 1, trust: 1 }, UNRESOLVED: {},
  }),
  island("cyclops", "Cyclops", "The One-Eyed Cave", "cunning, captivity, the false name Nobody, and pride after escape", {
    ESCAPE_BY_CUNNING: { metis: 2 }, REVEAL_THE_NAME: { hubris: 2 }, PROTECT_THE_CREW: { trust: 1, compassion: 1 }, FACE_THE_MONSTER: { hope: 1 }, UNRESOLVED: {},
  }),
  island("aeolia", "Aeolia", "The Keeper of Winds", "Aeolus, the sealed winds, trust, suspicion, and a lost passage home", {
    TRUST_THE_GIFT: { trust: 2 }, OPEN_THE_BAG: { temptation: 1, trust: -1 }, GUARD_THE_PASSAGE: { metis: 1, nostos: 1 }, SHARE_THE_BURDEN: { compassion: 1, trust: 1 }, UNRESOLVED: {},
  }),
  island("laestrygonians", "Laestrygonians", "The Harbor of Giants", "a beautiful harbor that becomes an ambush, and the one ship held outside", {
    KEEP_ONE_SHIP_FREE: { metis: 2, hope: 1 }, FOLLOW_THE_FLEET: { trust: 1 }, FLEE_THE_HARBOR: { nostos: 1 }, MOURN_THE_FLEET: { compassion: 2 }, UNRESOLVED: {},
  }),
  island("circe", "Circe", "The Enchanted Hall", "transformation, appetite, Hermes' herb, and a year of welcome", {
    RESIST_ENCHANTMENT: { metis: 1, nostos: 1 }, ACCEPT_HOSPITALITY: { trust: 1, temptation: 1 }, RESTORE_THE_CREW: { compassion: 2 }, LEAVE_THE_FEAST: { nostos: 2 }, UNRESOLVED: {},
  }),
  island("underworld", "Underworld", "The House of Shades", "Tiresias, the dead, grief, prophecy, and truth without comfort", {
    HEAR_THE_DEAD: { compassion: 1, metis: 1 }, ACCEPT_THE_WARNING: { metis: 1, hope: 1 }, SPEAK_WITH_THE_LOST: { compassion: 2 }, RETURN_TO_LIGHT: { nostos: 1, hope: 1 }, UNRESOLVED: {},
  }),
  island("sirens", "Sirens", "The Song Beyond Knowing", "the Sirens' true song, wax, ropes, knowledge, and fatal desire", {
    BIND_TO_THE_MAST: { metis: 2, temptation: 1 }, SEAL_THE_EARS: { metis: 1, trust: 1 }, FOLLOW_THE_SONG: { temptation: 2 }, TRUST_THE_CREW: { trust: 2 }, UNRESOLVED: {},
  }),
  island("scylla", "Scylla & Charybdis", "Between Two Deaths", "a passage where no choice saves everything", {
    CHOOSE_THE_NARROW_LOSS: { metis: 1, compassion: 1 }, RISK_THE_WHIRLPOOL: { hope: 1, hubris: 1 }, CARRY_THE_COST: { compassion: 2 }, STEER_WITHOUT_CERTAINTY: { trust: 1, metis: 1 }, UNRESOLVED: {},
  }),
  island("thrinacia", "Helios' Cattle", "The Forbidden Herd", "sacred cattle, hunger, restraint, and the price paid by all", {
    HONOR_THE_OATH: { trust: 1, nostos: 2 }, BREAK_THE_TABOO: { temptation: 2, hubris: 1 }, ENDURE_THE_HUNGER: { hope: 2 }, WARN_THE_CREW: { compassion: 1, trust: 1 }, UNRESOLVED: {},
  }),
  island("calypso", "Calypso", "The Timeless Isle", "Ogygia, immortality, tenderness, stillness, and the ache of return", {
    LEAVE_CALYPSO: { nostos: 3, hope: 1 }, STAY_WITH_CALYPSO: { temptation: 3, nostos: -2 }, HONOR_WHAT_WAS_GIVEN: { compassion: 2 }, BUILD_THE_RAFT: { metis: 1, hope: 1 }, UNRESOLVED: {},
  }, true),
  island("phaeacia", "Phaeacia", "The Last Harbor", "the final hosts, the telling of one's own story, and passage freely given", {
    TELL_THE_WHOLE_STORY: { trust: 2, compassion: 1 }, ACCEPT_THE_PASSAGE: { trust: 1, nostos: 2 }, KEEP_ONE_SILENCE: { metis: 1 }, NAME_THE_HOME: { hope: 2, nostos: 1 }, UNRESOLVED: {},
  }),
  island("ithaca", "Ithaca", "The Shore of Return", "a changed home, recognition, disguise, the bow, and what return demands", {
    ENTER_CHANGED: { nostos: 2, metis: 1 }, RECOGNIZE_HOME: { compassion: 1, hope: 2 }, STRING_THE_BOW: { metis: 1, hubris: 1 }, LAY_DOWN_THE_VOYAGE: { trust: 1, hope: 1 }, UNRESOLVED: {},
  }),
] as const;

function island(id: string, name: string, epithet: string, myth: string, statDeltas: Record<string, Partial<JourneyStats>>, canEndJourney = false): IslandDefinition {
  return { id, name, epithet, myth, allowedActionTags: Object.keys(statDeltas), statDeltas, canEndJourney };
}

export interface TimelineEntry { island: string; action: string; quote: string; }
export interface JourneyMemory { homeGoal: string; stats: JourneyStats; timeline: TimelineEntry[]; currentIsland: number; ending?: "ithaca" | "calypso"; }
export interface HomerScene { narrative: string; question: string; }
export interface HomerTransition { resolution: string; action_tag: ActionTag; next_narrative: string; next_question: string; journey_ends: boolean; }
export interface JourneySummary { summary: string; }
export interface JourneyCard { title: string; strength: string; temptation: string; turningPoint: string; ithaca: string; quote: string; }

export function createJourneyMemory(homeGoal: string): JourneyMemory {
  return { homeGoal, stats: { metis: 0, hubris: 0, nostos: 0, trust: 0, temptation: 0, compassion: 0, hope: 0 }, timeline: [], currentIsland: 0 };
}

export function resolveIsland(memory: JourneyMemory, island: IslandDefinition, actionTag: string, playerQuote: string): JourneyMemory {
  if (!island.allowedActionTags.includes(actionTag)) throw new Error(`Action ${actionTag} is not allowed at ${island.name}`);
  const stats = { ...memory.stats };
  for (const [key, value] of Object.entries(island.statDeltas[actionTag] || {})) stats[key as StatKey] += value ?? 0;
  const stayed = island.id === "calypso" && actionTag === "STAY_WITH_CALYPSO";
  const reachedIthaca = island.id === "ithaca";
  return { ...memory, stats, timeline: [...memory.timeline, { island: island.name, action: actionTag, quote: playerQuote }], currentIsland: stayed || reachedIthaca ? memory.currentIsland : memory.currentIsland + 1, ending: stayed ? "calypso" : reachedIthaca ? "ithaca" : undefined };
}

export function getIsland(index: number) { return ISLANDS[index]; }
