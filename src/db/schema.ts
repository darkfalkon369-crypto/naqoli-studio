import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type VideoStatus =
  | "generating"
  | "queued"
  | "scheduled"
  | "published"
  | "failed";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("generating"),
  stage: integer("stage").notNull().default(1),
  durationSec: integer("duration_sec").notNull().default(30),
  accountId: integer("account_id"),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  hashtags: text("hashtags").notNull().default(""),
  thumbnail: text("thumbnail").notNull().default(""),
  voiceStyle: text("voice_style").notNull().default("شاد و کودکانه"),
  safeChecked: boolean("safe_checked").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  followers: integer("followers").notNull().default(0),
  videosCount: integer("videos_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

export const botLogs = pgTable("bot_logs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().default("engine"),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  autoGenerate: boolean("auto_generate").notNull().default(true),
  autoPublish: boolean("auto_publish").notNull().default(true),
  dailyLimit: integer("daily_limit").notNull().default(4),
  voiceStyle: text("voice_style").notNull().default("شاد و کودکانه"),
  watermark: boolean("watermark").notNull().default(true),
  safeMode: boolean("safe_mode").notNull().default(true),
  hashtags: text("hashtags").notNull().default("#کودک #آموزش_کودکان #قصه_کودکانه"),
  botToken: text("bot_token").notNull().default(""),
  webhookUrl: text("webhook_url").notNull().default(""),
  chatId: text("chat_id").notNull().default(""),
  adminPasswordHash: text("admin_password_hash").notNull().default(""),
  onboardingDone: boolean("onboarding_done").notNull().default(false),
});
