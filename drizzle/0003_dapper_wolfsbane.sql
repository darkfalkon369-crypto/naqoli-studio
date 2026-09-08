ALTER TABLE "accounts" ADD COLUMN "session_cookie" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "ayrshare_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "file_url" text DEFAULT '' NOT NULL;