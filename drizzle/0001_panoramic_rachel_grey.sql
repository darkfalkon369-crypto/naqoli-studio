ALTER TABLE "settings" ADD COLUMN "admin_password_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "onboarding_done" boolean DEFAULT false NOT NULL;