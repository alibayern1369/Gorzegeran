/**
 * اسکیمای پایگاه دادهٔ لیگ گرز گران — PostgreSQL / Drizzle ORM
 * Normalized schema with strict constraints.
 */
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ────────────────────────────── Enumها ──────────────────────────────

export const matchTypeEnum = pgEnum("match_type", [
  "custom_deck",
  "draft_type_1",
  "draft_type_2",
  "infinite_elixir",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "completed",
  "postponed",
  "cancelled",
]);

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "active",
  "completed",
]);

export const userRoleEnum = pgEnum("user_role", ["admin"]);

export const auditActionEnum = pgEnum("audit_action", [
  "result_recorded",
  "result_updated",
  "result_cleared",
  "match_status_changed",
  "player_updated",
  "tournament_updated",
  "login_success",
  "login_failed",
]);

// ────────────────────────────── جدول‌ها ──────────────────────────────

/** کاربران مدیر */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  role: userRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** تورنمنت‌ها / فصل‌ها */
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  subtitle: varchar("subtitle", { length: 160 }),
  season: integer("season").notNull().default(1),
  status: tournamentStatusEnum("status").notNull().default("active"),
  /** تاریخ شروع به وقت تهران (ISO روز) */
  startDate: varchar("start_date", { length: 10 }).notNull(),
  nightIntervalDays: integer("night_interval_days").notNull().default(2),
  championPlayerId: integer("champion_player_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** بازیکنان */
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  title: varchar("title", { length: 160 }),
  accentColor: varchar("accent_color", { length: 16 }).notNull().default("#2563EB"),
  avatarStyle: varchar("avatar_style", { length: 32 }).notNull().default("knight"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** حضور بازیکنان در تورنمنت */
export const tournamentPlayers = pgTable(
  "tournament_players",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tournament_players_unique").on(t.tournamentId, t.playerId),
    index("tournament_players_player_idx").on(t.playerId),
  ],
);

/**
 * رویارویی چهارمسابقه‌ای — هر جفت بازیکن دقیقاً یک رویارویی دارد
 * (۲ مسابقه در مرحلهٔ یک و ۲ مسابقه در مرحلهٔ دو)
 */
export const encounters = pgTable(
  "encounters",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    /** شب شروع رویارویی (مرحلهٔ یک) */
    nightIndex: integer("night_index").notNull(),
    /** بازیکن اول — همیشه شناسهٔ کوچک‌تر برای یکتایی جفت */
    playerAId: integer("player_a_id")
      .notNull()
      .references(() => players.id),
    playerBId: integer("player_b_id")
      .notNull()
      .references(() => players.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("encounters_pair_unique").on(
      t.tournamentId,
      t.playerAId,
      t.playerBId,
    ),
    index("encounters_tournament_idx").on(t.tournamentId),
    check(
      "encounters_players_distinct",
      sql`${t.playerAId} <> ${t.playerBId}`,
    ),
    check("encounters_players_ordered", sql`${t.playerAId} < ${t.playerBId}`),
  ],
);

/** مسابقات انفرادی */
export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    encounterId: integer("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    matchType: matchTypeEnum("match_type").notNull(),
    playerAId: integer("player_a_id")
      .notNull()
      .references(() => players.id),
    playerBId: integer("player_b_id")
      .notNull()
      .references(() => players.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    nightIndex: integer("night_index").notNull(),
    slotIndex: integer("slot_index").notNull(),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    towersA: integer("towers_a"),
    towersB: integer("towers_b"),
    winnerId: integer("winner_id").references(() => players.id),
    resultRecordedAt: timestamp("result_recorded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("matches_encounter_type_unique").on(t.encounterId, t.matchType),
    uniqueIndex("matches_night_slot_unique").on(t.tournamentId, t.nightIndex, t.slotIndex),
    index("matches_tournament_idx").on(t.tournamentId),
    index("matches_status_idx").on(t.status),
    index("matches_scheduled_idx").on(t.scheduledAt),
    index("matches_player_a_idx").on(t.playerAId),
    index("matches_player_b_idx").on(t.playerBId),
    check("matches_players_distinct", sql`${t.playerAId} <> ${t.playerBId}`),
    check(
      "matches_towers_a_range",
      sql`${t.towersA} IS NULL OR (${t.towersA} >= 0 AND ${t.towersA} <= 3)`,
    ),
    check(
      "matches_towers_b_range",
      sql`${t.towersB} IS NULL OR (${t.towersB} >= 0 AND ${t.towersB} <= 3)`,
    ),
    check(
      "matches_completed_has_result",
      sql`(${t.status} = 'completed') = (${t.towersA} IS NOT NULL AND ${t.towersB} IS NOT NULL AND ${t.winnerId} IS NOT NULL)`,
    ),
    check(
      "matches_winner_is_participant",
      sql`${t.winnerId} IS NULL OR ${t.winnerId} = ${t.playerAId} OR ${t.winnerId} = ${t.playerBId}`,
    ),
    check(
      "matches_scores_differ",
      sql`${t.towersA} IS NULL OR ${t.towersB} IS NULL OR ${t.towersA} <> ${t.towersB}`,
    ),
    check(
      "matches_three_crown_valid",
      sql`${t.towersA} IS NULL OR ${t.towersB} IS NULL OR NOT ((${t.towersA} = 3 AND ${t.towersB} > 0) OR (${t.towersB} = 3 AND ${t.towersA} > 0))`,
    ),
  ],
);

/** رکورد ثبت نتیجه (آخرین ارسال معتبر) */
export const matchResults = pgTable(
  "match_results",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .unique()
      .references(() => matches.id, { onDelete: "cascade" }),
    towersA: integer("towers_a").notNull(),
    towersB: integer("towers_b").notNull(),
    winnerId: integer("winner_id")
      .notNull()
      .references(() => players.id),
    recordedBy: integer("recorded_by").references(() => users.id),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("match_results_winner_idx").on(t.winnerId),
    check(
      "match_results_towers_a_range",
      sql`${t.towersA} >= 0 AND ${t.towersA} <= 3`,
    ),
    check(
      "match_results_towers_b_range",
      sql`${t.towersB} >= 0 AND ${t.towersB} <= 3`,
    ),
    check("match_results_scores_differ", sql`${t.towersA} <> ${t.towersB}`),
  ],
);

/** گزارش تغییرات مدیر */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: integer("entity_id"),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

/** تنظیمات لیگ */
export const tournamentSettings = pgTable("tournament_settings", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .unique()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  winPoints: integer("win_points").notNull().default(2),
  lossPoints: integer("loss_points").notNull().default(0),
  matchesPerEncounter: integer("matches_per_encounter").notNull().default(4),
  maxTowersPerMatch: integer("max_towers_per_match").notNull().default(3),
  allowDraws: boolean("allow_draws").notNull().default(false),
});

/** مسابقات تکلیفی (تعیین رتبه در صورت تساوی کامل) */
export const tiebreakMatches = pgTable(
  "tiebreak_matches",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    playerAId: integer("player_a_id")
      .notNull()
      .references(() => players.id),
    playerBId: integer("player_b_id")
      .notNull()
      .references(() => players.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    towersA: integer("towers_a"),
    towersB: integer("towers_b"),
    winnerId: integer("winner_id").references(() => players.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tiebreak_tournament_idx").on(t.tournamentId),
    check("tiebreak_players_distinct", sql`${t.playerAId} <> ${t.playerBId}`),
    check(
      "tiebreak_towers_a_range",
      sql`${t.towersA} IS NULL OR (${t.towersA} >= 0 AND ${t.towersA} <= 3)`,
    ),
    check(
      "tiebreak_towers_b_range",
      sql`${t.towersB} IS NULL OR (${t.towersB} >= 0 AND ${t.towersB} <= 3)`,
    ),
    check(
      "tiebreak_scores_differ",
      sql`${t.towersA} IS NULL OR ${t.towersB} IS NULL OR ${t.towersA} <> ${t.towersB}`,
    ),
  ],
);

/** متادیتای سیستم (نسخهٔ داده برای به‌روزرسانی بلادرنگ) */
export const meta = pgTable("meta", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ────────────────────────────── انواع ──────────────────────────────

export type User = typeof users.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type Player = typeof players.$inferSelect;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type Encounter = typeof encounters.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchResult = typeof matchResults.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type TournamentSettings = typeof tournamentSettings.$inferSelect;
export type TiebreakMatch = typeof tiebreakMatches.$inferSelect;
