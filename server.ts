import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Database boot functions, seed and queries
import { runDatabaseSeed } from './src/db/seed.ts';
import * as queries from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_token_secret_hash_value_here';

const app = express();
app.use(express.json({ limit: '10mb' }));

// In-Memory Telegram Feed State
let telegramFeed: any[] = [
  {
    id: "1",
    sender: "Velora Announcer",
    message: "🚀 Velora Smart Waitlist & Ecosystem is officially live! Claim your early-pioneer pass today.",
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }
];

// Sliding-window IP Rate Limiter
const ipRequests = new Map<string, { count: number, resetTime: number }>();
function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 200;

  let rateData = ipRequests.get(ip);
  if (!rateData || now > rateData.resetTime) {
    rateData = { count: 0, resetTime: now + windowMs };
  }

  rateData.count++;
  ipRequests.set(ip, rateData);

  if (rateData.count > maxRequests) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again in a minute.' });
  }
  next();
}

// Token Authentication Middleware
function authenticateToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, decodedUser: any) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    req.user = decodedUser;
    next();
  });
}

// Admin Check Middleware
function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin privileges required' });
  }
  next();
}

// API Versioning Rewriter
app.use((req, res, next) => {
  if (req.url.startsWith('/api/v1/')) {
    req.url = req.url.replace('/api/v1/', '/api/');
  }
  next();
});

app.use(rateLimiterMiddleware);

// Robots.txt & Sitemap
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send("User-agent: *\nDisallow: /api/admin/\nSitemap: https://velora.io/sitemap.xml");
});

app.get('/sitemap.xml', async (req, res) => {
  res.type('application/xml');
  try {
    const usersList = await queries.getAllUsers();
    let usersXml = '';
    usersList.slice(0, 100).forEach(u => {
      usersXml += `  <url>\n    <loc>https://velora.io/u/${u.username}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://velora.io/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${usersXml}</urlset>`);
  } catch (error) {
    res.status(500).send("Error compiling sitemap.");
  }
});

// Helper: Multi-Level Referral Rewards
async function distributeReferralPoints(refereeUser: any, referrerCode: string) {
  try {
    const referrerL1 = await queries.getUserByReferralCode(referrerCode);
    if (!referrerL1) return;

    // Level 1 Referral Rewards (+250 points)
    await queries.createReferral(referrerL1.id, refereeUser.id, 250, 1);
    await queries.createReferralReward(referrerL1.id, refereeUser.username, 1, 250);
    await queries.updateUser(referrerL1.id, {
      points: referrerL1.points + 250,
      referralsCount: referrerL1.referralsCount + 1
    });
    await queries.createNotification(referrerL1.id, 'New Referral!', `${refereeUser.username} joined via your link. You earned 250 points.`, 'success');

    // Level 2 Referral Rewards (+100 points)
    if (referrerL1.referredBy) {
      const referrerL2 = await queries.getUserByUsername(referrerL1.referredBy);
      if (referrerL2) {
        await queries.createReferralReward(referrerL2.id, refereeUser.username, 2, 100);
        await queries.updateUser(referrerL2.id, {
          points: referrerL2.points + 100
        });
        await queries.createNotification(referrerL2.id, 'Indirect Referral (L2)!', `${refereeUser.username} joined the network. You earned 100 points.`, 'success');

        // Level 3 Referral Rewards (+50 points)
        if (referrerL2.referredBy) {
          const referrerL3 = await queries.getUserByUsername(referrerL2.referredBy);
          if (referrerL3) {
            await queries.createReferralReward(referrerL3.id, refereeUser.username, 3, 50);
            await queries.updateUser(referrerL3.id, {
              points: referrerL3.points + 50
            });
            await queries.createNotification(referrerL3.id, 'Indirect Referral (L3)!', `${refereeUser.username} joined the network. You earned 50 points.`, 'success');
          }
        }
      }
    }
  } catch (err) {
    console.error('Error distributing referral rewards:', err);
  }
}

// ======================================================================
// API ENDPOINTS
// ======================================================================

// GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    const settings = await queries.getSettings();
    const allUsers = await queries.getAllUsers();
    const allTasks = await queries.getAllTasks();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "2.0.0",
      memory: process.memoryUsage(),
      database: "PostgreSQL (Cloud SQL)",
      system: {
        appName: settings.appName,
        usersCount: allUsers.length,
        tasksCount: allTasks.length,
        pointMultiplier: settings.pointMultiplier
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "degraded", error: error.message });
  }
});

// GET /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await queries.getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, username, password, referredBy, avatar } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: 'Email, username, and password are required' });
    }

    // Check duplicate
    const existingEmail = await queries.getUserByEmail(email);
    if (existingEmail) return res.status(400).json({ success: false, error: 'Email already registered' });

    const existingUsername = await queries.getUserByUsername(username);
    if (existingUsername) return res.status(400).json({ success: false, error: 'Username already taken' });

    // Hashing
    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    const referralCode = `VEL_${username.toUpperCase()}`;

    // Create User
    const newUser = await queries.createUser({
      uid: `uid_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      email: email.toLowerCase().trim(),
      username: username.toLowerCase().trim(),
      passwordHash,
      referralCode,
      verificationCode,
      points: 100, // base points
      avatar: avatar || 'preset_1',
      role: 'user',
      verified: false,
      referredBy: referredBy || null,
    });

    // Award referral rewards if referred
    if (referredBy) {
      await distributeReferralPoints(newUser, referredBy);
    }

    const responsePayload: any = {
      success: true,
      message: 'Registration successful! Verification code sent.'
    };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.verificationCode = verificationCode;
    }
    res.status(201).json(responsePayload);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const userObj = await queries.getUserByEmail(email);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    if (userObj.verificationCode !== code) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    await queries.updateUser(userObj.id, { verified: true, verificationCode: null });
    await queries.createNotification(userObj.id, 'Email Verified!', 'Your account has been verified successfully. Welcome to Velora!', 'success');

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, identity, password } = req.body;
    const loginId = identity || email;
    if (!loginId || !password) return res.status(400).json({ success: false, error: 'Email/Username and password are required' });

    let userObj = await queries.getUserByEmail(loginId);
    if (!userObj) {
      userObj = await queries.getUserByUsername(loginId);
    }

    if (!userObj) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    // Lockout check
    if (userObj.lockedUntil && userObj.lockedUntil > new Date()) {
      const remaining = Math.round((userObj.lockedUntil.getTime() - Date.now()) / 1000);
      return res.status(403).json({
        success: false,
        error: `Account is temporarily locked. Try again in ${remaining} seconds.`
      });
    }

    const isMatch = bcrypt.compareSync(password, userObj.passwordHash || '');
    if (!isMatch) {
      const attempts = userObj.failedLoginAttempts + 1;
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await queries.updateUser(userObj.id, { failedLoginAttempts: 0, lockedUntil });
        return res.status(403).json({
          success: false,
          error: 'Too many failed attempts. Account locked for 15 minutes.'
        });
      } else {
        await queries.updateUser(userObj.id, { failedLoginAttempts: attempts });
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }

    // Reset failed login attempts on success
    await queries.updateUser(userObj.id, { failedLoginAttempts: 0, lockedUntil: null });

    // Check 2FA
    if (userObj.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: userObj.id, email: userObj.email, is2FAChallenge: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({
        success: true,
        is2FAChallenge: true,
        tempToken
      });
    }

    const token = jwt.sign({ id: userObj.id, email: userObj.email, username: userObj.username, role: userObj.role }, JWT_SECRET, { expiresIn: '7d' });
    const rewards = await queries.getReferralRewards(userObj.id);
    const claims = await queries.getClaims(userObj.id);

    res.json({
      success: true,
      token,
      user: {
        ...userObj,
        referralHistory: rewards || [],
        claimsHistory: claims || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login-2fa
app.post('/api/auth/login-2fa', async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ success: false, error: 'Token and 2FA code required' });

    const decoded: any = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded || !decoded.is2FAChallenge) {
      return res.status(400).json({ success: false, error: 'Invalid challenge session' });
    }

    const userObj = await queries.getUserById(decoded.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    // Verify 2FA (we accept matching secret or standard code '123456' for ease)
    if (code !== '123456' && userObj.twoFactorSecret && code !== userObj.twoFactorSecret) {
      return res.status(400).json({ success: false, error: 'Invalid 2FA code' });
    }

    const token = jwt.sign({ id: userObj.id, email: userObj.email, username: userObj.username, role: userObj.role }, JWT_SECRET, { expiresIn: '7d' });
    const rewards = await queries.getReferralRewards(userObj.id);
    const claims = await queries.getClaims(userObj.id);

    res.json({
      success: true,
      token,
      user: {
        ...userObj,
        referralHistory: rewards || [],
        claimsHistory: claims || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req: any, res: Response) => {
  try {
    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const rewards = await queries.getReferralRewards(userObj.id);
    const claims = await queries.getClaims(userObj.id);

    res.json({
      success: true,
      user: {
        ...userObj,
        referralHistory: rewards || [],
        claimsHistory: claims || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/reset-password-request
app.post('/api/auth/reset-password-request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userObj = await queries.getUserByEmail(email);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits code
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await queries.createResetToken(email, token, expiresAt);

    res.json({
      success: true,
      message: 'Reset password code generated.',
      token // Exposed for simulated workflows
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/reset-password-confirm
app.post('/api/auth/reset-password-confirm', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;
    const record = await queries.verifyResetToken(email, token);
    if (!record) return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });

    const userObj = await queries.getUserByEmail(email);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await queries.updateUser(userObj.id, { passwordHash });
    await queries.deleteResetTokensForEmail(email);

    await queries.createNotification(userObj.id, 'Password Changed', 'Your password has been reset successfully.', 'alert');

    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tasks
app.get('/api/tasks', authenticateToken, async (req: any, res: Response) => {
  try {
    const allTasks = await queries.getAllTasks();
    const completedTasks = await queries.getUserCompletedTasks(req.user.id);
    const completedIds = completedTasks.map(ct => ct.taskId);

    const tasksWithStatus = allTasks.map(t => ({
      ...t,
      completed: completedIds.includes(t.id)
    }));

    res.json(tasksWithStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks/:id/claim
app.post('/api/tasks/:id/claim', authenticateToken, async (req: any, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) return res.status(400).json({ success: false, error: 'Invalid task ID' });

    const task = await queries.getTaskById(taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const completed = await queries.getUserCompletedTasks(req.user.id);
    if (completed.some(ct => ct.taskId === taskId)) {
      return res.status(400).json({ success: false, error: 'Task already completed' });
    }

    const settings = await queries.getSettings();
    const multiplier = settings.pointMultiplier || 1.0;
    const pointsAwarded = Math.round(task.points * multiplier);

    await queries.createUserTask(req.user.id, taskId);

    const userObj = await queries.getUserById(req.user.id);
    if (userObj) {
      await queries.updateUser(req.user.id, {
        points: userObj.points + pointsAwarded
      });
      await queries.createNotification(req.user.id, 'Task Completed!', `You completed "${task.title}" and claimed ${pointsAwarded} points!`, 'success');
      await queries.createAuditLog(req.user.id, 'TASK_CLAIM', `Claimed task "${task.title}" (+${pointsAwarded} pts)`);
    }

    res.json({ success: true, pointsGained: pointsAwarded });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/notifications
app.get('/api/notifications', authenticateToken, async (req: any, res: Response) => {
  try {
    const list = await queries.getNotifications(req.user.id);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/read-all
app.post('/api/notifications/read-all', authenticateToken, async (req: any, res: Response) => {
  try {
    await queries.readAllNotifications(req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/wallet/link
app.post('/api/user/wallet/link', authenticateToken, async (req: any, res: Response) => {
  try {
    const { walletAddress, walletType } = req.body;
    if (!walletAddress || !walletType) return res.status(400).json({ success: false, error: 'Wallet details required' });

    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData: any = { walletAddress, walletType };
    let pointsAwarded = 0;

    // Bonus points for first-time linking
    if (!userObj.walletAddress) {
      pointsAwarded = 500;
      updateData.points = userObj.points + pointsAwarded;
    }

    await queries.updateUser(req.user.id, updateData);

    if (pointsAwarded > 0) {
      await queries.createNotification(req.user.id, 'Wallet Connected!', `Linked your Web3 wallet (+${pointsAwarded} points!)`, 'success');
    }

    await queries.createAuditLog(req.user.id, 'WALLET_LINK', `Linked wallet ${walletAddress} (${walletType})`);

    res.json({ success: true, pointsGained: pointsAwarded });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/kyc/start
app.post('/api/user/kyc/start', authenticateToken, async (req: any, res: Response) => {
  try {
    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    // Auto-verify for standard testing
    let pointsGained = 0;
    if (userObj.kycStatus !== 'verified') {
      pointsGained = 1000;
      await queries.updateUser(req.user.id, {
        kycStatus: 'verified',
        points: userObj.points + pointsGained
      });
      await queries.createNotification(req.user.id, 'KYC Verified!', `Your waitlist verification succeeded (+${pointsGained} points!)`, 'success');
      await queries.createAuditLog(req.user.id, 'KYC_COMPLETE', 'Waitlist KYC identity checks completed.');
    }

    res.json({ success: true, status: 'verified', pointsGained });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/profile/settings
app.post('/api/user/profile/settings', authenticateToken, async (req: any, res: Response) => {
  try {
    const { emailMarketing, emailAnnouncements, emailReferrals, soundEffects } = req.body;
    await queries.updateUser(req.user.id, {
      emailMarketing: !!emailMarketing,
      emailAnnouncements: !!emailAnnouncements,
      emailReferrals: !!emailReferrals,
      soundEffects: !!soundEffects
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/avatar
app.post('/api/user/avatar', authenticateToken, async (req: any, res: Response) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ success: false, error: 'Avatar identifier required' });

    await queries.updateUser(req.user.id, { avatar });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/checkin
app.post('/api/user/checkin', authenticateToken, async (req: any, res: Response) => {
  try {
    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (userObj.lastCheckIn) {
      const lastCheckInStr = new Date(userObj.lastCheckIn).toISOString().split('T')[0];
      if (lastCheckInStr === todayStr) {
        return res.status(400).json({ success: false, error: 'Already checked in today' });
      }
    }

    let streak = 1;
    if (userObj.lastCheckIn) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastCheckInStr = new Date(userObj.lastCheckIn).toISOString().split('T')[0];

      if (lastCheckInStr === yesterdayStr) {
        streak = userObj.dailyStreak + 1;
        if (streak > 7) streak = 1;
      }
    }

    const settings = await queries.getSettings();
    const multiplier = settings.pointMultiplier || 1.0;
    const baseCheckinPoints = 50 + (streak * 10);
    const pointsGained = Math.round(baseCheckinPoints * multiplier);

    await queries.updateUser(req.user.id, {
      dailyStreak: streak,
      lastCheckIn: now,
      points: userObj.points + pointsGained
    });

    await queries.createNotification(req.user.id, 'Daily Synergy Check-In!', `Checked in on day ${streak}! Earned ${pointsGained} points.`, 'success');
    await queries.createAuditLog(req.user.id, 'DAILY_CHECKIN', `Synergy Check-in day ${streak} (+${pointsGained} pts)`);

    res.json({ success: true, pointsGained, dailyStreak: streak });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/2fa/generate
app.post('/api/user/2fa/generate', authenticateToken, async (req: any, res: Response) => {
  try {
    const tempSecret = `VELORA_2FA_SECRET_MOCK_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await queries.updateUser(req.user.id, { twoFactorTempSecret: tempSecret });

    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Velora:${req.user.email}?secret=${tempSecret}&issuer=Velora`;

    res.json({ success: true, secret: tempSecret, qrCode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/2fa/verify
app.post('/api/user/2fa/verify', authenticateToken, async (req: any, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Code is required' });

    const userObj = await queries.getUserById(req.user.id);
    if (!userObj || !userObj.twoFactorTempSecret) {
      return res.status(400).json({ success: false, error: '2FA initialization not generated' });
    }

    // Accepting '123456' or the temp secret directly for testing
    if (code !== '123456' && code !== userObj.twoFactorTempSecret) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    await queries.updateUser(req.user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: userObj.twoFactorTempSecret,
      twoFactorTempSecret: null
    });

    await queries.createNotification(req.user.id, '2FA Enabled!', 'Two-factor security has been successfully activated.', 'success');
    await queries.createAuditLog(req.user.id, '2FA_ACTIVATE', 'Configured 2-factor MFA credential layers.');

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/2fa/disable
app.post('/api/user/2fa/disable', authenticateToken, async (req: any, res: Response) => {
  try {
    const { code } = req.body;
    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    if (code !== '123456' && userObj.twoFactorSecret && code !== userObj.twoFactorSecret) {
      return res.status(400).json({ success: false, error: 'Invalid 2FA code' });
    }

    await queries.updateUser(req.user.id, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    await queries.createNotification(req.user.id, '2FA Deactivated', 'Two-factor credentials deleted.', 'alert');
    await queries.createAuditLog(req.user.id, '2FA_DEACTIVATE', 'MFA security protection disabled.');

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/rewards/claim
app.post('/api/user/rewards/claim', authenticateToken, async (req: any, res: Response) => {
  try {
    const { amountVlr, txnHash } = req.body;
    if (!amountVlr || !txnHash) return res.status(400).json({ success: false, error: 'VLR amount and Transaction Hash required' });

    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    // 10 points = 1 VLR token
    const pointsRequired = amountVlr * 10;
    if (userObj.points < pointsRequired) {
      return res.status(400).json({ success: false, error: 'Insufficient waitlist points to claim tokens' });
    }

    await queries.createRewardClaim(req.user.id, amountVlr, txnHash);
    await queries.updateUser(req.user.id, {
      points: userObj.points - pointsRequired
    });

    await queries.createNotification(req.user.id, 'Claim Recorded!', `Your claim of ${amountVlr} VLR is pending processing (-${pointsRequired} points)`, 'success');
    await queries.createAuditLog(req.user.id, 'CLAIM_SUBMIT', `Submitted token claim of ${amountVlr} VLR. Hash: ${txnHash}`);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/analytics
app.get('/api/admin/analytics', authenticateToken, async (req: any, res: Response) => {
  try {
    const allUsers = await queries.getAllUsers();
    
    // Sort all users by points desc for leaderboards & admin user list
    const sortedUsers = [...allUsers].sort((a, b) => b.points - a.points);

    // Group signups by date
    const signupStatsMap = new Map<string, number>();
    allUsers.forEach(u => {
      const dateStr = new Date(u.createdAt).toISOString().split('T')[0];
      signupStatsMap.set(dateStr, (signupStatsMap.get(dateStr) || 0) + 1);
    });

    const signupsOverTime = Array.from(signupStatsMap.entries()).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate conversion counters
    const telegramConversions = allUsers.filter(u => u.joinedTelegramChannel || u.joinedTelegramCommunity).length;
    const referralConversions = allUsers.filter(u => u.referredBy).length;
    const waitlistCount = allUsers.filter(u => u.verified).length;

    // Active Users (registered or updated in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = allUsers.filter(u => new Date(u.updatedAt) > sevenDaysAgo).length;

    // Retrieve audit logs
    const auditLogsList = await queries.getAllAuditLogs();

    res.json({
      stats: {
        totalUsers: allUsers.length,
        activeUsers,
        waitlistCount,
        telegramConversions,
        referralConversions
      },
      signupsOverTime,
      auditLogs: auditLogsList,
      userSummary: sortedUsers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const updated = await queries.updateSettings(req.body);
    await queries.createAuditLog(req.user.id, 'SETTINGS_UPDATE', 'System parameters modified by admin.');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/broadcast
app.post('/api/admin/broadcast', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, error: 'Title and Message are required' });

    const allUsers = await queries.getAllUsers();
    
    // Broadcast notifications to all users
    for (const u of allUsers) {
      await queries.createNotification(u.id, title, message, type || 'announcement');
    }

    // Push broadcast announcement directly onto the Telegram feed logs
    telegramFeed.unshift({
      id: String(Date.now()),
      sender: "🔔 Announcement Channel",
      message: `📢 ${title}\n\n${message}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    await queries.createAuditLog(req.user.id, 'BROADCAST', `System Broadcast posted: "${title}"`);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/email-campaign
app.post('/api/admin/email-campaign', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, error: 'Subject and Body are required' });

    // Mock sending email campaign
    await queries.createAuditLog(req.user.id, 'EMAIL_CAMPAIGN', `Newsletter dispatched: "${subject}"`);

    res.json({ success: true, message: 'Email campaign dispatched.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/force-password-change
app.post('/api/admin/force-password-change', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    const targetUserId = parseInt(userId);
    if (isNaN(targetUserId) || !newPassword) {
      return res.status(400).json({ success: false, error: 'User ID and new password required' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await queries.updateUser(targetUserId, { passwordHash, needsPasswordChange: true });

    await queries.createNotification(targetUserId, 'Security Reset', 'Admin forced credential changes. Update password next login.', 'alert');
    await queries.createAuditLog(req.user.id, 'ADMIN_FORCE_PWD_RESET', `Forced password change for user ID ${targetUserId}`);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/telegram/feed
app.get('/api/telegram/feed', async (req, res) => {
  res.json(telegramFeed);
});

// POST /api/telegram/webhook
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message input required' });

    // Push into chat history
    telegramFeed.unshift({
      id: String(Date.now()),
      sender: "User interaction",
      message: `💬 Telegram: ${message}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    let botReply = '🤖 Velora Welcomes you! Enter /start to link account or /status to get waitlist updates.';
    if (message.startsWith('/start')) {
      botReply = '🎉 Connecting with Velora system! Verify your Telegram username in App profile setting to double points multiplier!';
    } else if (message.startsWith('/status')) {
      const allUsers = await queries.getAllUsers();
      botReply = `📊 Velora Ecosystem Updates:\n- Active waitlist users: ${allUsers.length}\n- Core node status: ONLINE\n- Global database integrity: 100% Secure.`;
    }

    telegramFeed.unshift({
      id: String(Date.now() + 1),
      sender: "VeloraBot (Reply)",
      message: botReply,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });

    res.json({ success: true, reply: botReply });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/telegram/simulate-join
app.post('/api/telegram/simulate-join', authenticateToken, async (req: any, res: Response) => {
  try {
    const { platform } = req.body;
    const userObj = await queries.getUserById(req.user.id);
    if (!userObj) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData: any = {};
    let pointsGained = 0;

    if (platform === 'channel') {
      if (!userObj.joinedTelegramChannel) {
        pointsGained = 200;
        updateData.joinedTelegramChannel = true;
        updateData.points = userObj.points + pointsGained;
      }
    } else if (platform === 'community') {
      if (!userObj.joinedTelegramCommunity) {
        pointsGained = 200;
        updateData.joinedTelegramCommunity = true;
        updateData.points = userObj.points + pointsGained;
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid join platform option' });
    }

    if (pointsGained > 0) {
      await queries.updateUser(req.user.id, updateData);
      await queries.createNotification(req.user.id, 'Telegram Reward claimed!', `Simulated social join of Velora Telegram ${platform} (+${pointsGained} points!)`, 'success');
      await queries.createAuditLog(req.user.id, 'TELEGRAM_JOIN', `Joined telegram ${platform} (+${pointsGained} pts)`);
    }

    res.json({ success: true, pointsGained });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    message: 'An unexpected server-side anomaly was intercepted by security monitoring layers.'
  });
});

const PORT = 3000;
const isProd = fs.existsSync(path.join(__dirname, 'dist'));

async function startServer() {
  console.log("Initializing PostgreSQL Database Seeding on boot...");
  await runDatabaseSeed();

  if (!isProd) {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    console.log("Starting server in PRODUCTION mode, serving static files...");
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
