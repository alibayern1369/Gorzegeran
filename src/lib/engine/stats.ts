/**
 * موتور آمار لیگ گرز گران — آمار بازیکنان، رویارویی مستقیم، دژگشایان برتر، افتخارات
 * Pure statistics derivations (never incremental — always recomputed from match records).
 */
import type {
  EngineMatch,
  EnginePlayer,
  HeadToHeadRecord,
  MatchType,
  TowerLeaderRow,
} from "./types";
import { MATCHES_PER_ENCOUNTER, MATCH_TYPES, WIN_POINTS } from "./types";
import { isCountableMatch } from "./ranking";

export interface PlayerAggregate {
  playerId: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  towersFor: number;
  towersAgainst: number;
  towerDiff: number;
  threeCrownWins: number;
  winRate: number;
  longestWinStreak: number;
  currentStreak: number;
  currentStreakType: "win" | "loss" | "none";
  byMatchType: Record<
    (typeof MATCH_TYPES)[number],
    {
      played: number;
      won: number;
      lost: number;
      towersFor: number;
      towersAgainst: number;
    }
  > &
    Record<
      string,
      {
        played: number;
        won: number;
        lost: number;
        towersFor: number;
        towersAgainst: number;
      }
    >;
}

export function computePlayerAggregate(
  playerId: number,
  matches: EngineMatch[],
): PlayerAggregate {
  const agg: PlayerAggregate = {
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    points: 0,
    towersFor: 0,
    towersAgainst: 0,
    towerDiff: 0,
    threeCrownWins: 0,
    winRate: 0,
    longestWinStreak: 0,
    currentStreak: 0,
    currentStreakType: "none",
    byMatchType: {
      custom_deck: {
        played: 0,
        won: 0,
        lost: 0,
        towersFor: 0,
        towersAgainst: 0,
      },
      draft_type_1: {
        played: 0,
        won: 0,
        lost: 0,
        towersFor: 0,
        towersAgainst: 0,
      },
      draft_type_2: {
        played: 0,
        won: 0,
        lost: 0,
        towersFor: 0,
        towersAgainst: 0,
      },
      infinite_elixir: {
        played: 0,
        won: 0,
        lost: 0,
        towersFor: 0,
        towersAgainst: 0,
      },
    },
  };

  const involved = matches
    .filter(
      (m) =>
        isCountableMatch(m) &&
        (m.playerAId === playerId || m.playerBId === playerId),
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id);

  let streak = 0;
  let streakType: "win" | "loss" | "none" = "none";

  for (const m of involved) {
    const isA = m.playerAId === playerId;
    const my = isA ? m.towersA! : m.towersB!;
    const opp = isA ? m.towersB! : m.towersA!;
    const won = m.winnerId === playerId;
    agg.played++;
    agg.towersFor += my;
    agg.towersAgainst += opp;
    const t = (agg.byMatchType[m.matchType] ??= {
      played: 0,
      won: 0,
      lost: 0,
      towersFor: 0,
      towersAgainst: 0,
    });
    t.played++;
    t.towersFor += my;
    t.towersAgainst += opp;
    if (won) {
      agg.won++;
      agg.points += WIN_POINTS;
      t.won++;
      if (my === 3 && opp === 0) agg.threeCrownWins++;
      if (streakType === "win") streak++;
      else {
        streak = 1;
        streakType = "win";
      }
      agg.longestWinStreak = Math.max(agg.longestWinStreak, streak);
    } else {
      agg.lost++;
      t.lost++;
      if (streakType === "loss") streak++;
      else {
        streak = 1;
        streakType = "loss";
      }
    }
  }

  agg.towerDiff = agg.towersFor - agg.towersAgainst;
  agg.winRate = agg.played > 0 ? agg.won / agg.played : 0;
  agg.currentStreak = streakType === "none" ? 0 : streak;
  agg.currentStreakType = streakType;
  return agg;
}

/** رکورد رویارویی مستقیم بازیکن مقابل هر حریف */
export function computeHeadToHead(
  playerId: number,
  players: EnginePlayer[],
  matches: EngineMatch[],
): HeadToHeadRecord[] {
  const records: HeadToHeadRecord[] = [];
  for (const opponent of players) {
    if (opponent.id === playerId) continue;
    const rec: HeadToHeadRecord = {
      opponentId: opponent.id,
      played: 0,
      won: 0,
      lost: 0,
      towersFor: 0,
      towersAgainst: 0,
      towerDiff: 0,
      points: 0,
      encounterComplete: false,
      encounterWon: 0,
      encounterLost: 0,
    };
    let completed = 0;
    for (const m of matches) {
      const involves =
        (m.playerAId === playerId && m.playerBId === opponent.id) ||
        (m.playerAId === opponent.id && m.playerBId === playerId);
      if (!involves || !isCountableMatch(m)) continue;
      completed++;
      const isA = m.playerAId === playerId;
      const my = isA ? m.towersA! : m.towersB!;
      const opp = isA ? m.towersB! : m.towersA!;
      rec.played++;
      rec.towersFor += my;
      rec.towersAgainst += opp;
      if (m.winnerId === playerId) {
        rec.won++;
        rec.points += WIN_POINTS;
      } else {
        rec.lost++;
      }
    }
    rec.towerDiff = rec.towersFor - rec.towersAgainst;
    const expected =
      matches.find(
        (m) =>
          m.encounterSize !== undefined &&
          ((m.playerAId === playerId && m.playerBId === opponent.id) ||
            (m.playerBId === playerId && m.playerAId === opponent.id)),
      )?.encounterSize ?? MATCHES_PER_ENCOUNTER;
    rec.encounterComplete = expected > 0 && completed === expected;
    rec.encounterWon = rec.won;
    rec.encounterLost = rec.lost;
    records.push(rec);
  }
  return records;
}

/** جدول دژگشایان برتر — مرتب‌سازی بر اساس برج تخریب‌شده، سپس میانگین، سپس تفاضل */
export function computeTowerLeaders(
  players: EnginePlayer[],
  matches: EngineMatch[],
): TowerLeaderRow[] {
  const sorted = players
    .map((p) => {
      const agg = computePlayerAggregate(p.id, matches);
      return {
        player: p,
        towersDestroyed: agg.towersFor,
        towersLost: agg.towersAgainst,
        towerDiff: agg.towerDiff,
        played: agg.played,
        avgPerMatch: agg.played > 0 ? agg.towersFor / agg.played : 0,
        rank: 0,
        tied: false,
      };
    })
    .sort(
      (a, b) =>
        b.towersDestroyed - a.towersDestroyed ||
        b.avgPerMatch - a.avgPerMatch ||
        b.towerDiff - a.towerDiff ||
        a.player.id - b.player.id,
    );

  // رتبه‌بندی با امکان اشتراک رتبه
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]!;
    const prev = i > 0 ? sorted[i - 1]! : null;
    const equalPrev =
      prev !== null &&
      prev.towersDestroyed === row.towersDestroyed &&
      Math.abs(prev.avgPerMatch - row.avgPerMatch) < 1e-9 &&
      prev.towerDiff === row.towerDiff;
    if (equalPrev) {
      row.rank = prev.rank;
      row.tied = true;
      prev.tied = true;
    } else {
      row.rank = i + 1;
    }
  }
  return sorted;
}

export type AchievementKey =
  | "most_wins"
  | "most_towers"
  | "best_diff"
  | "most_three_crown"
  | "longest_win_streak";

export interface Achievement {
  key: AchievementKey;
  label: string;
  description: string;
  holderIds: number[];
  value: number;
  shared: boolean;
}

const ACHIEVEMENT_LABELS: Record<
  AchievementKey,
  { label: string; description: string }
> = {
  most_wins: {
    label: "پهلوان پیروز",
    description: "بیشترین برد در مسابقات انفرادی",
  },
  most_towers: {
    label: "دژگشای برتر",
    description: "بیشترین برج تخریب‌شده",
  },
  best_diff: {
    label: "سپر آسمانی",
    description: "بهترین تفاضل برج لیگ",
  },
  most_three_crown: {
    label: "تاج‌دار",
    description: "بیشترین پیروزی سه‌تاجی",
  },
  longest_win_streak: {
    label: "شمشیر شکست‌ناپذیر",
    description: "بلندترین رشتهٔ پیروزی پیاپی",
  },
};

/** افتخارات خودکار — فقط وقتی شرایط واقعاً برقرار باشد اعطا می‌شود */
export function computeAchievements(
  players: EnginePlayer[],
  matches: EngineMatch[],
): Achievement[] {
  const aggs = players.map((p) => computePlayerAggregate(p.id, matches));
  const anyCompleted = matches.some(isCountableMatch);
  const out: Achievement[] = [];
  if (!anyCompleted) return out;

  const push = (
    key: AchievementKey,
    pick: (a: PlayerAggregate) => number,
    minValue = 1,
  ) => {
    const values = aggs.map((a) => pick(a));
    const best = Math.max(...values);
    if (best < minValue) return;
    const holderIds = aggs
      .filter((a) => pick(a) === best)
      .map((a) => a.playerId);
    out.push({
      key,
      ...ACHIEVEMENT_LABELS[key],
      holderIds,
      value: best,
      shared: holderIds.length > 1,
    });
  };

  push("most_wins", (a) => a.won);
  push("most_towers", (a) => a.towersFor);
  push("best_diff", (a) => a.towerDiff);
  push("most_three_crown", (a) => a.threeCrownWins);
  push("longest_win_streak", (a) => a.longestWinStreak, 2);
  return out;
}

export interface PointsTimelinePoint {
  /** ISO زمان مسابقه */
  at: string;
  matchId: number;
  cumulativePoints: number;
  cumulativeTowers: number;
  opponentId: number;
  won: boolean;
}

/** روند تجمعی امتیاز و برج‌های یک بازیکن */
export function computePlayerTimeline(
  playerId: number,
  matches: EngineMatch[],
): PointsTimelinePoint[] {
  const involved = matches
    .filter(
      (m) =>
        isCountableMatch(m) &&
        (m.playerAId === playerId || m.playerBId === playerId),
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id);

  let points = 0;
  let towers = 0;
  return involved.map((m) => {
    const isA = m.playerAId === playerId;
    const my = isA ? m.towersA! : m.towersB!;
    const won = m.winnerId === playerId;
    points += won ? WIN_POINTS : 0;
    towers += my;
    return {
      at: m.scheduledAt,
      matchId: m.id,
      cumulativePoints: points,
      cumulativeTowers: towers,
      opponentId: isA ? m.playerBId : m.playerAId,
      won,
    };
  });
}

/** مسابقات آتی یک بازیکن */
export function upcomingMatchesFor(
  playerId: number,
  matches: EngineMatch[],
  nowIso: string,
): EngineMatch[] {
  return matches
    .filter(
      (m) =>
        (m.playerAId === playerId || m.playerBId === playerId) &&
        (m.status === "scheduled" ||
          m.status === "live" ||
          m.status === "postponed"),
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id)
    .filter((m) => m.scheduledAt >= nowIso || m.status === "postponed");
}

/** آمار خلاصهٔ برای صفحهٔ اصلی */
export interface LeagueSummary {
  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;
  cancelledMatches: number;
  liveMatches: number;
  progressPercent: number;
  nextMatch: EngineMatch | null;
  latestResults: EngineMatch[];
}

export function computeLeagueSummary(
  matches: EngineMatch[],
  nowIso: string,
): LeagueSummary {
  const totalMatches = matches.filter((m) => m.status !== "cancelled").length;
  const completedMatches = matches.filter(isCountableMatch).length;
  const cancelledMatches = matches.filter(
    (m) => m.status === "cancelled",
  ).length;
  const liveMatches = matches.filter((m) => m.status === "live").length;
  const remainingMatches = matches.filter(
    (m) =>
      m.status === "scheduled" ||
      m.status === "postponed" ||
      m.status === "live",
  ).length;

  const upcoming = matches
    .filter(
      (m) =>
        (m.status === "scheduled" || m.status === "postponed") &&
        m.scheduledAt >= nowIso,
    )
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt) || a.id - b.id);

  const latestResults = matches
    .filter(isCountableMatch)
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt) || b.id - a.id)
    .slice(0, 6);

  return {
    totalMatches,
    completedMatches,
    remainingMatches,
    cancelledMatches,
    liveMatches,
    progressPercent:
      totalMatches > 0
        ? Math.round((completedMatches / totalMatches) * 100)
        : 0,
    nextMatch: upcoming[0] ?? null,
    latestResults,
  };
}

export { MATCH_TYPES };
