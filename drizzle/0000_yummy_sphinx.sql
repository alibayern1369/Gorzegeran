CREATE TYPE "public"."audit_action" AS ENUM('result_recorded', 'result_updated', 'result_cleared', 'match_status_changed', 'player_updated', 'tournament_updated', 'login_success', 'login_failed');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'completed', 'postponed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('custom_deck', 'draft_type_1', 'draft_type_2', 'infinite_elixir');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" integer,
	"previous_value" jsonb,
	"new_value" jsonb,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"night_index" integer NOT NULL,
	"player_a_id" integer NOT NULL,
	"player_b_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "encounters_players_distinct" CHECK ("encounters"."player_a_id" <> "encounters"."player_b_id"),
	CONSTRAINT "encounters_players_ordered" CHECK ("encounters"."player_a_id" < "encounters"."player_b_id")
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"towers_a" integer NOT NULL,
	"towers_b" integer NOT NULL,
	"winner_id" integer NOT NULL,
	"recorded_by" integer,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_results_match_id_unique" UNIQUE("match_id"),
	CONSTRAINT "match_results_towers_a_range" CHECK ("match_results"."towers_a" >= 0 AND "match_results"."towers_a" <= 3),
	CONSTRAINT "match_results_towers_b_range" CHECK ("match_results"."towers_b" >= 0 AND "match_results"."towers_b" <= 3),
	CONSTRAINT "match_results_scores_differ" CHECK ("match_results"."towers_a" <> "match_results"."towers_b")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"encounter_id" integer NOT NULL,
	"match_type" "match_type" NOT NULL,
	"player_a_id" integer NOT NULL,
	"player_b_id" integer NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"night_index" integer NOT NULL,
	"slot_index" integer NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"towers_a" integer,
	"towers_b" integer,
	"winner_id" integer,
	"result_recorded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_players_distinct" CHECK ("matches"."player_a_id" <> "matches"."player_b_id"),
	CONSTRAINT "matches_towers_a_range" CHECK ("matches"."towers_a" IS NULL OR ("matches"."towers_a" >= 0 AND "matches"."towers_a" <= 3)),
	CONSTRAINT "matches_towers_b_range" CHECK ("matches"."towers_b" IS NULL OR ("matches"."towers_b" >= 0 AND "matches"."towers_b" <= 3)),
	CONSTRAINT "matches_completed_has_result" CHECK (("matches"."status" = 'completed') = ("matches"."towers_a" IS NOT NULL AND "matches"."towers_b" IS NOT NULL AND "matches"."winner_id" IS NOT NULL)),
	CONSTRAINT "matches_winner_is_participant" CHECK ("matches"."winner_id" IS NULL OR "matches"."winner_id" = "matches"."player_a_id" OR "matches"."winner_id" = "matches"."player_b_id"),
	CONSTRAINT "matches_scores_differ" CHECK ("matches"."towers_a" IS NULL OR "matches"."towers_b" IS NULL OR "matches"."towers_a" <> "matches"."towers_b"),
	CONSTRAINT "matches_three_crown_valid" CHECK ("matches"."towers_a" IS NULL OR "matches"."towers_b" IS NULL OR NOT (("matches"."towers_a" = 3 AND "matches"."towers_b" > 0) OR ("matches"."towers_b" = 3 AND "matches"."towers_a" > 0)))
);
--> statement-breakpoint
CREATE TABLE "meta" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"title" varchar(160),
	"accent_color" varchar(16) DEFAULT '#2563EB' NOT NULL,
	"avatar_style" varchar(32) DEFAULT 'knight' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tiebreak_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_a_id" integer NOT NULL,
	"player_b_id" integer NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"towers_a" integer,
	"towers_b" integer,
	"winner_id" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tiebreak_players_distinct" CHECK ("tiebreak_matches"."player_a_id" <> "tiebreak_matches"."player_b_id"),
	CONSTRAINT "tiebreak_towers_a_range" CHECK ("tiebreak_matches"."towers_a" IS NULL OR ("tiebreak_matches"."towers_a" >= 0 AND "tiebreak_matches"."towers_a" <= 3)),
	CONSTRAINT "tiebreak_towers_b_range" CHECK ("tiebreak_matches"."towers_b" IS NULL OR ("tiebreak_matches"."towers_b" >= 0 AND "tiebreak_matches"."towers_b" <= 3)),
	CONSTRAINT "tiebreak_scores_differ" CHECK ("tiebreak_matches"."towers_a" IS NULL OR "tiebreak_matches"."towers_b" IS NULL OR "tiebreak_matches"."towers_a" <> "tiebreak_matches"."towers_b")
);
--> statement-breakpoint
CREATE TABLE "tournament_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"win_points" integer DEFAULT 2 NOT NULL,
	"loss_points" integer DEFAULT 0 NOT NULL,
	"matches_per_encounter" integer DEFAULT 4 NOT NULL,
	"max_towers_per_match" integer DEFAULT 3 NOT NULL,
	"allow_draws" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tournament_settings_tournament_id_unique" UNIQUE("tournament_id")
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"subtitle" varchar(160),
	"season" integer DEFAULT 1 NOT NULL,
	"status" "tournament_status" DEFAULT 'active' NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"night_interval_days" integer DEFAULT 2 NOT NULL,
	"champion_player_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiebreak_matches" ADD CONSTRAINT "tiebreak_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiebreak_matches" ADD CONSTRAINT "tiebreak_matches_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiebreak_matches" ADD CONSTRAINT "tiebreak_matches_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tiebreak_matches" ADD CONSTRAINT "tiebreak_matches_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_settings" ADD CONSTRAINT "tournament_settings_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "encounters_pair_unique" ON "encounters" USING btree ("tournament_id","player_a_id","player_b_id");--> statement-breakpoint
CREATE INDEX "encounters_tournament_idx" ON "encounters" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "match_results_winner_idx" ON "match_results" USING btree ("winner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_encounter_type_unique" ON "matches" USING btree ("encounter_id","match_type");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_night_slot_unique" ON "matches" USING btree ("tournament_id","night_index","slot_index");--> statement-breakpoint
CREATE INDEX "matches_tournament_idx" ON "matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_scheduled_idx" ON "matches" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "matches_player_a_idx" ON "matches" USING btree ("player_a_id");--> statement-breakpoint
CREATE INDEX "matches_player_b_idx" ON "matches" USING btree ("player_b_id");--> statement-breakpoint
CREATE INDEX "tiebreak_tournament_idx" ON "tiebreak_matches" USING btree ("tournament_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_players_unique" ON "tournament_players" USING btree ("tournament_id","player_id");--> statement-breakpoint
CREATE INDEX "tournament_players_player_idx" ON "tournament_players" USING btree ("player_id");