import { describe, it, expect, beforeEach } from "vitest";
import {
  computePlayerAggregate,
  computeHeadToHead,
  computeTowerLeaders,
  computeAchievements,
  computePlayerTimeline,
  computeLeagueSummary,
} from "@/lib/engine/stats";
import type { EngineMatch, EnginePlayer, MatchType } from "@/lib/engine/types";

const PLAYERS: EnginePlayer[] = [
  { id: 1, slug: "dashli", name: "داشلی" },
  { id: 2, slug: "hani", name: "هانی" },
  { id: 3, slug: "jaf-haf", name: "جاف حاف" },
  { id: 4, slug: "ali-doli", name: "علی دولی" },
  { id: 5, slug: "ostad", name: "استاد" },
];

const TYPES: MatchType[] = ["custom_deck", "draft_type_1", "draft_type_2", "infinite_elixir"];

let nextId = 1;
function m(
  playerAId: number,
  playerBId: number,
  towersA: number,
  towersB: number,
  matchType: MatchType = TYPES[(nextId - 1) % 4]!,
  scheduledAt = "2026-10-17T00:00:00+03:30",
): EngineMatch {
  return {
    id: nextId++,
    encounterId: Math.min(playerAId, playerBId) * 10 + Math.max(playerAId, playerBId),
    matchType,
    playerAId,
    playerBId,
    scheduledAt,
    nightIndex: 0,
    slotIndex: 0,
    status: "completed",
    towersA,
    towersB,
    winnerId: towersA > towersB ? playerAId : playerBId,
  };
}

beforeEach(() => {
  nextId = 1;
});

describe("آمار بازیکنان", () => {
  it("آمار تجمعی درست محاسبه می‌شود", () => {
    const matches = [m(1, 2, 3, 0), m(1, 2, 2, 1), m(1, 2, 1, 2), m(1, 2, 0, 3)];
    const agg = computePlayerAggregate(1, matches);
    expect(agg.played).toBe(4);
    expect(agg.won).toBe(2);
    expect(agg.lost).toBe(2);
    expect(agg.points).toBe(4);
    expect(agg.towersFor).toBe(6);
    expect(agg.towersAgainst).toBe(6);
    expect(agg.towerDiff).toBe(0);
    expect(agg.threeCrownWins).toBe(1);
    expect(agg.winRate).toBeCloseTo(0.5);
  });

  it("طولانی‌ترین رشتهٔ پیروزی درست است", () => {
    const matches = [
      m(1, 2, 2, 0, "custom_deck", "2026-10-17T00:00:00+03:30"),
      m(1, 2, 2, 1, "draft_type_1", "2026-10-17T00:15:00+03:30"),
      m(1, 2, 0, 2, "draft_type_2", "2026-10-17T00:30:00+03:30"),
      m(1, 2, 3, 0, "infinite_elixir", "2026-10-17T00:45:00+03:30"),
    ];
    const agg = computePlayerAggregate(1, matches);
    expect(agg.longestWinStreak).toBe(2);
    expect(agg.currentStreak).toBe(1);
    expect(agg.currentStreakType).toBe("win");
  });

  it("آمار به تفکیک نوع مسابقه", () => {
    const matches = [m(1, 2, 3, 0, "custom_deck"), m(1, 2, 0, 3, "infinite_elixir")];
    const agg = computePlayerAggregate(1, matches);
    expect(agg.byMatchType.custom_deck).toMatchObject({ played: 1, won: 1, towersFor: 3 });
    expect(agg.byMatchType.infinite_elixir).toMatchObject({ played: 1, lost: 1, towersAgainst: 3 });
    expect(agg.byMatchType.draft_type_1.played).toBe(0);
  });
});

describe("رویارویی مستقیم", () => {
  it("رکورد H2H درست است", () => {
    const matches = [m(1, 2, 3, 0), m(1, 2, 2, 1), m(1, 2, 1, 2), m(1, 2, 0, 3)];
    const h2h = computeHeadToHead(1, PLAYERS, matches);
    const vsHani = h2h.find((r) => r.opponentId === 2)!;
    expect(vsHani.played).toBe(4);
    expect(vsHani.won).toBe(2);
    expect(vsHani.lost).toBe(2);
    expect(vsHani.encounterComplete).toBe(true);
    expect(vsHani.points).toBe(4);
  });

  it("رویارویی ناتمام علامت‌گذاری می‌شود", () => {
    const matches = [m(1, 2, 3, 0), m(1, 2, 2, 1)];
    const h2h = computeHeadToHead(1, PLAYERS, matches);
    const vsHani = h2h.find((r) => r.opponentId === 2)!;
    expect(vsHani.encounterComplete).toBe(false);
  });
});

describe("۲۲) جدول دژگشایان برتر", () => {
  it("مرتب‌سازی بر اساس برج تخریب‌شده، سپس میانگین، سپس تفاضل", () => {
    const matches = [
      // بازیکن ۱: ۳+۳+۲ = ۸ برج در ۳ بازی
      m(1, 2, 3, 0),
      m(1, 2, 3, 0),
      m(1, 2, 2, 1),
      // بازیکن ۳: ۳+۳ = ۶ برج در ۲ بازی (میانگین ۳)
      m(3, 4, 3, 0),
      m(3, 4, 3, 0),
    ];
    const leaders = computeTowerLeaders(PLAYERS, matches);
    expect(leaders[0]!.player.id).toBe(1); // ۸ برج
    expect(leaders[0]!.towersDestroyed).toBe(8);
    expect(leaders[1]!.player.id).toBe(3); // ۶ برج
    expect(leaders[1]!.avgPerMatch).toBeCloseTo(3);
    expect(leaders[0]!.rank).toBe(1);
    expect(leaders[1]!.rank).toBe(2);
  });

  it("رتبهٔ مشترک وقتی همهٔ معیارها برابر است", () => {
    const matches = [
      m(1, 2, 3, 0),
      m(3, 4, 3, 0),
    ];
    const leaders = computeTowerLeaders(PLAYERS, matches);
    const l1 = leaders.find((l) => l.player.id === 1)!;
    const l3 = leaders.find((l) => l.player.id === 3)!;
    expect(l1.towersDestroyed).toBe(l3.towersDestroyed);
    expect(l1.tied).toBe(true);
    expect(l3.tied).toBe(true);
    expect(l1.rank).toBe(l3.rank);
  });
});

describe("افتخارات خودکار", () => {
  it("۱) فقط وقتی شرایط برقرار باشد اعطا می‌شود", () => {
    expect(computeAchievements(PLAYERS, [])).toEqual([]);
    expect(
      computeAchievements(PLAYERS, [
        { id: 1, encounterId: 1, matchType: "custom_deck", playerAId: 1, playerBId: 2, scheduledAt: "2026-10-17T00:00:00+03:30", nightIndex: 0, slotIndex: 0, status: "scheduled", towersA: null, towersB: null, winnerId: null },
      ]),
    ).toEqual([]);
  });

  it("دارندگان افتخارات درست شناسایی می‌شوند", () => {
    const matches = [
      m(1, 2, 3, 0),
      m(1, 2, 3, 0),
      m(1, 2, 2, 1),
      m(1, 2, 2, 1), // داشلی ۴ برد پیاپی، ۱۰ برج، ۲ برد سه‌تاجی
    ];
    const ach = computeAchievements(PLAYERS, matches);
    const mostWins = ach.find((a) => a.key === "most_wins")!;
    expect(mostWins.holderIds).toEqual([1]);
    const streak = ach.find((a) => a.key === "longest_win_streak")!;
    expect(streak.value).toBe(4);
    const three = ach.find((a) => a.key === "most_three_crown")!;
    expect(three.holderIds).toEqual([1]);
  });
});

describe("روند و خلاصهٔ لیگ", () => {
  it("روند تجمعی امتیاز", () => {
    const matches = [
      m(1, 2, 3, 0, "custom_deck", "2026-10-17T00:00:00+03:30"),
      m(1, 2, 0, 3, "draft_type_1", "2026-10-17T00:15:00+03:30"),
      m(1, 2, 2, 1, "draft_type_2", "2026-10-19T00:00:00+03:30"),
    ];
    const tl = computePlayerTimeline(1, matches);
    expect(tl.map((p) => p.cumulativePoints)).toEqual([2, 2, 4]);
    expect(tl.map((p) => p.cumulativeTowers)).toEqual([3, 3, 5]);
  });

  it("خلاصهٔ لیگ", () => {
    const matches = [
      m(1, 2, 3, 0, "custom_deck", "2026-10-17T00:00:00+03:30"),
      {
        ...m(1, 2, 0, 0, "draft_type_1", "2026-10-19T00:00:00+03:30"),
        status: "scheduled" as const,
        towersA: null,
        towersB: null,
        winnerId: null,
      },
    ];
    const summary = computeLeagueSummary(matches, "2026-10-18T00:00:00+03:30");
    expect(summary.completedMatches).toBe(1);
    expect(summary.remainingMatches).toBe(1);
    expect(summary.nextMatch?.id).toBe(2);
    expect(summary.progressPercent).toBe(50);
  });
});
