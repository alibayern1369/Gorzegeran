/**
 * لایهٔ دسترسی به داده — بارگذاری تورنمنت و تغییر داده‌ها به انواع موتور
 * تمام آمارهای رسمی از رکورد مسابقات «تکمیل‌شده» بازمحاسبه می‌شوند.
 */
import { asc, desc, eq } from "drizzle-orm";
import { getDb, type AppDatabase } from "./db/client";
import * as s from "./db/schema";
import type {
  EngineMatch,
  EnginePlayer,
  MatchStatus,
  MatchType,
} from "./engine/types";
import { visualPlayer } from "./visual-players";
import type { PlayerSeed } from "./constants";

export async function getDataVersion(
  db: AppDatabase = getDb(),
): Promise<number> {
  const rows = await db
    .select()
    .from(s.meta)
    .where(eq(s.meta.key, "data_version"));
  const value = rows[0]?.value;
  if (value && typeof value === "object" && "v" in (value as object)) {
    return Number((value as { v: number }).v) || 0;
  }
  return 0;
}

export async function bumpDataVersion(db: AppDatabase): Promise<number> {
  const current = await getDataVersion(db);
  const next = current + 1;
  await db
    .insert(s.meta)
    .values({ key: "data_version", value: { v: next } })
    .onConflictDoUpdate({
      target: s.meta.key,
      set: { value: { v: next }, updatedAt: new Date() },
    });
  return next;
}

export async function getActiveTournament(
  db: AppDatabase = getDb(),
): Promise<s.Tournament> {
  const rows = await db.select().from(s.tournaments).limit(1);
  const t = rows[0];
  if (!t) throw new Error("تورنمنتی یافت نشد؛ ابتدا پایگاه داده را seed کنید.");
  return t;
}

export async function getAllPlayers(
  db: AppDatabase = getDb(),
): Promise<s.Player[]> {
  return db.select().from(s.players).orderBy(asc(s.players.id));
}

export function toEnginePlayers(players: s.Player[]): EnginePlayer[] {
  return players.map((p) => ({ id: p.id, slug: p.slug, name: p.name }));
}

export function toEngineMatch(m: s.Match): EngineMatch {
  return {
    id: m.id,
    encounterId: m.encounterId,
    matchType: m.matchType as MatchType,
    playerAId: m.playerAId,
    playerBId: m.playerBId,
    scheduledAt: m.scheduledAt.toISOString(),
    nightIndex: m.nightIndex,
    slotIndex: m.slotIndex,
    status: m.status as MatchStatus,
    towersA: m.towersA,
    towersB: m.towersB,
    winnerId: m.winnerId,
  };
}

export async function getAllMatches(
  db: AppDatabase = getDb(),
): Promise<s.Match[]> {
  return db
    .select()
    .from(s.matches)
    .orderBy(asc(s.matches.scheduledAt), asc(s.matches.id));
}

export async function getAllEncounters(
  db: AppDatabase = getDb(),
): Promise<s.Encounter[]> {
  return db
    .select()
    .from(s.encounters)
    .orderBy(asc(s.encounters.nightIndex), asc(s.encounters.id));
}

export async function getMatchById(
  id: number,
  db: AppDatabase = getDb(),
): Promise<s.Match | null> {
  const rows = await db
    .select()
    .from(s.matches)
    .where(eq(s.matches.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPlayerBySlug(
  slug: string,
  db: AppDatabase = getDb(),
): Promise<s.Player | null> {
  const rows = await db
    .select()
    .from(s.players)
    .where(eq(s.players.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getTiebreakMatches(
  db: AppDatabase = getDb(),
): Promise<s.TiebreakMatch[]> {
  return db.select().from(s.tiebreakMatches).orderBy(asc(s.tiebreakMatches.id));
}

export async function getRecentAuditLogs(
  limit = 50,
  db: AppDatabase = getDb(),
): Promise<s.AuditLog[]> {
  return db
    .select()
    .from(s.auditLogs)
    .orderBy(desc(s.auditLogs.createdAt), desc(s.auditLogs.id))
    .limit(limit);
}

export async function getSettings(
  tournamentId: number,
  db: AppDatabase = getDb(),
): Promise<s.TournamentSettings | null> {
  const rows = await db
    .select()
    .from(s.tournamentSettings)
    .where(eq(s.tournamentSettings.tournamentId, tournamentId))
    .limit(1);
  return rows[0] ?? null;
}

/** وضعیت کامل لیگ برای صفحات عمومی */
export interface LeagueData {
  visualPlayers: PlayerSeed[];
  playerById: Map<number, PlayerSeed>;
  settings: s.TournamentSettings | null;
  tournament: s.Tournament;
  players: s.Player[];
  enginePlayers: EnginePlayer[];
  matches: s.Match[];
  engineMatches: EngineMatch[];
  encounters: s.Encounter[];
  dataVersion: number;
}

export async function loadLeagueData(
  db: AppDatabase = getDb(),
): Promise<LeagueData> {
  const [tournament, players, matches, encounters, dataVersion] =
    await Promise.all([
      getActiveTournament(db),
      getAllPlayers(db),
      getAllMatches(db),
      getAllEncounters(db),
      getDataVersion(db),
    ]);
  const encounterSizes = new Map<number, number>();
  for (const m of matches)
    if (m.status !== "cancelled")
      encounterSizes.set(
        m.encounterId,
        (encounterSizes.get(m.encounterId) ?? 0) + 1,
      );
  return {
    visualPlayers: players.map(visualPlayer),
    playerById: new Map(players.map((p) => [p.id, visualPlayer(p)])),
    settings: await getSettings(tournament.id, db),
    tournament,
    players,
    enginePlayers: toEnginePlayers(players),
    matches: matches.filter((m) => m.tournamentId === tournament.id),
    engineMatches: matches
      .filter((m) => m.tournamentId === tournament.id)
      .map((m) => ({
        ...toEngineMatch(m),
        encounterSize: encounterSizes.get(m.encounterId) ?? 0,
      })),
    encounters: encounters.filter((e) => e.tournamentId === tournament.id),
    dataVersion,
  };
}
