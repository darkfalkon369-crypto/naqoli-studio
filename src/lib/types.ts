export type VideoStatus =
  | "generating"
  | "queued"
  | "scheduled"
  | "published"
  | "failed";

export interface Video {
  id: number;
  title: string;
  category: string;
  status: VideoStatus;
  stage: number;
  durationSec: number;
  accountId: number | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  hashtags: string;
  thumbnail: string;
  voiceStyle: string;
  createdAt: string;
}

export interface Account {
  id: number;
  username: string;
  displayName: string;
  followers: number;
  videosCount: number;
  status: string;
  connectedAt: string;
}

export interface BotLog {
  id: number;
  source: string;
  level: string;
  message: string;
  createdAt: string;
}

export interface BotSettings {
  id: number;
  autoGenerate: boolean;
  autoPublish: boolean;
  dailyLimit: number;
  voiceStyle: string;
  watermark: boolean;
  safeMode: boolean;
  hashtags: string;
  botToken: string;
  webhookUrl: string;
  chatId: string;
  adminPasswordHash: string;
  onboardingDone: boolean;
}

export interface Stats {
  views14d: number;
  viewsPrev14d: number;
  totalFollowers: number;
  publishedCount: number;
  readyCount: number;
  generatingCount: number;
  generatedToday: number;
  chart: { label: string; value: number }[];
  categories: { name: string; emoji: string; count: number; views: number }[];
  upcoming: Video[];
  top: Video[];
  accounts: Account[];
}
