CREATE TABLE "media_assets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "matches_encounter_type_unique";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "match_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "game_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "tournament_settings" ADD COLUMN "match_types" jsonb DEFAULT '["custom_deck","draft_type_1","draft_type_2","infinite_elixir"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_settings" ADD COLUMN "start_time" varchar(5) DEFAULT '00:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_settings" ADD COLUMN "slot_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
UPDATE "matches" SET "game_index" = CASE "match_type"
  WHEN 'custom_deck' THEN 0 WHEN 'draft_type_1' THEN 1
  WHEN 'draft_type_2' THEN 2 WHEN 'infinite_elixir' THEN 3 END;
--> statement-breakpoint
CREATE UNIQUE INDEX "matches_encounter_game_unique" ON "matches" USING btree ("encounter_id","game_index");
