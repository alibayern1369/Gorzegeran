/**
 * هستهٔ Seed — درج داده‌های اولیهٔ لیگ (بازیکنان، تورنمنت، برنامهٔ قطعی ۱۰ شبته)
 * هم در اسکریپت‌ها و هم در تست‌های یکپارچگی استفاده می‌شود.
 */
import { eq } from "drizzle-orm";
import type { AppDatabase } from "./client";
import * as s from "./schema";
import {
  generateTournamentSchedule,
  TOURNAMENT_START,
  DEFAULT_NIGHT_INTERVAL_DAYS,
  validateScheduleStructure,
  type ScheduledMatchSlot,
} from "../engine/schedule";
import { PLAYER_SEEDS, TOURNAMENT_NAME, TOURNAMENT_SUBTITLE } from "../constants";
import { hashPassword } from "../auth/password";

export interface SeedOptions {
  adminEmail?: string;
  adminPassword?: string;
  adminDisplayName?: string;
}

export interface SeedResult {
  tournamentId: number;
  playerIds: number[];
  encounterIds: number[];
  matchIds: number[];
  schedule: ScheduledMatchSlot[];
}

export async function seedDatabase(
  db: AppDatabase,
  options: SeedOptions = {},
): Promise<SeedResult> {
  // ۱) بازیکنان
  for (const p of PLAYER_SEEDS) {
    await db
      .insert(s.players)
      .values({
        id: p.id,
        slug: p.slug,
        name: p.name,
        title: p.title,
        accentColor: p.accent,
        avatarStyle: p.avatarStyle,
      })
      .onConflictDoNothing();
  }

  // ۲) تورنمنت
  const existing = await db.select().from(s.tournaments).limit(1);
  let tournamentId = existing[0]?.id;
  if (!tournamentId) {
    const inserted = await db
      .insert(s.tournaments)
      .values({
        slug: "garz-e-geran-s1",
        name: TOURNAMENT_NAME,
        subtitle: TOURNAMENT_SUBTITLE,
        season: 1,
        status: "active",
        startDate: `${TOURNAMENT_START.year}-${String(TOURNAMENT_START.month).padStart(2, "0")}-${String(TOURNAMENT_START.day).padStart(2, "0")}`,
        nightIntervalDays: DEFAULT_NIGHT_INTERVAL_DAYS,
      })
      .returning();
    tournamentId = inserted[0]!.id;
    await db.insert(s.tournamentSettings).values({ tournamentId });
  }

  // ۳) حضور بازیکنان
  const playerIds = PLAYER_SEEDS.map((p) => p.id);
  for (const playerId of playerIds) {
    await db
      .insert(s.tournamentPlayers)
      .values({ tournamentId, playerId })
      .onConflictDoNothing();
  }

  // ۴) برنامهٔ قطعی
  const schedule = generateTournamentSchedule(playerIds, {
    startYear: TOURNAMENT_START.year,
    startMonth: TOURNAMENT_START.month,
    startDay: TOURNAMENT_START.day,
    nightIntervalDays: DEFAULT_NIGHT_INTERVAL_DAYS,
  });
  const check = validateScheduleStructure(playerIds, schedule);
  if (!check.ok) {
    throw new Error(`برنامهٔ تولیدشده نامعتبر است: ${check.problems.join(" | ")}`);
  }

  // ۵) رویارویی‌ها (یک رویارویی برای هر جفت بازیکن)
  const encounterMap = new Map<string, number>();
  const encounterIds: number[] = [];
  const existingEncounters = await db
    .select()
    .from(s.encounters)
    .where(eq(s.encounters.tournamentId, tournamentId));
  for (const e of existingEncounters) {
    encounterMap.set(`${e.playerAId}-${e.playerBId}`, e.id);
    encounterIds.push(e.id);
  }

  const firstNightByPair = new Map<string, number>();
  for (const slot of schedule) {
    const a = Math.min(slot.playerAId, slot.playerBId);
    const b = Math.max(slot.playerAId, slot.playerBId);
    const key = `${a}-${b}`;
    const prev = firstNightByPair.get(key);
    if (prev === undefined || slot.nightIndex < prev) {
      firstNightByPair.set(key, slot.nightIndex);
    }
  }

  for (const [key, nightIndex] of firstNightByPair) {
    if (encounterMap.has(key)) continue;
    const [a, b] = key.split("-").map(Number) as [number, number];
    const inserted = await db
      .insert(s.encounters)
      .values({
        tournamentId,
        nightIndex,
        playerAId: a,
        playerBId: b,
      })
      .returning();
    encounterMap.set(key, inserted[0]!.id);
    encounterIds.push(inserted[0]!.id);
  }

  // ۶) مسابقات (۴۰ مسابقه)
  const matchIds: number[] = [];
  const existingMatches = await db
    .select()
    .from(s.matches)
    .where(eq(s.matches.tournamentId, tournamentId));
  const existingKeys = new Set(existingMatches.map((m) => `${m.encounterId}-${m.matchType}`));
  for (const m of existingMatches) matchIds.push(m.id);

  if (existingMatches.length === 0) {
    for (const slot of schedule) {
      const a = Math.min(slot.playerAId, slot.playerBId);
      const b = Math.max(slot.playerAId, slot.playerBId);
      const encounterId = encounterMap.get(`${a}-${b}`)!;
      const key = `${encounterId}-${slot.matchType}`;
      if (existingKeys.has(key)) continue;
      const inserted = await db
        .insert(s.matches)
        .values({
          tournamentId,
          encounterId,
          matchType: slot.matchType,
          playerAId: slot.playerAId,
          playerBId: slot.playerBId,
          scheduledAt: new Date(slot.scheduledAt),
          nightIndex: slot.nightIndex,
          slotIndex: slot.slotIndex,
          status: "scheduled",
        })
        .returning();
      matchIds.push(inserted[0]!.id);
      existingKeys.add(key);
    }
  }

  // ۷) کاربر مدیر (اختیاری — از متغیرهای محیطی)
  const adminEmail = options.adminEmail ?? process.env.ADMIN_EMAIL;
  const adminPassword = options.adminPassword ?? process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const found = await db.select().from(s.users).where(eq(s.users.email, adminEmail)).limit(1);
    if (!found[0]) {
      await db.insert(s.users).values({
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        displayName: options.adminDisplayName ?? "مدیر لیگ",
        role: "admin",
      });
    }
  }

  // ۸) نسخهٔ داده برای به‌روزرسانی بلادرنگ
  await db
    .insert(s.meta)
    .values({ key: "data_version", value: { v: 1 } })
    .onConflictDoUpdate({
      target: s.meta.key,
      set: { value: { v: 1 }, updatedAt: new Date() },
    });

  return {
    tournamentId,
    playerIds,
    encounterIds,
    matchIds,
    schedule,
  };
}
