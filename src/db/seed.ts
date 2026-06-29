import { db } from './index.ts';
import { tasks, systemSettings, users, profiles } from './schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function runDatabaseSeed() {
  try {
    console.log('[Seed] Checking admin user...');
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    if (existingAdmin.length === 0) {
      console.log('[Seed] Admin user not found. Seeding admin...');
      const passwordHash = bcrypt.hashSync('admin123', 10);
      const inserted = await db.insert(users).values({
        uid: 'admin_uid_seed',
        email: 'admin@velora.io',
        username: 'admin',
        passwordHash,
        role: 'admin',
        verified: true,
        referralCode: 'VEL_ADMIN',
        points: 1000,
      }).returning();
      
      const adminId = inserted[0].id;
      await db.insert(profiles).values({
        userId: adminId,
        bio: 'Velora System Administrator',
        fullName: 'Admin',
      });
      console.log('[Seed] Admin user seeded successfully.');
    } else {
      console.log('[Seed] Admin user already exists.');
    }

    console.log('[Seed] Checking system settings table...');
    const existingSettings = await db.select().from(systemSettings).limit(1);
    if (existingSettings.length === 0) {
      console.log('[Seed] Seeding default system settings...');
      await db.insert(systemSettings).values({
        appName: "Velora",
        telegramChannelLink: "https://t.me/VeloraAnnouncements",
        telegramGroupLink: "https://t.me/VeloraCommunity",
        telegramBotUsername: "VeloraBot",
        formspreeId: "xpzvlewr",
        launchDate: "2026-12-31",
        maintenanceMode: false,
        pointMultiplier: 1.0,
      });
      console.log('[Seed] Default system settings seeded successfully.');
    } else {
      console.log('[Seed] System settings already configured.');
    }

    console.log('[Seed] Checking tasks table...');
    const existingTasks = await db.select().from(tasks).where(eq(tasks.isDeleted, false));
    if (existingTasks.length === 0) {
      console.log('[Seed] Seeding default tasks...');
      const defaultTasks = [
        {
          title: "Daily Synergy Check-In",
          description: "Log in every 24 hours to claim your daily check-in streaks. Rewards multiply up to 7 consecutive days!",
          points: 50,
          type: "daily",
          link: "#checkin",
        },
        {
          title: "Verify & Join Velora Telegram Channel",
          description: "Join the official announcement channel to receive premium Web3 updates, airdrop details, and launch alerts.",
          points: 150,
          type: "telegram",
          link: "https://t.me/VeloraAnnouncements",
        },
        {
          title: "Join Velora Community Chat Group",
          description: "Meet, engage, and chat with fellow Waitlist pioneers in our interactive Telegram community.",
          points: 150,
          type: "telegram",
          link: "https://t.me/VeloraCommunity",
        },
        {
          title: "Follow @VeloraHQ on X/Twitter",
          description: "Keep up with real-time news, waitlist events, and core release news on Twitter.",
          points: 200,
          type: "twitter",
          link: "https://x.com/VeloraHQ",
        },
        {
          title: "Explore the Phase 2 Whitepaper Roadmap",
          description: "Read our newly launched technical design specifications and the token economics document on the website.",
          points: 100,
          type: "website",
          link: "https://velora.io/docs/roadmap",
        },
      ];

      for (const t of defaultTasks) {
        await db.insert(tasks).values(t);
      }
      console.log('[Seed] Default tasks seeded successfully.');
    } else {
      console.log('[Seed] Tasks already populated.');
    }
  } catch (error) {
    console.error('[Seed Error] Failed to run database seed:', error);
  }
}
