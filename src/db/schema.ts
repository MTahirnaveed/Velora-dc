import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  points: integer('points').default(0).notNull(),
  referralsCount: integer('referrals_count').default(0).notNull(),
  referredBy: text('referred_by'), // referrer username
  referralCode: text('referral_code').unique(),
  verified: boolean('verified').default(false).notNull(),
  verificationCode: text('verification_code'),
  dailyStreak: integer('daily_streak').default(0).notNull(),
  lastCheckIn: timestamp('last_check_in'),
  avatar: text('avatar').default('preset_1').notNull(),
  role: text('role').default('user').notNull(), // 'user' | 'admin'
  badges: jsonb('badges').default('[]').notNull(), // JSON array of badges
  telegramId: text('telegram_id'),
  telegramUsername: text('telegram_username'),
  joinedTelegramChannel: boolean('joined_telegram_channel').default(false).notNull(),
  joinedTelegramCommunity: boolean('joined_telegram_community').default(false).notNull(),
  failedLoginAttempts: integer('failed_login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  needsPasswordChange: boolean('needs_password_change').default(false).notNull(),
  twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorTempSecret: text('two_factor_temp_secret'),
  passwordHash: text('password_hash'),
  walletAddress: text('wallet_address'),
  walletType: text('wallet_type'), // 'metamask' | 'coinbase' | 'walletconnect' | 'phantom'
  kycStatus: text('kyc_status').default('not_started').notNull(), // 'not_started' | 'pending' | 'verified'
  emailMarketing: boolean('email_marketing').default(true).notNull(),
  emailAnnouncements: boolean('email_announcements').default(true).notNull(),
  emailReferrals: boolean('email_referrals').default(true).notNull(),
  soundEffects: boolean('sound_effects').default(true).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Profiles Table (1-to-1 with Users)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  bio: text('bio'),
  fullName: text('full_name'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Referrals Table
export const referrals = pgTable('referrals', {
  id: serial('id').primaryKey(),
  referrerId: integer('referrer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  refereeId: integer('referee_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  pointsAwarded: integer('points_awarded').default(0).notNull(),
  level: integer('level').default(1).notNull(), // 1, 2, or 3
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Referral Rewards Table
export const referralRewards = pgTable('referral_rewards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fromUsername: text('from_username').notNull(),
  level: integer('level').notNull(), // 1, 2, or 3
  points: integer('points').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 5. Tasks Table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  points: integer('points').default(0).notNull(),
  type: text('type').notNull(), // 'daily' | 'social' | 'telegram' | 'twitter' | 'website'
  link: text('link'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. User Tasks (Completed Tasks) Table
export const userTasks = pgTable('user_tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  taskId: integer('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  claimedAt: timestamp('claimed_at').defaultNow().notNull(),
});

// 7. Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info').notNull(), // 'info' | 'success' | 'alert' | 'announcement'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. System Settings Table
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  appName: text('app_name').default('Velora').notNull(),
  telegramChannelLink: text('telegram_channel_link').default('https://t.me/VeloraAnnouncements').notNull(),
  telegramGroupLink: text('telegram_group_link').default('https://t.me/VeloraCommunity').notNull(),
  telegramBotUsername: text('telegram_bot_username').default('VeloraBot').notNull(),
  formspreeId: text('formspree_id').default('xpzvlewr').notNull(),
  launchDate: text('launch_date').default('2026-12-31').notNull(),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  pointMultiplier: doublePrecision('point_multiplier').default(1.0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Achievements Table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeName: text('badge_name').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

// 10. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 11. Sessions Table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Password Reset Tokens Table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Email Verification Tokens Table
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Reward Claims Table
export const rewardClaims = pgTable('reward_claims', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amountVlr: integer('amount_vlr').notNull(),
  txnHash: text('txn_hash').notNull().unique(),
  status: text('status').default('pending').notNull(), // 'pending' | 'completed'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Relations Definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  referralsReceived: many(referrals, { relationName: 'referee' }),
  referralsMade: many(referrals, { relationName: 'referrer' }),
  rewards: many(referralRewards),
  userTasks: many(userTasks),
  notifications: many(notifications),
  achievements: many(achievements),
  auditLogs: many(auditLogs),
  sessions: many(sessions),
  claims: many(rewardClaims),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: 'referee',
  }),
}));

export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  user: one(users, {
    fields: [referralRewards.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  userTasks: many(userTasks),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [userTasks.taskId],
    references: [tasks.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const rewardClaimsRelations = relations(rewardClaims, ({ one }) => ({
  user: one(users, {
    fields: [rewardClaims.userId],
    references: [users.id],
  }),
}));
