import { describe, it, expect } from "vitest";
import {
  generateRounds,
  generateTournamentSchedule,
  validateScheduleStructure,
  TOURNAMENT_START,
  DEFAULT_NIGHT_INTERVAL_DAYS,
} from "@/lib/engine/schedule";
import { MATCH_TYPES } from "@/lib/engine/types";

const PLAYER_IDS = [1, 2, 3, 4, 5];

const schedule = generateTournamentSchedule(PLAYER_IDS, {
  startYear: TOURNAMENT_START.year,
  startMonth: TOURNAMENT_START.month,
  startDay: TOURNAMENT_START.day,
  nightIntervalDays: DEFAULT_NIGHT_INTERVAL_DAYS,
});

describe("برنامهٔ مسابقات", () => {
  it("۳) دقیقاً ۴۰ مسابقهٔ استاندارد وجود دارد", () => {
    expect(schedule).toHaveLength(40);
  });

  it("۲) دقیقاً ۱۰ رویارویی یکتای بازیکنی وجود دارد", () => {
    const pairs = new Set(
      schedule.map((s) => [Math.min(s.playerAId, s.playerBId), Math.max(s.playerAId, s.playerBId)].join("-")),
    );
    expect(pairs.size).toBe(10);
  });

  it("۵) هر رویارویی ۴ نوع مسابقهٔ یکتا دارد", () => {
    const map = new Map<string, Set<string>>();
    for (const s of schedule) {
      const key = [Math.min(s.playerAId, s.playerBId), Math.max(s.playerAId, s.playerBId)].join("-");
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(s.matchType);
    }
    for (const [, types] of map) {
      expect([...types].sort()).toEqual([...MATCH_TYPES].sort());
    }
  });

  it("۴) هر بازیکن دقیقاً ۱۶ مسابقه دارد", () => {
    for (const p of PLAYER_IDS) {
      const count = schedule.filter((s) => s.playerAId === p || s.playerBId === p).length;
      expect(count).toBe(16);
    }
  });

  it("۶) هیچ بازیکنی بیش از ۲ مسابقه در یک شب ندارد", () => {
    for (const p of PLAYER_IDS) {
      for (let night = 0; night < 10; night++) {
        const count = schedule.filter(
          (s) => s.nightIndex === night && (s.playerAId === p || s.playerBId === p),
        ).length;
        expect(count).toBeLessThanOrEqual(2);
      }
    }
  });

  it("۷) هیچ دو مسابقه‌ای هم‌زمان نیست", () => {
    const keys = schedule.map((s) => `${s.nightIndex}-${s.slotIndex}`);
    expect(new Set(keys).size).toBe(schedule.length);
    for (const s of schedule) {
      expect(s.slotIndex).toBeGreaterThanOrEqual(0);
      expect(s.slotIndex).toBeLessThanOrEqual(3);
    }
  });

  it("۸) هر بازیکن دقیقاً ۲ شب استراحت دارد", () => {
    for (const p of PLAYER_IDS) {
      const nights = new Set(
        schedule
          .filter((s) => s.playerAId === p || s.playerBId === p)
          .map((s) => s.nightIndex),
      );
      expect(nights.size).toBe(8);
    }
  });

  it("۹) هر بازیکن با هر بازیکن دیگر روبه‌رو می‌شود", () => {
    for (const a of PLAYER_IDS) {
      for (const b of PLAYER_IDS) {
        if (a === b) continue;
        const has = schedule.some(
          (s) =>
            (s.playerAId === a && s.playerBId === b) || (s.playerAId === b && s.playerBId === a),
        );
        expect(has).toBe(true);
      }
    }
  });

  it("هر شب: ۴ مسابقه، ۲ جفت، ۴ بازیکن، ۱ استراحت", () => {
    for (let night = 0; night < 10; night++) {
      const ns = schedule.filter((s) => s.nightIndex === night);
      expect(ns).toHaveLength(4);
      const players = new Set<number>();
      const pairs = new Set<string>();
      for (const s of ns) {
        players.add(s.playerAId);
        players.add(s.playerBId);
        pairs.add([Math.min(s.playerAId, s.playerBId), Math.max(s.playerAId, s.playerBId)].join("-"));
      }
      expect(players.size).toBe(4);
      expect(pairs.size).toBe(2);
    }
  });

  it("مرحله یک و دو: انواع مسابقه درست توزیع شده‌اند", () => {
    for (let night = 0; night < 5; night++) {
      const types = schedule.filter((s) => s.nightIndex === night).map((s) => s.matchType);
      expect(types.sort()).toEqual(["custom_deck", "draft_type_1", "custom_deck", "draft_type_1"].sort());
    }
    for (let night = 5; night < 10; night++) {
      const types = schedule.filter((s) => s.nightIndex === night).map((s) => s.matchType);
      expect(types.sort()).toEqual(["draft_type_2", "infinite_elixir", "draft_type_2", "infinite_elixir"].sort());
    }
  });

  it("برنامه قطعی است و هر بار یکسان تولید می‌شود", () => {
    const again = generateTournamentSchedule(PLAYER_IDS, {
      startYear: TOURNAMENT_START.year,
      startMonth: TOURNAMENT_START.month,
      startDay: TOURNAMENT_START.day,
      nightIntervalDays: DEFAULT_NIGHT_INTERVAL_DAYS,
    });
    expect(again).toEqual(schedule);
    const rounds1 = generateRounds(PLAYER_IDS);
    const rounds2 = generateRounds(PLAYER_IDS);
    expect(rounds1).toEqual(rounds2);
  });

  it("اعتبارسنجی ساختار برنامه موفق است", () => {
    const check = validateScheduleStructure(PLAYER_IDS, schedule);
    expect(check.problems).toEqual([]);
    expect(check.ok).toBe(true);
  });

  it("۲۳) زمان‌بندی به وقت تهران با آفست درست است", () => {
    for (const s of schedule) {
      expect(s.scheduledAt).toMatch(/T00:(00|15|30|45):00\+03:30$/);
    }
    // شب اول: شنبه ۲۵ مهر ۱۴۰۵ = ۲۰۲۶-۱۰-۱۷
    expect(schedule[0]!.scheduledAt.startsWith("2026-10-17T00:00:00+03:30")).toBe(true);
    // شب دوم با فاصلهٔ ۲ روز
    const night1 = schedule.find((s) => s.nightIndex === 1)!;
    expect(night1.scheduledAt.startsWith("2026-10-19T00:00:00+03:30")).toBe(true);
    // شب آخر
    const night9 = schedule.find((s) => s.nightIndex === 9)!;
    expect(night9.scheduledAt.startsWith("2026-11-04T00:00:00+03:30")).toBe(true);
  });
});
