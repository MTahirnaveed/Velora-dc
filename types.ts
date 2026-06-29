export interface ReferralReward {
  id: string;
  fromUsername: string;
  level: number; // 1, 2, or 3
  points: number;
  timestamp: string;
}

export interface ClaimRecord {
  id: string;
  amountVlr: number;
  txnHash: string;
  status: 'pending' | 'completed';
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  points: number;
  referralsCount: number;
  referredBy?: string; // referrer username
  referralCode: string;
  verified: boolean;
  verificationCode?: string;
  dailyStreak: number;
  lastCheckIn?: string; // ISO date
  avatar: string; // preset ID or base64
  role: 'user' | 'admin';
  badges: string[];
  telegramId?: string;
  telegramUsername?: string;
  joinedTelegramChannel: boolean;
  joinedTelegramCommunity: boolean;
  createdAt: string;
  // Phase 3 extensions
  walletAddress?: string;
  walletType?: 'metamask' | 'coinbase' | 'walletconnect' | 'phantom';
  kycStatus?: 'not_started' | 'pending' | 'verified';
  emailMarketing?: boolean;
  emailAnnouncements?: boolean;
  emailReferrals?: boolean;
  soundEffects?: boolean;
  referralHistory?: ReferralReward[];
  claimsHistory?: ClaimRecord[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'daily' | 'social' | 'telegram' | 'twitter' | 'website';
  link: string;
  createdAt: string;
}

export interface SystemSettings {
  appName: string;
  telegramChannelLink: string;
  telegramGroupLink: string;
  telegramBotUsername: string;
  formspreeId: string;
  launchDate: string;
  maintenanceMode: boolean;
  pointMultiplier: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'announcement';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SignupStat {
  date: string;
  count: number;
}

export interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  waitlistCount: number;
  telegramConversions: number;
  referralConversions: number;
  signupsOverTime: SignupStat[];
}
