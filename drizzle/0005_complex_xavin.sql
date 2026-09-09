ALTER TABLE "videos" ADD COLUMN "caption" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "render_status" text DEFAULT 'idle' NOT NULL;