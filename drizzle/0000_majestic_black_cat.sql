CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"videos_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "bot_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'engine' NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"auto_generate" boolean DEFAULT true NOT NULL,
	"auto_publish" boolean DEFAULT true NOT NULL,
	"daily_limit" integer DEFAULT 4 NOT NULL,
	"voice_style" text DEFAULT 'شاد و کودکانه' NOT NULL,
	"watermark" boolean DEFAULT true NOT NULL,
	"safe_mode" boolean DEFAULT true NOT NULL,
	"hashtags" text DEFAULT '#کودک #آموزش_کودکان #قصه_کودکانه' NOT NULL,
	"bot_token" text DEFAULT '' NOT NULL,
	"webhook_url" text DEFAULT '' NOT NULL,
	"chat_id" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'generating' NOT NULL,
	"stage" integer DEFAULT 1 NOT NULL,
	"duration_sec" integer DEFAULT 30 NOT NULL,
	"account_id" integer,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"hashtags" text DEFAULT '' NOT NULL,
	"thumbnail" text DEFAULT '' NOT NULL,
	"voice_style" text DEFAULT 'شاد و کودکانه' NOT NULL,
	"safe_checked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
