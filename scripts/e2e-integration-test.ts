import dotenv from 'dotenv';
import { db } from '../src/db/index.ts';
import { users, profiles, referrals, referralRewards, tasks, userTasks, notifications, systemSettings, auditLogs } from '../src/db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

dotenv.config();

const API_BASE = "http://localhost:3000";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m"
};

function logHeader(text: string) {
  console.log(`\n${colors.magenta}${colors.bright}======================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright} 🚀 E2E SUITE: ${text.toUpperCase()}${colors.reset}`);
  console.log(`${colors.magenta}${colors.bright}======================================================================${colors.reset}`);
}

function logTest(name: string, status: 'PASS' | 'FAIL', details?: string) {
  if (status === 'PASS') {
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${name} ${details ? `(${details})` : ''}`);
  } else {
    console.log(`  ${colors.red}✗ FAIL:${colors.reset} ${colors.bright}${name}${colors.reset} ${details ? `-> ${colors.yellow}${details}${colors.reset}` : ''}`);
  }
}

async function runE2ETests() {
  console.log(`\n${colors.yellow}${colors.bright}✨ STARTING REAL-TIME VELORA END-TO-END REST API INTEGRATION SUITE ✨${colors.reset}`);
  
  let passed = 0;
  let failed = 0;
  
  const assertTest = (name: string, condition: boolean, details?: string) => {
    if (condition) {
      passed++;
      logTest(name, 'PASS', details);
    } else {
      failed++;
      logTest(name, 'FAIL', details);
      throw new Error(`Assert failed: ${name}`);
    }
  };

  const testUserIds: number[] = [];

  try {
    // ======================================================================
    // 1. API HEALTH & READ/WRITE DB VERIFICATION
    // ======================================================================
    logHeader("1. REST API & Database Integration Checks");
    
    // Verify API health check
    const healthRes = await fetch(`${API_BASE}/api/health`);
    assertTest("API Health Check /api/health returning 200", healthRes.status === 200);
    const healthData = await healthRes.json();
    assertTest("Health status reports 'healthy'", healthData.status === "healthy");

    // Verify settings read from PostgreSQL
    const settingsRes = await fetch(`${API_BASE}/api/settings`);
    assertTest("API Settings Read /api/settings returning 200", settingsRes.status === 200);
    const settingsData = await settingsRes.json();
    assertTest("Settings contains appName 'Velora'", settingsData.appName === "Velora");

    // ======================================================================
    // 3. USER REGISTRATION, EMAIL VERIFICATION, & LOGIN FLOWS
    // ======================================================================
    logHeader("3. Identity, Account Registration & Login");

    const email1 = `e2e_pioneer_${Date.now()}@velora.io`;
    const username1 = `pioneer_e2e_${Date.now()}`;
    const password1 = "PioneerSecure123!";

    // Register User 1
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, username: username1, password: password1 })
    });
    
    if (regRes.status !== 200 && regRes.status !== 201) {
      const errText = await regRes.text();
      console.log(`  DEBUG: Registration failed with status ${regRes.status}. Body: ${errText}`);
    }
    
    assertTest("POST /api/auth/register successfully creates new account", regRes.status === 200 || regRes.status === 201);
    const regData = await regRes.json();
    assertTest("Registration response contains verificationCode", !!regData.user?.verificationCode);
    
    const verificationCode1 = regData.user.verificationCode;
    const userId1 = Number(regData.user.id);
    testUserIds.push(userId1);

    let token1 = regData.token;
    let refreshToken1 = regData.refreshToken;

    // Email verification
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token1}`
      },
      body: JSON.stringify({ code: verificationCode1 })
    });
    assertTest("POST /api/auth/verify-email with correct authorization code verifies account", verifyRes.status === 200);
    const verifyData = await verifyRes.json();
    assertTest("Verification response includes pointsAdded of 150 waitlist points", verifyData.pointsAdded === 150);

    // Login
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: username1, password: password1 })
    });
    assertTest("POST /api/auth/login with valid identity & password authenticates session", loginRes.status === 200);
    const loginData = await loginRes.json();
    assertTest("Login response returns valid credentials", !!loginData.token && !!loginData.refreshToken);
    token1 = loginData.token;
    refreshToken1 = loginData.refreshToken;

    // Token refresh
    const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken1 })
    });
    assertTest("POST /api/auth/refresh yields a new access session token", refreshRes.status === 200);
    const refreshData = await refreshRes.json();
    assertTest("Refresh response contains token & refreshToken", !!refreshData.token && !!refreshData.refreshToken);
    token1 = refreshData.token;
    refreshToken1 = refreshData.refreshToken;

    // Logout
    const logoutRes = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    assertTest("POST /api/auth/logout terminates active session", logoutRes.status === 200);

    // ======================================================================
    // 4. SECURE PASSWORD RESET FLOW
    // ======================================================================
    logHeader("4. Passwords Reset Lifecycle");

    // Password reset request
    const resetReqRes = await fetch(`${API_BASE}/api/auth/reset-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1 })
    });
    assertTest("POST /api/auth/reset-password-request triggers reset sequence", resetReqRes.status === 200);
    const resetReqData = await resetReqRes.json();
    assertTest("Reset request response exposes temporary authorization reset token", !!resetReqData.code);
    const resetCode1 = resetReqData.code;

    // Confirm password reset
    const newPassword1 = "PioneerBrandNew999!";
    const resetConfRes = await fetch(`${API_BASE}/api/auth/reset-password-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email1, code: resetCode1, newPassword: newPassword1 })
    });
    assertTest("POST /api/auth/reset-password-confirm establishes new account password", resetConfRes.status === 200);

    // Verify login with new password
    const reLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: username1, password: newPassword1 })
    });
    assertTest("Login succeeds with newly established credential", reLoginRes.status === 200);
    const reLoginData = await reLoginRes.json();
    token1 = reLoginData.token;
    refreshToken1 = reLoginData.refreshToken;

    // ======================================================================
    // 5. MULTI-TIER REFERRALS REGISTERING
    // ======================================================================
    logHeader("5. Multi-Tier Partner Referrals");

    const email2 = `e2e_pioneer_ref_${Date.now()}@velora.io`;
    const username2 = `ref_pioneer_e2e_${Date.now()}`;
    const password2 = "RefereeSecure123!";

    const referrerCode = loginData.user.referralCode;

    // Register second user referring user 1
    const refRegRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2, username: username2, password: password2, referralCode: referrerCode })
    });
    assertTest("POST /api/auth/register handles referrals code successfully", refRegRes.status === 200 || refRegRes.status === 201);
    const refRegData = await refRegRes.json();
    
    const userId2 = Number(refRegData.user.id);
    testUserIds.push(userId2);
    let token2 = refRegData.token;

    // Check that referrer (User 1) points & count are updated
    const referrerObjRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: username1, password: newPassword1 })
    });
    const referrerObj = (await referrerObjRes.json()).user;
    assertTest("Referrer's referralsCount incremented to 1", referrerObj.referralsCount === 1);
    assertTest("Referrer awarded level 1 referral points +250 points", referrerObj.points >= 250);

    // ======================================================================
    // 6. DAILY SYNERGY CHECK-IN & TASK COMPLETION
    // ======================================================================
    logHeader("6. Platform Loyalty, Tasks, & Daily Synergy");

    // Daily check-in
    const checkinRes = await fetch(`${API_BASE}/api/user/checkin`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assertTest("POST /api/user/checkin credits points on first daily check-in", checkinRes.status === 200);

    // Task Completion & Claiming
    const tasksRes = await fetch(`${API_BASE}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assertTest("GET /api/tasks lists waitlist objectives", tasksRes.status === 200);
    const tasksList = await tasksRes.json();
    assertTest("Tasks list is populated", tasksList.length > 0);

    const firstTaskId = tasksList[0].id;
    const claimTaskRes = await fetch(`${API_BASE}/api/tasks/${firstTaskId}/claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assertTest("POST /api/tasks/:id/claim successfully completes waitlist objectives", claimTaskRes.status === 200);

    // ======================================================================
    // 7. ACCOUNT WALLET LINKING & KYC PROCESS
    // ======================================================================
    logHeader("7. Wallet Linking & KYC Submission");

    // Link Web3 Wallet
    const walletRes = await fetch(`${API_BASE}/api/user/wallet/link`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", walletType: "MetaMask" })
    });
    assertTest("POST /api/user/wallet/link binds address to profile", walletRes.status === 200);

    // Submit KYC identity details
    const kycRes = await fetch(`${API_BASE}/api/user/kyc/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ fullName: "Waitlist Pioneer Two", documentType: "Passport", documentNumber: "B9988776" })
    });
    assertTest("POST /api/user/kyc/start initiates identity verification", kycRes.status === 200);

    // ======================================================================
    // 8. ADMINISTRATIVE CONTROLS & SECURITY ESCALATION
    // ======================================================================
    logHeader("8. Administrative Authorization & Controls");

    // Promote User 1 to Admin role directly in DB to perform privileged operations
    console.log("  Directly promoting User 1 to admin role in database for secure escalation...");
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, userId1));

    // Authenticate again as Admin to get an admin-scoped token
    const adminLoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: username1, password: newPassword1 })
    });
    const adminLoginData = await adminLoginRes.json();
    assertTest("Admin successfully authenticated and role logged as 'admin'", adminLoginData.user.role === 'admin');
    const adminToken = adminLoginData.token;

    // Admin Settings Update
    const adminSettingsRes = await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ appName: "Velora", pointMultiplier: 1.0 })
    });
    assertTest("PUT /api/admin/settings updates core system multipliers", adminSettingsRes.status === 200);

    // Admin Analytics Fetch
    const adminAnalyticsRes = await fetch(`${API_BASE}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertTest("GET /api/admin/analytics serves platform metrics", adminAnalyticsRes.status === 200);

    // Admin KYC Approval
    const adminApproveKycRes = await fetch(`${API_BASE}/api/admin/kyc/approve/${userId2}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertTest("POST /api/admin/kyc/approve/:userId verifies partner identity", adminApproveKycRes.status === 200);

    // Admin User Ban & Unban Checks
    const banRes = await fetch(`${API_BASE}/api/admin/users/ban/${userId2}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertTest("POST /api/admin/users/ban/:userId restricts target user status", banRes.status === 200);

    // Verify banned user cannot access protected endpoints
    const bannedMeRes = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assertTest("Banned users are rejected with status 401 Unauthorized", bannedMeRes.status === 401);

    // Unban User
    const unbanRes = await fetch(`${API_BASE}/api/admin/users/unban/${userId2}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assertTest("POST /api/admin/users/unban/:userId restores active status", unbanRes.status === 200);

    // ======================================================================
    // 9. REWARD CLAIMS & SYSTEM NOTIFICATIONS
    // ======================================================================
    logHeader("9. Reward Claims & Notifications");

    // Authenticate as User 2 again (who is now fully verified and points awarded)
    const user2LoginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: username2, password: password2 })
    });
    const user2LoginData = await user2LoginRes.json();
    token2 = user2LoginData.token;

    // Claim rewards
    const claimRes = await fetch(`${API_BASE}/api/user/rewards/claim`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({ amount: 10 })
    });
    assertTest("POST /api/user/rewards/claim processes waitlist token claiming correctly", claimRes.status === 200);

    // Notifications verify
    const notifRes = await fetch(`${API_BASE}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    assertTest("GET /api/notifications serves user logs and updates", notifRes.status === 200);
    const notifList = await notifRes.json();
    assertTest("Notifications stream contains records", notifList.length > 0);

    // ======================================================================
    // 10. RATE LIMITING THROTTLING TEST (Executed last to avoid IP lockout)
    // ======================================================================
    logHeader("10. Global API Rate Limiting");
    
    console.log("  Executing rapid request burst to trigger throttling (101 requests)...");
    let rateLimited = false;
    for (let i = 0; i < 105; i++) {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assertTest("API triggers 429 Too Many Requests rate limiting upon high frequency spikes", rateLimited);

    // ======================================================================
    // E2E EVALUATION SUMMARY
    // ======================================================================
    console.log(`\n${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}                    INTEGRATION TEST PASSED SUCCESSFULLY              ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}`);
    console.log(`  🟢 Checks Executed:        ${colors.green}${colors.bright}${passed + failed}${colors.reset}`);
    console.log(`  🟢 Checks Passed:          ${colors.green}${colors.bright}${passed}${colors.reset}`);
    console.log(`  🔴 Checks Failed:          ${colors.red}${colors.bright}${failed}${colors.reset}`);
    console.log(`  📈 Quality Success Rate:   ${colors.bright}100.00%${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}======================================================================${colors.reset}\n`);

  } catch (err: any) {
    console.error(`\n  🔴 ${colors.red}${colors.bright}INTEGRATION TEST SUITE FAILED DURING EXECUTION:${colors.reset}`, err.message);
    process.exit(1);
  } finally {
    // DB clean up
    console.log(`\n${colors.yellow}🧹 Cleaning up database and removing test seeds...${colors.reset}`);
    if (testUserIds.length > 0) {
      await db.delete(users).where(sql`id IN (${sql.join(testUserIds, sql`, `)})`);
    }
    console.log(`🧹 Cleaned up ${testUserIds.length} test users successfully.`);
  }
}

runE2ETests().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
