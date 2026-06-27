import { db } from './index.ts';
import { 
  users, 
  profiles, 
  referrals, 
  referralRewards, 
  tasks, 
  userTasks, 
  notifications, 
  systemSettings, 
  achievements, 
  auditLogs, 
  sessions, 
  passwordResetTokens, 
  emailVerificationTokens, 
  rewardClaims 
} from './schema.ts';
import { eq, and, desc, sql, or } from 'drizzle-orm';

// Two-Layer Error Handling Wrapper
async function runQuery<T>(name: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[Database Error] ${name} failed:`, error);
    throw new Error(`Database operation failed: ${name}. Please try again later.`, { cause: error });
  }
}

// === USERS REPOSITORY ===

export async function getAllUsers() {
  return runQuery('getAllUsers', async () => {
    return db.select().from(users).where(eq(users.isDeleted, false));
  });
}

export async function getUserById(id: number) {
  return runQuery('getUserById', async () => {
    const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function getUserByUid(uid: string) {
  return runQuery('getUserByUid', async () => {
    const result = await db.select().from(users).where(and(eq(users.uid, uid), eq(users.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function getUserByEmail(email: string) {
  return runQuery('getUserByEmail', async () => {
    const result = await db.select().from(users).where(and(eq(users.email, email.toLowerCase().trim()), eq(users.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function getUserByUsername(username: string) {
  return runQuery('getUserByUsername', async () => {
    const result = await db.select().from(users).where(and(eq(users.username, username.toLowerCase().trim()), eq(users.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function getUserByReferralCode(code: string) {
  return runQuery('getUserByReferralCode', async () => {
    const result = await db.select().from(users).where(and(eq(users.referralCode, code.toUpperCase().trim()), eq(users.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function createUser(data: typeof users.$inferInsert) {
  return runQuery('createUser', async () => {
    const result = await db.insert(users).values(data).returning();
    const newUser = result[0];
    
    // Create corresponding empty profile automatically
    await db.insert(profiles).values({
      userId: newUser.id,
      bio: '',
      fullName: '',
    });
    
    return newUser;
  });
}

export async function updateUser(id: number, data: Partial<typeof users.$inferSelect>) {
  return runQuery('updateUser', async () => {
    const result = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  });
}

// === TASKS REPOSITORY ===

export async function getAllTasks() {
  return runQuery('getAllTasks', async () => {
    return db.select().from(tasks).where(eq(tasks.isDeleted, false));
  });
}

export async function getTaskById(id: number) {
  return runQuery('getTaskById', async () => {
    const result = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.isDeleted, false))).limit(1);
    return result[0] || null;
  });
}

export async function createTask(data: typeof tasks.$inferInsert) {
  return runQuery('createTask', async () => {
    const result = await db.insert(tasks).values(data).returning();
    return result[0];
  });
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferSelect>) {
  return runQuery('updateTask', async () => {
    const result = await db.update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] || null;
  });
}

export async function deleteTask(id: number) {
  return runQuery('deleteTask', async () => {
    // Soft delete tasks
    const result = await db.update(tasks)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return result[0] || null;
  });
}

// === USER TASKS (COMPLETED TASKS) ===

export async function getUserCompletedTasks(userId: number) {
  return runQuery('getUserCompletedTasks', async () => {
    return db.select().from(userTasks).where(eq(userTasks.userId, userId));
  });
}

export async function createUserTask(userId: number, taskId: number) {
  return runQuery('createUserTask', async () => {
    const result = await db.insert(userTasks).values({
      userId,
      taskId,
    }).returning();
    return result[0];
  });
}

// === REFERRALS ===

export async function createReferral(referrerId: number, refereeId: number, pointsAwarded = 250, level = 1) {
  return runQuery('createReferral', async () => {
    const result = await db.insert(referrals).values({
      referrerId,
      refereeId,
      pointsAwarded,
      level,
    }).returning();
    return result[0];
  });
}

export async function createReferralReward(userId: number, fromUsername: string, level: number, points: number) {
  return runQuery('createReferralReward', async () => {
    const result = await db.insert(referralRewards).values({
      userId,
      fromUsername,
      level,
      points,
    }).returning();
    return result[0];
  });
}

export async function getReferralRewards(userId: number) {
  return runQuery('getReferralRewards', async () => {
    return db.select().from(referralRewards).where(eq(referralRewards.userId, userId)).orderBy(desc(referralRewards.timestamp));
  });
}

// === NOTIFICATIONS ===

export async function getNotifications(userId: number) {
  return runQuery('getNotifications', async () => {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  });
}

export async function createNotification(userId: number, title: string, message: string, type: string = 'info') {
  return runQuery('createNotification', async () => {
    const result = await db.insert(notifications).values({
      userId,
      title,
      message,
      type,
    }).returning();
    return result[0];
  });
}

export async function readAllNotifications(userId: number) {
  return runQuery('readAllNotifications', async () => {
    return db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId))
      .returning();
  });
}

export async function readNotification(id: number, userId: number) {
  return runQuery('readNotification', async () => {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return result[0] || null;
  });
}

// === SYSTEM SETTINGS ===

export async function getSettings() {
  return runQuery('getSettings', async () => {
    const result = await db.select().from(systemSettings).limit(1);
    if (result.length === 0) {
      // Return default values if setting row doesn't exist yet
      const defaultRow = await db.insert(systemSettings).values({}).returning();
      return defaultRow[0];
    }
    return result[0];
  });
}

export async function updateSettings(data: Partial<typeof systemSettings.$inferSelect>) {
  return runQuery('updateSettings', async () => {
    const settings = await getSettings();
    const result = await db.update(systemSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(systemSettings.id, settings.id))
      .returning();
    return result[0];
  });
}

// === AUDIT LOGS ===

export async function createAuditLog(userId: number | null, action: string, details: string) {
  return runQuery('createAuditLog', async () => {
    const result = await db.insert(auditLogs).values({
      userId,
      action,
      details,
    }).returning();
    return result[0];
  });
}

export async function getAllAuditLogs() {
  return runQuery('getAllAuditLogs', async () => {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
  });
}

// === CLAIMS ===

export async function createRewardClaim(userId: number, amountVlr: number, txnHash: string) {
  return runQuery('createRewardClaim', async () => {
    const result = await db.insert(rewardClaims).values({
      userId,
      amountVlr,
      txnHash,
      status: 'pending',
    }).returning();
    return result[0];
  });
}

export async function getClaims(userId: number) {
  return runQuery('getClaims', async () => {
    return db.select().from(rewardClaims).where(eq(rewardClaims.userId, userId)).orderBy(desc(rewardClaims.timestamp));
  });
}

// === OTHER REFRESH/RESET TOKENS ===

export async function createResetToken(email: string, token: string, expiresAt: Date) {
  return runQuery('createResetToken', async () => {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email.toLowerCase().trim()));
    const result = await db.insert(passwordResetTokens).values({
      email: email.toLowerCase().trim(),
      token,
      expiresAt,
    }).returning();
    return result[0];
  });
}

export async function verifyResetToken(email: string, token: string) {
  return runQuery('verifyResetToken', async () => {
    const result = await db.select().from(passwordResetTokens).where(and(
      eq(passwordResetTokens.email, email.toLowerCase().trim()),
      eq(passwordResetTokens.token, token)
    )).limit(1);
    
    if (result.length === 0) return null;
    const record = result[0];
    if (record.expiresAt < new Date()) return null;
    return record;
  });
}

export async function deleteResetTokensForEmail(email: string) {
  return runQuery('deleteResetTokensForEmail', async () => {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email.toLowerCase().trim()));
  });
}

export async function createVerificationCode(email: string, code: string, expiresAt: Date) {
  return runQuery('createVerificationCode', async () => {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.email, email.toLowerCase().trim()));
    const result = await db.insert(emailVerificationTokens).values({
      email: email.toLowerCase().trim(),
      code,
      expiresAt,
    }).returning();
    return result[0];
  });
}

export async function verifyVerificationCode(email: string, code: string) {
  return runQuery('verifyVerificationCode', async () => {
    const result = await db.select().from(emailVerificationTokens).where(and(
      eq(emailVerificationTokens.email, email.toLowerCase().trim()),
      eq(emailVerificationTokens.code, code)
    )).limit(1);
    
    if (result.length === 0) return null;
    const record = result[0];
    if (record.expiresAt < new Date()) return null;
    return record;
  });
}

export async function deleteVerificationCodesForEmail(email: string) {
  return runQuery('deleteVerificationCodesForEmail', async () => {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.email, email.toLowerCase().trim()));
  });
}
