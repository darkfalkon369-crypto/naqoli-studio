ALTER TABLE "accounts" ADD COLUMN "stats_source" text DEFAULT 'sim' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "stats_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "simulation_mode" boolean DEFAULT true NOT NULL;