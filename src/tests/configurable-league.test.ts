import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { seedDatabase } from "@/lib/db/seed-core";
import { generateTournamentSchedule } from "@/lib/engine/schedule";
import {
  reconcileSchedule,
  removePlayer,
  storeImage,
} from "@/lib/services/league-admin";
import { recordResult } from "@/lib/services/results";
import { loadLeagueData } from "@/lib/queries";
import { computeHeadToHead } from "@/lib/engine/stats";
import * as s from "@/lib/db/schema";
const types = [
  "custom_deck",
  "draft_type_1",
  "draft_type_2",
  "infinite_elixir",
  "درفت ویژه",
  "custom_deck",
];
const config = {
  startDate: "2026-10-23",
  startTime: "23:45",
  nightIntervalDays: 2,
  slotMinutes: 15,
  matchTypes: types,
};
describe("برنامهٔ قابل تنظیم", () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8])
    it(`${n} players, six games including repeated/custom models`, () => {
      const ids = Array.from({ length: n }, (_, i) => i + 1);
      const slots = generateTournamentSchedule(ids, {
        ...config,
        startYear: 2026,
        startMonth: 10,
        startDay: 23,
      });
      expect(slots).toHaveLength(((n * (n - 1)) / 2) * 6);
      const pairs = new Map<string, typeof slots>();
      for (const slot of slots) {
        const key = `${slot.playerAId}-${slot.playerBId}`;
        pairs.set(key, [...(pairs.get(key) ?? []), slot]);
        expect(Number.isFinite(new Date(slot.scheduledAt).getTime())).toBe(
          true,
        );
      }
      for (const group of pairs.values()) {
        expect(group.map((x) => x.matchType)).toEqual(types);
        expect(group.map((x) => x.gameIndex)).toEqual([0, 1, 2, 3, 4, 5]);
      }
      expect(new Set(slots.map((x) => x.scheduledAt)).size).toBe(slots.length);
    });
});
describe("تغییر لیگ با حفظ نتایج", () => {
  let created: Awaited<ReturnType<typeof createTestDb>>;
  beforeAll(async () => {
    created = await createTestDb();
    await runMigrations(created.db);
    await seedDatabase(created.db);
  });
  afterAll(async () => {
    await created.pglite.close();
  });
  it("six games, adding and deleting a sixth player, preserving completed results", async () => {
    const db = created.db;
    let data = await loadLeagueData(db);
    const first = data.matches[0]!;
    expect(
      (
        await recordResult(db, null, {
          matchId: first.id,
          towersA: 2,
          towersB: 1,
        })
      ).ok,
    ).toBe(true);
    await db.transaction((tx) =>
      reconcileSchedule(tx, data.tournament.id, config),
    );
    data = await loadLeagueData(db);
    expect(data.matches).toHaveLength(60);
    expect(data.matches.find((m) => m.id === first.id)?.towersA).toBe(2);
    const incomplete = computeHeadToHead(
      first.playerAId,
      data.enginePlayers,
      data.engineMatches,
    ).find((r) => r.opponentId === first.playerBId)!;
    expect(incomplete.encounterComplete).toBe(false);
    await db.insert(s.players).values({ id: 6, slug: "sixth", name: "ششم" });
    await db.transaction((tx) =>
      reconcileSchedule(tx, data.tournament.id, config),
    );
    expect((await loadLeagueData(db)).matches).toHaveLength(90);
    await db.insert(s.users).values({
      id: 1,
      email: "test@example.test",
      passwordHash: "unused",
      displayName: "مدیر",
    });
    // Persist the six-game plan so player removal uses the same configuration.
    await db
      .update(s.tournamentSettings)
      .set({ matchTypes: types, matchesPerEncounter: 6 })
      .where(eq(s.tournamentSettings.tournamentId, data.tournament.id));
    await db.transaction((tx) => removePlayer(tx, 6, 1));
    data = await loadLeagueData(db);
    expect(data.matches).toHaveLength(60);
    expect(data.players).toHaveLength(5);
    expect(data.matches.find((m) => m.id === first.id)?.winnerId).toBe(
      first.playerAId,
    );
  });
  it("rejects changing the model of a completed match and rolls back", async () => {
    const db = created.db;
    const before = await loadLeagueData(db);
    await expect(
      db.transaction((tx) =>
        reconcileSchedule(tx, before.tournament.id, {
          ...config,
          matchTypes: ["changed"],
        }),
      ),
    ).rejects.toThrow("نتیجهٔ ثبت‌شده");
    expect((await loadLeagueData(db)).matches).toEqual(before.matches);
  });
  it("rejects disguised or oversized image uploads", async () => {
    await expect(
      storeImage(
        created.db,
        new File(["not an image"], "fake.png", { type: "image/png" }),
      ),
    ).rejects.toThrow("تصویر معتبر نیست");
    await expect(
      storeImage(
        created.db,
        new File([new Uint8Array(1024 * 1024 + 1)], "large.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow("حجم تصویر");
  });
});
