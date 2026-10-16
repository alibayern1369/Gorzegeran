/**
 * هستهٔ مسابقات لیگ گرز گران — انواع دادهٔ مشترک
 * Tournament engine shared domain types.
 */

export const MATCH_TYPES = [
  "custom_deck",
  "draft_type_1",
  "draft_type_2",
  "infinite_elixir",
] as const;

export type MatchType = (typeof MATCH_TYPES)[number];

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  custom_deck: "دک انتخابی",
  draft_type_1: "درفت نوع ۱",
  draft_type_2: "درفت نوع ۲",
  infinite_elixir: "اکسیر بی‌نهایت",
};

export const MATCH_TYPE_LABELS_EN: Record<MatchType, string> = {
  custom_deck: "Custom Deck",
  draft_type_1: "Draft Type 1",
  draft_type_2: "Draft Type 2",
  infinite_elixir: "Infinite Elixir",
};

export const MATCH_STATUSES = [
  "scheduled",
  "live",
  "completed",
  "postponed",
  "cancelled",
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "زمان‌بندی‌شده",
  live: "در حال برگزاری",
  completed: "برگزار شده",
  postponed: "به تعویق افتاده",
  cancelled: "لغو شده",
};

/** امتیاز برد در هر مسابقهٔ انفرادی */
export const WIN_POINTS = 2;
/** امتیاز باخت در هر مسابقهٔ انفرادی */
export const LOSS_POINTS = 0;
/** حداکثر تاج (برج) تخریب‌شده در یک مسابقه */
export const MAX_TOWERS = 3;
/** تعداد مسابقات هر رویارویی */
export const MATCHES_PER_ENCOUNTER = 4;
/** تعداد بازیکنان لیگ */
export const LEAGUE_SIZE = 5;
/** تعداد شب‌های مسابقات */
export const TOTAL_NIGHTS = 10;
/** اسلات‌های شروع مسابقه (به وقت تهران، پس از نیمه‌شب) */
export const NIGHT_SLOTS_MINUTES = [0, 15, 30, 45] as const;

export interface EnginePlayer {
  id: number;
  slug: string;
  name: string;
}

export interface EngineMatch {
  id: number;
  encounterId: number;
  matchType: MatchType;
  playerAId: number;
  playerBId: number;
  /** ISO 8601 */
  scheduledAt: string;
  nightIndex: number;
  slotIndex: number;
  status: MatchStatus;
  towersA: number | null;
  towersB: number | null;
  winnerId: number | null;
}

export interface EngineEncounter {
  id: number;
  /** شب شروع (مرحلهٔ یک) */
  nightIndex: number;
  playerAId: number;
  playerBId: number;
}

export interface PlayerStandingRow {
  player: EnginePlayer;
  rank: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  towersFor: number;
  towersAgainst: number;
  towerDiff: number;
  /** تعداد پیروزی‌های سه‌تاجی */
  threeCrownWins: number;
  /** آیا این رتبه نیاز به بازی تکلیفی دارد */
  requiresTiebreak: boolean;
  /** رتبه‌های مشترک (وقتی معیارها برابر بمانند) */
  sharedRank: boolean;
}

export interface StandingsResult {
  rows: PlayerStandingRow[];
  isComplete: boolean;
  completedMatches: number;
  totalMatches: number;
}

export interface HeadToHeadRecord {
  opponentId: number;
  played: number;
  won: number;
  lost: number;
  towersFor: number;
  towersAgainst: number;
  towerDiff: number;
  points: number;
  encounterComplete: boolean;
  encounterWon: number;
  encounterLost: number;
}

export interface TowerLeaderRow {
  player: EnginePlayer;
  towersDestroyed: number;
  towersLost: number;
  towerDiff: number;
  played: number;
  avgPerMatch: number;
  rank: number;
  tied: boolean;
}
