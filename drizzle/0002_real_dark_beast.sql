ALTER TABLE "accounts" ADD COLUMN "login_method" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "access_token" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refresh_token" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "avatar" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tiktok_client_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tiktok_client_secret" text DEFAULT '' NOT NULL;