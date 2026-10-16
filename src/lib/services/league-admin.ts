import { eq, inArray, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { AppDatabase } from "../db/client";
import * as s from "../db/schema";
import { generateTournamentSchedule } from "../engine/schedule";
import { bumpDataVersion, getActiveTournament, getSettings } from "../queries";

export class LeagueError extends Error {}

export interface LeagueConfiguration {
  startDate: string;
  startTime: string;
  nightIntervalDays: number;
  slotMinutes: number;
  matchTypes: string[];
}

export async function lockLeague(db: AppDatabase) {
  const tournament = await getActiveTournament(db);
  await db.execute(
    sql`select id from tournaments where id = ${tournament.id} for update`,
  );
  return tournament;
}

/** Reconcile by encounter + game position. Completed results are never silently discarded. */
export async function reconcileSchedule(
  db: AppDatabase,
  tournamentId: number,
  config: LeagueConfiguration,
) {
  const players = await db.select().from(s.players).orderBy(s.players.id);
  const slotsPerNight =
    Math.floor(players.length / 2) * Math.min(2, config.matchTypes.length);
  if (slotsPerNight * config.slotMinutes > config.nightIntervalDays * 1440)
    throw new LeagueError(
      "فاصلهٔ دورها برای این تعداد بازی کافی نیست؛ فاصلهٔ روزها را بیشتر یا فاصلهٔ دقیقه‌ای بازی‌ها را کمتر کنید.",
    );
  const existing = await db
    .select()
    .from(s.matches)
    .where(eq(s.matches.tournamentId, tournamentId));
  const encounters = await db
    .select()
    .from(s.encounters)
    .where(eq(s.encounters.tournamentId, tournamentId));
  const pair = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;
  const encounterMap = new Map(
    encounters.map((e) => [pair(e.playerAId, e.playerBId), e.id]),
  );
  const [startYear, startMonth, startDay] = config.startDate
    .split("-")
    .map(Number) as [number, number, number];
  const slots =
    players.length < 2
      ? []
      : generateTournamentSchedule(
          players.map((p) => p.id),
          { ...config, startYear, startMonth, startDay },
        );
  const desired = new Map(
    slots.map((slot) => [
      `${pair(slot.playerAId, slot.playerBId)}:${slot.gameIndex}`,
      slot,
    ]),
  );
  for (const m of existing) {
    const target = desired.get(
      `${pair(m.playerAId, m.playerBId)}:${m.gameIndex}`,
    );
    if (
      m.status === "completed" &&
      (!target || target.matchType !== m.matchType)
    ) {
      throw new LeagueError(
        "این تغییر نتیجهٔ ثبت‌شده را حذف یا نوع آن را عوض می‌کند. ابتدا نتیجهٔ مربوط را از بخش نتایج حذف کنید.",
      );
    }
  }
  // Release unique time slots before assigning the new schedule; completed records retain their timestamps.
  await db
    .update(s.matches)
    .set({ nightIndex: sql`-${s.matches.id}`, slotIndex: 0 })
    .where(eq(s.matches.tournamentId, tournamentId));
  const existingMap = new Map(
    existing.map((m) => [
      `${pair(m.playerAId, m.playerBId)}:${m.gameIndex}`,
      m,
    ]),
  );
  const used = new Set<number>();
  const newPairs = new Map<string, typeof s.encounters.$inferInsert>();
  for (const slot of slots) {
    const key = pair(slot.playerAId, slot.playerBId);
    if (!encounterMap.has(key) && !newPairs.has(key))
      newPairs.set(key, {
        tournamentId,
        playerAId: slot.playerAId,
        playerBId: slot.playerBId,
        nightIndex: slot.nightIndex,
      });
  }
  if (newPairs.size) {
    const added = await db
      .insert(s.encounters)
      .values([...newPairs.values()])
      .returning();
    for (const e of added)
      encounterMap.set(pair(e.playerAId, e.playerBId), e.id);
  }
  const planned: Array<typeof s.matches.$inferInsert> = [];
  for (const slot of slots) {
    const key = pair(slot.playerAId, slot.playerBId);
    const encounterId = encounterMap.get(key)!;
    const old = existingMap.get(`${key}:${slot.gameIndex}`);
    const values = {
      matchType: slot.matchType,
      nightIndex: slot.nightIndex,
      slotIndex: slot.slotIndex,
      scheduledAt:
        old?.status === "completed"
          ? old.scheduledAt
          : new Date(slot.scheduledAt),
      updatedAt: new Date(),
    };
    if (old) used.add(old.id);
    planned.push({
      ...values,
      tournamentId,
      encounterId,
      playerAId: slot.playerAId,
      playerBId: slot.playerBId,
      gameIndex: slot.gameIndex,
      status: old?.status ?? "scheduled",
      towersA: old?.towersA,
      towersB: old?.towersB,
      winnerId: old?.winnerId,
      resultRecordedAt: old?.resultRecordedAt,
    });
  }
  // Keep batches below Postgres parameter limits, including larger configured leagues.
  for (let i = 0; i < planned.length; i += 500) {
    await db
      .insert(s.matches)
      .values(planned.slice(i, i + 500))
      .onConflictDoUpdate({
        target: [s.matches.encounterId, s.matches.gameIndex],
        set: {
          matchType: sql`excluded.match_type`,
          nightIndex: sql`excluded.night_index`,
          slotIndex: sql`excluded.slot_index`,
          scheduledAt: sql`excluded.scheduled_at`,
          updatedAt: new Date(),
        },
      });
  }
  const obsolete = existing.filter((m) => !used.has(m.id)).map((m) => m.id);
  if (obsolete.length)
    await db.delete(s.matches).where(inArray(s.matches.id, obsolete));
  const activePairs = new Set(
    slots.map((slot) => pair(slot.playerAId, slot.playerBId)),
  );
  const obsoleteEncounters = encounters
    .filter((e) => !activePairs.has(pair(e.playerAId, e.playerBId)))
    .map((e) => e.id);
  if (obsoleteEncounters.length)
    await db
      .delete(s.encounters)
      .where(inArray(s.encounters.id, obsoleteEncounters));
}

export async function currentConfiguration(
  db: AppDatabase,
  tournament: s.Tournament,
): Promise<LeagueConfiguration> {
  const settings = await getSettings(tournament.id, db);
  return {
    startDate: tournament.startDate,
    nightIntervalDays: tournament.nightIntervalDays,
    startTime: settings?.startTime ?? "00:00",
    slotMinutes: settings?.slotMinutes ?? 15,
    matchTypes: settings?.matchTypes ?? [
      "custom_deck",
      "draft_type_1",
      "draft_type_2",
      "infinite_elixir",
    ],
  };
}

export async function storeImage(
  db: AppDatabase,
  file: FormDataEntryValue | null,
  size = 512,
): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 1024 * 1024)
    throw new LeagueError("حداکثر حجم تصویر ۱ مگابایت است.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new LeagueError("تصویر باید PNG، JPG یا WebP باشد.");
  let content: Buffer;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
      animated: false,
    });
    const metadata = await input.metadata();
    if (!["png", "jpeg", "webp"].includes(metadata.format ?? ""))
      throw new LeagueError();
    content = await input
      .rotate()
      .resize(size, size, { fit: "cover" })
      .png({ palette: true, quality: 95 })
      .toBuffer();
  } catch {
    throw new LeagueError("تصویر معتبر نیست یا ابعاد آن بیش از حد بزرگ است.");
  }
  const id = randomUUID();
  await db
    .insert(s.mediaAssets)
    .values({ id, content: content.toString("base64"), mimeType: "image/png" });
  return `/media/${id}`;
}

export async function removePlayer(
  db: AppDatabase,
  playerId: number,
  userId: number,
) {
  const tournament = await lockLeague(db);
  const [player] = await db
    .select()
    .from(s.players)
    .where(eq(s.players.id, playerId));
  if (!player) throw new LeagueError("بازیکن یافت نشد.");
  const involved = or(
    eq(s.matches.playerAId, playerId),
    eq(s.matches.playerBId, playerId),
  );
  // Results cascade from matches; the explicit confirmation in the UI names this consequence.
  await db.delete(s.matches).where(involved);
  await db
    .delete(s.encounters)
    .where(
      or(
        eq(s.encounters.playerAId, playerId),
        eq(s.encounters.playerBId, playerId),
      ),
    );
  await db
    .delete(s.tiebreakMatches)
    .where(
      or(
        eq(s.tiebreakMatches.playerAId, playerId),
        eq(s.tiebreakMatches.playerBId, playerId),
      ),
    );
  await db.delete(s.players).where(eq(s.players.id, playerId));
  await reconcileSchedule(
    db,
    tournament.id,
    await currentConfiguration(db, tournament),
  );
  await db
    .update(s.tournaments)
    .set({ championPlayerId: null, status: "active", updatedAt: new Date() })
    .where(eq(s.tournaments.id, tournament.id));
  await db.insert(s.auditLogs).values({
    userId,
    action: "player_updated",
    entityType: "player",
    entityId: playerId,
    previousValue: player,
    newValue: null,
    note: "بازیکن و مسابقات وابسته با تأیید مدیر حذف شدند.",
  });
  await bumpDataVersion(db);
}
