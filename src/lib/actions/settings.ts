"use server";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { toGregorian, isValidJalaaliDate } from "jalaali-js";
import { getDb } from "../db/client";
import * as s from "../db/schema";
import { requireAdminPage } from "../auth/guard";
import { bumpDataVersion } from "../queries";
import { getBranding } from "../branding";
import {
  LeagueError,
  currentConfiguration,
  lockLeague,
  reconcileSchedule,
  removePlayer,
  storeImage,
} from "../services/league-admin";

export interface SettingsState {
  ok?: boolean;
  error?: string;
  message?: string;
}
function digits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
function jalaliDate(value: string) {
  const parts = digits(value).split(/[\/-]/).map(Number);
  const [jy, jm, jd] = parts as [number, number, number];
  if (
    parts.length !== 3 ||
    !parts.every(Number.isInteger) ||
    jy < 1200 ||
    jy > 1600 ||
    !isValidJalaaliDate(jy, jm, jd)
  )
    throw new LeagueError("تاریخ شمسی معتبر وارد کنید؛ مانند ۱۴۰۵/۰۷/۲۵.");
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}
async function execute(
  work: (db: ReturnType<typeof getDb>, userId: number) => Promise<void>,
): Promise<SettingsState> {
  const { userId } = await requireAdminPage();
  try {
    await getDb().transaction((tx) => work(tx, userId));
    revalidatePath("/", "layout");
    return { ok: true, message: "تغییرات با موفقیت ذخیره شد." };
  } catch (error) {
    if (!(error instanceof z.ZodError) && !(error instanceof LeagueError)) {
      const failure = error as {
        name?: string;
        code?: string;
        cause?: { code?: string };
      };
      console.error("Settings save failed", {
        name: failure.name,
        code: failure.code,
        causeCode: failure.cause?.code,
      });
    }
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? error.issues[0]?.message
          : error instanceof LeagueError
            ? error.message
            : "ذخیره‌سازی انجام نشد؛ دوباره تلاش کنید.",
    };
  }
}

export async function savePlayerAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  return execute(async (db, userId) => {
    const tournament = await lockLeague(db);
    const name = z
      .string()
      .trim()
      .min(1, "نام بازیکن الزامی است.")
      .max(120)
      .parse(form.get("name"));
    const title = z
      .string()
      .trim()
      .max(160)
      .parse(form.get("title") ?? "");
    const accentColor = z
      .string()
      .regex(/^#[\da-fA-F]{6}$/, "رنگ معتبر انتخاب کنید.")
      .parse(form.get("accentColor"));
    const id = form.get("id")
      ? z.coerce.number().int().positive().parse(form.get("id"))
      : 0;
    const photoUrl = await storeImage(db, form.get("photo"), 400);
    let previous: s.Player | undefined, player: s.Player;
    if (id) {
      [previous] = await db
        .select()
        .from(s.players)
        .where(eq(s.players.id, id));
      if (!previous) throw new LeagueError("بازیکن یافت نشد.");
      const [updated] = await db
        .update(s.players)
        .set({
          name,
          title,
          accentColor,
          photoUrl: form.get("removePhoto") === "on" ? null : photoUrl,
          updatedAt: new Date(),
        })
        .where(eq(s.players.id, id))
        .returning();
      player = updated!;
    } else {
      const all = await db.select({ id: s.players.id }).from(s.players);
      if (all.length >= 32)
        throw new LeagueError("حداکثر ۳۲ بازیکن در یک لیگ پشتیبانی می‌شود.");
      // The original seed supplied explicit IDs. Advance its sequence without ever
      // reusing a deleted player's identity in audit records.
      await db.execute(
        sql`select setval(pg_get_serial_sequence('players','id'), greatest((select last_value from players_id_seq), coalesce((select max(id) from players),1)), true)`,
      );
      const [created] = await db
        .insert(s.players)
        .values({
          name,
          title,
          accentColor,
          photoUrl,
          slug: `player-${randomUUID().slice(0, 8)}`,
        })
        .returning();
      player = created!;
      await db
        .insert(s.tournamentPlayers)
        .values({ tournamentId: tournament.id, playerId: player.id });
      await reconcileSchedule(
        db,
        tournament.id,
        await currentConfiguration(db, tournament),
      );
      await db
        .update(s.tournaments)
        .set({
          status: "active",
          championPlayerId: null,
          updatedAt: new Date(),
        })
        .where(eq(s.tournaments.id, tournament.id));
    }
    await db.insert(s.auditLogs).values({
      userId,
      action: "player_updated",
      entityType: "player",
      entityId: player.id,
      previousValue: previous ?? null,
      newValue: player,
    });
    await bumpDataVersion(db);
  });
}
export async function deletePlayerAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  return execute(async (db, userId) => {
    if (form.get("confirm") !== "on")
      throw new LeagueError("حذف بازیکن و مسابقات وابسته را تأیید کنید.");
    const id = z.coerce.number().int().positive().parse(form.get("id"));
    await removePlayer(db, id, userId);
  });
}
export async function saveLeagueAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  return execute(async (db, userId) => {
    const tournament = await lockLeague(db);
    const matchTypes = z
      .array(z.string().trim().min(1, "نام هر مدل بازی را وارد کنید.").max(80))
      .min(1)
      .max(12)
      .parse(JSON.parse(String(form.get("matchTypes"))));
    const startTime = z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت معتبر وارد کنید.")
      .parse(form.get("startTime"));
    const config = {
      startDate: jalaliDate(String(form.get("startDate"))),
      startTime,
      nightIntervalDays: z.coerce
        .number()
        .int()
        .min(1)
        .max(30)
        .parse(form.get("nightIntervalDays")),
      slotMinutes: z.coerce
        .number()
        .int()
        .min(5)
        .max(120)
        .parse(form.get("slotMinutes")),
      matchTypes,
    };
    await reconcileSchedule(db, tournament.id, config);
    await db
      .update(s.tournaments)
      .set({
        startDate: config.startDate,
        nightIntervalDays: config.nightIntervalDays,
        updatedAt: new Date(),
      })
      .where(eq(s.tournaments.id, tournament.id));
    await db
      .insert(s.tournamentSettings)
      .values({
        tournamentId: tournament.id,
        matchTypes,
        matchesPerEncounter: matchTypes.length,
        startTime,
        slotMinutes: config.slotMinutes,
      })
      .onConflictDoUpdate({
        target: s.tournamentSettings.tournamentId,
        set: {
          matchTypes,
          matchesPerEncounter: matchTypes.length,
          startTime,
          slotMinutes: config.slotMinutes,
        },
      });
    await db.insert(s.auditLogs).values({
      userId,
      action: "tournament_updated",
      entityType: "tournament",
      entityId: tournament.id,
      newValue: config,
    });
    await bumpDataVersion(db);
  });
}
export async function rescheduleMatchAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  return execute(async (db, userId) => {
    await lockLeague(db);
    const id = z.coerce.number().int().positive().parse(form.get("id"));
    const day = jalaliDate(String(form.get("date")));
    const time = z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .parse(form.get("time"));
    const [match] = await db
      .select()
      .from(s.matches)
      .where(eq(s.matches.id, id));
    if (!match || match.status === "completed")
      throw new LeagueError("فقط زمان مسابقات برگزارنشده قابل تغییر است.");
    const scheduledAt = new Date(`${day}T${time}:00+03:30`);
    await db
      .update(s.matches)
      .set({ scheduledAt, updatedAt: new Date() })
      .where(eq(s.matches.id, id));
    await db.insert(s.auditLogs).values({
      userId,
      action: "tournament_updated",
      entityType: "match",
      entityId: id,
      previousValue: { scheduledAt: match.scheduledAt },
      newValue: { scheduledAt },
    });
    await bumpDataVersion(db);
  });
}
export async function saveBrandingAction(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  return execute(async (db, userId) => {
    await lockLeague(db);
    const previous = await getBranding(db);
    const next = {
      ...previous,
      name: z.string().trim().min(1).max(80).parse(form.get("name")),
      shortName: z.string().trim().min(1).max(24).parse(form.get("shortName")),
    };
    for (const [field, key, size] of [
      ["logo", "logoUrl", 512],
      ["favicon", "faviconUrl", 64],
      ["appIcon", "appIconUrl", 512],
    ] as const) {
      const image = await storeImage(db, form.get(field), size);
      if (image) next[key] = image;
      if (form.get(`remove-${field}`) === "on") next[key] = null;
    }
    await db
      .insert(s.meta)
      .values({ key: "branding", value: next })
      .onConflictDoUpdate({
        target: s.meta.key,
        set: { value: next, updatedAt: new Date() },
      });
    await db.insert(s.auditLogs).values({
      userId,
      action: "tournament_updated",
      entityType: "branding",
      previousValue: previous,
      newValue: next,
    });
    await bumpDataVersion(db);
  });
}
