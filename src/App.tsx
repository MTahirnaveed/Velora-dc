import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Check,
  FileText,
  Download,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  ListChecks,
  X,
  PlusCircle,
  Sparkle,
  ArrowRight,
  Pin,
  User,
  Users,
  Bell,
  Settings,
  Lock,
  Shield,
  Award,
  Terminal,
  Activity,
  TrendingUp,
  LogOut,
  Share2,
  ExternalLink,
  Calendar,
  Zap,
  Info,
  ChevronRight,
  UserCheck,
  CheckCircle,
  Menu,
  Heart,
  Wallet,
  Coins
} from 'lucide-react';
import {
  User as UserType,
  Task as TaskType,
  SystemSettings,
  AppNotification,
  AuditLog,
  SignupStat,
  AnalyticsStats
} from './types';
import { TelegramFeedView } from './components/TelegramFeedView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';

// Lazy loaded AdminView
const AdminView = React.lazy(() => import('./components/AdminView.tsx'));

// Preset Avatars for Web3 feel
const PRESET_AVATARS = [
  { id: 'avatar_1', name: 'Emerald Cipher', emoji: '👽', bg: 'bg-emerald-950 border-emerald-500 text-emerald-400' },
  { id: 'avatar_2', name: 'Cyber Samurai', emoji: '⚔️', bg: 'bg-rose-950 border-rose-500 text-rose-400' },
  { id: 'avatar_3', name: 'Crypto Wizard', emoji: '🧙‍♂️', bg: 'bg-violet-950 border-violet-500 text-violet-400' },
  { id: 'avatar_4', name: 'Web3 Goddess', emoji: '👩‍🎤', bg: 'bg-sky-950 border-sky-500 text-sky-400' },
  { id: 'avatar_5', name: 'Alpha Chad', emoji: '🦁', bg: 'bg-amber-950 border-amber-500 text-amber-400' },
  { id: 'avatar_6', name: 'Vortex Nomade', emoji: '🌌', bg: 'bg-indigo-950 border-indigo-500 text-indigo-400' },
  { id: 'avatar_admin', name: 'Velora Architect', emoji: '👑', bg: 'bg-slate-950 border-slate-400 text-slate-100' },
];

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('velora_token'));
  const [user, setUser] = useState<UserType | null>(null);
  
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'rewards' | 'profile' | 'leaderboard' | 'admin'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lists & Settings
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserType[]>([]);
  
  // UI Panels
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Admin states
  const [analytics, setAnalytics] = useState<{
    stats: {
      totalUsers: number;
      activeUsers: number;
      waitlistCount: number;
      telegramConversions: number;
      referralConversions: number;
    };
    signupsOverTime: SignupStat[];
    auditLogs: AuditLog[];
    userSummary: any[];
  } | null>(null);

  // Admin Task Creator
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormPoints, setTaskFormPoints] = useState(100);
  const [taskFormType, setTaskFormType] = useState<'daily' | 'social' | 'telegram' | 'twitter' | 'website'>('social');
  const [taskFormLink, setTaskFormLink] = useState('');

  // Telegram Simulator State
  const [telegramSimulatorOpen, setTelegramSimulatorOpen] = useState(true);
  const [simulatedChatHistory, setSimulatedChatHistory] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: '🤖 Velora Welcome Bot active.\nType /start to connect with our system!' }
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [telegramFeed, setTelegramFeed] = useState<any[]>([]);

  // Phase 3 Advanced States
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [linkingWalletModalOpen, setLinkingWalletModalOpen] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<'metamask' | 'coinbase' | 'phantom' | 'walletconnect' | null>(null);
  const [simulatedAddressInput, setSimulatedAddressInput] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Phase 4 / Security States
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [tempLoginToken, setTempLoginToken] = useState<string | null>(null);
  const [isForcedPasswordReset, setIsForcedPasswordReset] = useState(false);
  const [tempResetToken, setTempResetToken] = useState<string | null>(null);
  const [forcedNewPassword, setForcedNewPassword] = useState('');
  const [setup2FASecret, setSetup2FASecret] = useState('');
  const [setup2FAQRCode, setSetup2FAQRCode] = useState('');
  const [setup2FACode, setSetup2FACode] = useState('');
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  
  // Admin campaign composer
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  
  // KYC simulation details
  const [kycFullName, setKycFullName] = useState('');
  const [kycDocumentType, setKycDocumentType] = useState('passport');
  const [kycDocumentNumber, setKycDocumentNumber] = useState('');

  // Profile configuration states
  const [profileUsername, setProfileUsername] = useState('');
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(true);
  const [emailReferrals, setEmailReferrals] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  // Email logs state
  const [sentEmails, setSentEmails] = useState<any[]>([]);

  // Banner states
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);

  const notificationsEndRef = useRef<HTMLDivElement>(null);

  // Copy referral code helper
  const [copiedReferral, setCopiedReferral] = useState(false);

  // -------------------------------------------------------------
  // Data Fetching & Core Setup
  // -------------------------------------------------------------

  useEffect(() => {
    fetchGlobalSettings();
    fetchTelegramFeed();
    const interval = setInterval(() => {
      fetchTelegramFeed();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('velora_token', token);
      fetchUserProfile();
      fetchTasks();
      fetchNotifications();
    } else {
      localStorage.removeItem('velora_token');
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      if (user.role === 'admin') {
        fetchAdminAnalytics();
      }
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setBannerSuccess(msg);
    setTimeout(() => setBannerSuccess(null), 4000);
  };

  const showError = (msg: string) => {
    setBannerError(msg);
    setTimeout(() => setBannerError(null), 6000);
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  };

  const fetchTelegramFeed = async () => {
    try {
      const res = await fetch('/api/telegram/feed');
      if (res.ok) {
        const data = await res.json();
        setTelegramFeed(data);
      }
    } catch (e) {
      console.error("Error fetching telegram feed:", e);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfileUsername(data.user.username);
        setEmailMarketing(data.user.emailMarketing !== undefined ? data.user.emailMarketing : true);
        setEmailAnnouncements(data.user.emailAnnouncements !== undefined ? data.user.emailAnnouncements : true);
        setEmailReferrals(data.user.emailReferrals !== undefined ? data.user.emailReferrals : true);
        setSoundEffects(data.user.soundEffects !== undefined ? data.user.soundEffects : true);
      } else {
        // Token expired or invalid
        handleLogout();
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  };

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      // Fetch leaderboard users from mock database
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Sort users by points desc
        const sorted = data.userSummary.sort((a: any, b: any) => b.points - a.points);
        setLeaderboard(sorted);
      }
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  const fetchAdminAnalytics = async () => {
    if (!token || !user || user.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
        if (data.sentEmails) {
          setSentEmails(data.sentEmails);
        }
      }
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    }
  };

  // -------------------------------------------------------------
  // PHASE 3 USER ACTIONS
  // -------------------------------------------------------------

  const handleLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletType) {
      showError("Please select a wallet provider.");
      return;
    }

    setWalletConnecting(true);
    // Simulate smart contract wallet connection handshake delay
    setTimeout(async () => {
      try {
        const generatedAddress = simulatedAddressInput.trim() || `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        const res = await fetch('/api/user/wallet/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ walletAddress: generatedAddress, walletType: selectedWalletType })
        });

        const data = await res.json();
        if (res.ok) {
          showSuccess(data.message);
          setLinkingWalletModalOpen(false);
          setSimulatedAddressInput('');
          await fetchUserProfile();
          await fetchLeaderboard();
        } else {
          showError(data.error || "Wallet link failed.");
        }
      } catch (err) {
        showError("Wallet connection error.");
      } finally {
        setWalletConnecting(false);
      }
    }, 1200);
  };

  const handleStartKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFullName.trim() || !kycDocumentNumber.trim()) {
      showError("Please fill in all identity verification fields.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/kyc/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName: kycFullName, documentType: kycDocumentType, documentNumber: kycDocumentNumber })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        setKycFullName('');
        setKycDocumentNumber('');
        await fetchUserProfile();
        if (user?.role === 'admin') {
          await fetchAdminAnalytics();
        }
      } else {
        showError(data.error || "KYC initiation failed.");
      }
    } catch (err) {
      showError("Connection error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSaveProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: profileUsername,
          emailMarketing,
          emailAnnouncements,
          emailReferrals,
          soundEffects
        })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        setUser(data.user);
        await fetchUserProfile();
        await fetchLeaderboard();
      } else {
        showError(data.error || "Failed to update profile settings.");
      }
    } catch (err) {
      showError("Connection error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [showDisable2FAForm, setShowDisable2FAForm] = useState(false);

  const handleGenerate2FA = async () => {
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/2fa/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSetup2FASecret(data.secret);
        setSetup2FAQRCode(data.qrCodeUrl);
        setShow2FASetupModal(true);
      } else {
        showError(data.error || "Failed to initiate 2FA setup.");
      }
    } catch (err) {
      showError("Could not connect to 2FA generation server.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setup2FACode.trim() || setup2FACode.length !== 6) {
      showError("Please enter a valid 6-digit verification code.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: setup2FACode })
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Two-Factor Authentication enabled successfully!");
        setShow2FASetupModal(false);
        setSetup2FACode('');
        setSetup2FASecret('');
        setSetup2FAQRCode('');
        // Update user state
        if (user) {
          setUser({ ...user, twoFactorEnabled: true } as any);
        }
      } else {
        showError(data.error || "Invalid 2FA code.");
      }
    } catch (err) {
      showError("Connection error while enabling 2FA.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disable2FAPassword) {
      showError("Password is required to disable 2FA.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: disable2FAPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Two-Factor Authentication disabled.");
        setDisable2FAPassword('');
        setShowDisable2FAForm(false);
        if (user) {
          setUser({ ...user, twoFactorEnabled: false } as any);
        }
      } else {
        showError(data.error || "Failed to disable 2FA. Incorrect password.");
      }
    } catch (err) {
      showError("Connection error while disabling 2FA.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleClaimAirdrop = async () => {
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        await fetchUserProfile();
        await fetchLeaderboard();
        if (user?.role === 'admin') {
          await fetchAdminAnalytics();
        }
      } else {
        showError(data.error || "Airdrop claim rejected.");
      }
    } catch (err) {
      showError("Connection error. Claim failed.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PHASE 3 ADMIN ACTIONS
  // -------------------------------------------------------------

  const handleApproveKyc = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/kyc/approve/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        await fetchAdminAnalytics();
        await fetchLeaderboard();
      } else {
        showError(data.error);
      }
    } catch (e) {
      showError("Failed to approve KYC.");
    }
  };

  const handleRejectKyc = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/kyc/reject/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        await fetchAdminAnalytics();
        await fetchLeaderboard();
      } else {
        showError(data.error);
      }
    } catch (e) {
      showError("Failed to reject KYC.");
    }
  };

  const handleDispatchEmailCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignTitle || !campaignBody) {
      showError("Please enter subject, title, and body for the campaign.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/email-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject: campaignSubject, campaignTitle, campaignBody })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(data.message);
        setCampaignSubject('');
        setCampaignTitle('');
        setCampaignBody('');
        await fetchAdminAnalytics();
      } else {
        showError(data.error || "Failed to dispatch campaign.");
      }
    } catch (e) {
      showError("Error dispatching campaign.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // CSV DOWNLOAD TRIGGER FUNCTIONS
  const handleExportUsersCsv = () => {
    triggerSecureCsvDownload('/api/admin/export/users', 'velora_users_export.csv');
  };

  const handleExportReferralsCsv = () => {
    triggerSecureCsvDownload('/api/admin/export/referrals', 'velora_referrals_export.csv');
  };

  const handleExportWaitlistCsv = () => {
    triggerSecureCsvDownload('/api/admin/export/waitlist', 'velora_waitlist_export.csv');
  };

  const triggerSecureCsvDownload = async (endpoint: string, filename: string) => {
    try {
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess(`Successfully exported ${filename}`);
    } catch (e) {
      showError(`CSV download failed: ${e instanceof Error ? e.message : 'server error'}`);
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION LOGIC
  // -------------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      showError("Please fill in all login fields.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: emailInput, password: passwordInput })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.twoFactorRequired) {
          setTempLoginToken(data.tempToken);
          setIs2FAChallenge(true);
          showSuccess("Verification Required: Please enter your 6-digit 2FA code.");
          return;
        }
        if (data.needsPasswordChange) {
          setTempResetToken(data.tempToken);
          setIsForcedPasswordReset(true);
          showSuccess("Security Policy: Please change your default administrator password.");
          return;
        }

        setToken(data.token);
        setUser(data.user);
        showSuccess("Welcome back, pioneer!");
        setEmailInput('');
        setPasswordInput('');
      } else {
        showError(data.error || "Login failed.");
      }
    } catch (err) {
      showError("Connection error. Could not reach server.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogin2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorInput.trim() || !tempLoginToken) {
      showError("Please enter your 6-digit authentication code.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/login-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: tempLoginToken, code: twoFactorInput })
      });

      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        showSuccess("Double lock verified. Welcome!");
        setIs2FAChallenge(false);
        setTwoFactorInput('');
        setTempLoginToken(null);
      } else {
        showError(data.error || "2FA verification failed.");
      }
    } catch (err) {
      showError("2FA server error. Please try again.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleForcedPasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forcedNewPassword.trim()) {
      showError("New password cannot be empty.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/admin/force-password-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tempResetToken, newPassword: forcedNewPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("Password changed successfully! Please log in using your new credentials.");
        setIsForcedPasswordReset(false);
        setForcedNewPassword('');
        setTempResetToken(null);
        setAuthMode('login');
      } else {
        showError(data.error || "Failed to update administrator credentials.");
      }
    } catch (err) {
      showError("Failed to perform password reset due to network error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !usernameInput.trim() || !passwordInput) {
      showError("All fields are required for sign up.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          username: usernameInput,
          password: passwordInput,
          referralCode: referralCodeInput || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        showSuccess("Registration successful! Verify email to unlock all features.");
        setEmailInput('');
        setUsernameInput('');
        setPasswordInput('');
        setReferralCodeInput('');
      } else {
        showError(data.error || "Registration failed.");
      }
    } catch (err) {
      showError("Error connecting to database.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) {
      showError("Please enter your 6-digit verification code.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: verificationCodeInput })
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess("Email verified! Points credited.");
        setVerificationCodeInput('');
        fetchUserProfile();
        fetchNotifications();
      } else {
        showError(data.error || "Incorrect code. Please try again.");
      }
    } catch (err) {
      showError("Verification error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showError("Please enter your email to request password reset.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`Code generated! For testing, use code: ${data.resetCode}`);
        setAuthMode('reset');
      } else {
        showError(data.error || "Reset request failed.");
      }
    } catch (e) {
      showError("Connection failed.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handlePasswordResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !resetCodeInput.trim() || !newPasswordInput) {
      showError("All fields are required to reset password.");
      return;
    }

    setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput,
          code: resetCodeInput,
          newPassword: newPasswordInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Password updated successfully! Please login.");
        setAuthMode('login');
        setResetCodeInput('');
        setNewPasswordInput('');
      } else {
        showError(data.error || "Failed to update password.");
      }
    } catch (e) {
      showError("Server error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('velora_token');
    setActiveTab('dashboard');
    showSuccess("Logged out of session.");
  };

  // -------------------------------------------------------------
  // USER ACTIONS
  // -------------------------------------------------------------

  const handleClaimCheckIn = async () => {
    if (!token) return;
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/user/checkin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`Consecutive Check-in Claimed! +${data.rewardClaimed} Points.`);
        fetchUserProfile();
        fetchNotifications();
      } else {
        showError(data.error || "Could not claim daily check-in.");
      }
    } catch (e) {
      showError("Check-in error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (!token) return;
    setGlobalLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess("Mission complete! Points successfully claimed.");
        fetchUserProfile();
        fetchTasks();
        fetchNotifications();
      } else {
        showError(data.error || "Verification failed. Please complete the instructions.");
      }
    } catch (e) {
      showError("Task claiming error.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: avatarId })
      });
      if (res.ok) {
        setUser(prev => prev ? { ...prev, avatar: avatarId } : null);
        setShowAvatarSelector(false);
        showSuccess("Profile avatar updated!");
      }
    } catch (e) {
      showError("Error updating avatar.");
    }
  };

  const handleMarkNotificationsAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // ADMIN BOARD LOGIC
  // -------------------------------------------------------------

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskFormTitle('');
    setTaskFormDesc('');
    setTaskFormPoints(100);
    setTaskFormType('social');
    setTaskFormLink('');
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task: TaskType) => {
    setEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormDesc(task.description);
    setTaskFormPoints(task.points);
    setTaskFormType(task.type);
    setTaskFormLink(task.link);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim()) {
      showError("Please supply a valid task title.");
      return;
    }

    const payload = {
      title: taskFormTitle,
      description: taskFormDesc,
      points: taskFormPoints,
      type: taskFormType,
      link: taskFormLink
    };

    const url = editingTask ? `/api/admin/tasks/${editingTask.id}` : '/api/admin/tasks';
    const method = editingTask ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(editingTask ? "Task successfully altered!" : "New strategic task published!");
        setShowTaskModal(false);
        fetchTasks();
        fetchAdminAnalytics();
        fetchTelegramFeed();
      } else {
        showError(data.error || "Error updating task.");
      }
    } catch (err) {
      showError("Task write error.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showSuccess("Task permanently removed.");
        fetchTasks();
        fetchAdminAnalytics();
        fetchTelegramFeed();
      }
    } catch (e) {
      showError("Error deleting task.");
    }
  };

  // -------------------------------------------------------------
  // TELEGRAM BOT SIMULATION ENGINE
  // -------------------------------------------------------------

  const handleSendSimulatorMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatorInput.trim()) return;

    const userText = simulatorInput.trim();
    setSimulatedChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setSimulatorInput('');

    try {
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userText,
          telegramUsername: user ? user.username : 'anonymous_tester'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimulatedChatHistory(prev => [...prev, { sender: 'bot', text: data.reply }]);
        
        // Refresh feed in case it bound credentials or logged messages!
        fetchTelegramFeed();
        if (user) {
          fetchUserProfile();
          fetchNotifications();
          fetchTasks();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateJoin = async (type: 'channel' | 'community') => {
    if (!token) {
      showError("Please sign in or register first to bind Telegram joined status to your session!");
      return;
    }

    try {
      const res = await fetch('/api/telegram/simulate-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });

      if (res.ok) {
        showSuccess(`Successfully simulated joining Velora ${type}! You can now claim the task points.`);
        fetchUserProfile();
        fetchNotifications();
        fetchTasks();
        fetchTelegramFeed();
      }
    } catch (e) {
      showError("Join simulation failure.");
    }
  };

  // Copy invitation link helper
  const handleCopyReferralLink = () => {
    if (!user) return;
    const inviteLink = `${window.location.origin}/?ref=${user.referralCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedReferral(true);
    showSuccess("Referral link copied to clipboard!");
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Calculated variables
  const referralProgressPercent = user ? Math.min((user.referralsCount / 10) * 100, 100) : 0;
  const nextMilestone = user 
    ? user.referralsCount < 3 ? { count: 3, label: 'Social Connector' } 
    : user.referralsCount < 10 ? { count: 10, label: 'Referral Legend' } 
    : null
    : null;

  // Active user list ranking
  const userRank = user && leaderboard.length > 0 
    ? leaderboard.findIndex(u => u.username === user.username) + 1 
    : '-';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200" id="velora_app">
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Success / Errors */}
      {bannerError && (
        <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-3 text-center text-sm font-medium sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-red-500/50 shadow-lg animate-slide-down" id="err-banner">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-100 animate-pulse" />
          <span>{bannerError}</span>
          <button onClick={() => setBannerError(null)} className="ml-4 hover:opacity-80 p-1"><X className="h-4 w-4" /></button>
        </div>
      )}

      {bannerSuccess && (
        <div className="bg-emerald-500/90 backdrop-blur-md text-white px-4 py-3 text-center text-sm font-medium sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-emerald-500/50 shadow-lg animate-fade-in" id="success-banner">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md" id="velora_header">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xl font-black tracking-widest bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
              VELORA
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono ml-2">
              Phase 3 Live
            </span>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800" id="desktop_nav">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" /> Tasks
            </button>
            <button
              onClick={() => { setActiveTab('rewards'); setMobileMenuOpen(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'rewards'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Coins className="h-3.5 w-3.5" /> Rewards Claims
            </button>
            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <User className="h-3.5 w-3.5" /> Profile Settings
            </button>
            <button
              onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> Leaderboard
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                }`}
              >
                <Shield className="h-3.5 w-3.5" /> Admin Panel
              </button>
            )}
          </nav>
        )}

        {/* Right Corner Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Notification Badge Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-300 transition-all relative cursor-pointer"
                  title="Notifications Log"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {notifications.some(n => !n.isRead) && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </button>

                {/* Notifications Panel Box Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-xl z-50 p-4" id="notifications_dropdown">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-200">System Notification Hub</span>
                      <button
                        onClick={handleMarkNotificationsAsRead}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase"
                      >
                        Clear unread
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-4">No notifications present.</p>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              notif.isRead ? 'bg-slate-950/40 border-slate-900/50 text-slate-400' : 'bg-slate-850 border-indigo-500/20 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-400">
                                {notif.type.toUpperCase()}
                              </span>
                              <span className="text-[8px] text-slate-500 font-mono">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className="text-[11px] font-bold mt-0.5">{notif.title}</h4>
                            <p className="text-[10px] mt-0.5 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm border-2 transition-all cursor-pointer ${
                    PRESET_AVATARS.find(a => a.id === user.avatar)?.bg || 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                  title="Choose Preset Avatar"
                >
                  {PRESET_AVATARS.find(a => a.id === user.avatar)?.emoji || '👤'}
                </button>

                {/* Avatar dropdown picker */}
                {showAvatarSelector && (
                  <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-xl z-50 p-3" id="avatar_picker">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Select Avatar preset</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_AVATARS.map(av => (
                        <button
                          key={av.id}
                          onClick={() => handleSelectAvatar(av.id)}
                          className={`h-10 w-10 rounded-lg text-lg flex items-center justify-center border transition-all hover:scale-110 ${av.bg} ${
                            user.avatar === av.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950' : 'opacity-75'
                          }`}
                          title={av.name}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Logged in User tag */}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-slate-200">@{user.username}</p>
                <p className="text-[10px] text-slate-400 font-mono">Rank: #{userRank}</p>
              </div>

              {/* Signout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 border border-slate-800 hover:border-red-500/20 rounded-xl transition-all"
                title="Disconnect Wallet/Session"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 border border-slate-800 rounded-xl">
              <Lock className="h-3.5 w-3.5 text-indigo-500" /> Decentralized Access Secure
            </span>
          )}

          {/* Mobile menu trigger */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Menu Dropdown drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 z-50 transition-all shadow-md animate-slide-down">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" /> Dashboard Workspace
          </button>
          <button
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              activeTab === 'tasks' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ListChecks className="h-4 w-4" /> Missions & Quests
          </button>
          <button
            onClick={() => { setActiveTab('rewards'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              activeTab === 'rewards' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Coins className="h-4 w-4" /> Rewards Claims
          </button>
          <button
            onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <User className="h-4 w-4" /> Profile Settings
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" /> Waitlist Rankings
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 text-rose-400 ${
                activeTab === 'admin' ? 'bg-rose-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              <Shield className="h-4 w-4" /> Admin System Control
            </button>
          )}
        </div>
      )}

      {isOffline && (
        <div className="bg-amber-600/95 backdrop-blur-md text-white px-4 py-2 text-center text-[11px] font-mono font-bold flex items-center justify-center gap-2 border-b border-amber-500/50 shadow-md relative z-50">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-100 animate-bounce" />
          <span>⚠️ OFFLINE MODE DETECTED: Running in local sandbox mode. Synchronization buffered automatically.</span>
        </div>
      )}

      {/* Primary Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative z-10" id="main_layout">
        
        {/* Left/Middle Column - Interactive Core Panels */}
        <div className="flex-1 w-full space-y-6" id="core_panel_area">
          
          {/* USER DISCONNECTED STATE -> Auth Screens */}
          {!user ? (
            <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative" id="auth_container">
              
              {/* Card visual header */}
              <div className="text-center space-y-2 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-rose-300 bg-clip-text text-transparent">
                  Access Velora Core Node
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Sign up, refer strategic partners, complete quests, and verify credentials to claim points and top priorities.
                </p>
              </div>

              {/* Forced Password Reset form */}
              {isForcedPasswordReset && (
                <form onSubmit={handleForcedPasswordResetSubmit} className="space-y-4" id="forced_reset_form">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl mb-4 text-xs">
                    <strong>Administrative Security Policy:</strong> You must configure a secure, custom password before proceeding with your first login.
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="e.g. at least 8 characters"
                      value={forcedNewPassword}
                      onChange={(e) => setForcedNewPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    {globalLoading ? 'Updating credentials...' : 'Establish Password & Proceed'}
                  </button>
                </form>
              )}

              {/* 2FA Challenge Verification Form */}
              {is2FAChallenge && !isForcedPasswordReset && (
                <form onSubmit={handleLogin2FA} className="space-y-4" id="challenge_2fa_form">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl mb-4 text-xs">
                    <strong>Two-Factor Verification Required:</strong> Enter the 6-digit verification code from your authenticator app.
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">2FA Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={twoFactorInput}
                      onChange={(e) => setTwoFactorInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs text-center tracking-widest text-lg font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    {globalLoading ? 'Verifying 2FA...' : 'Unlock Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIs2FAChallenge(false);
                      setTwoFactorInput('');
                      setTempLoginToken(null);
                    }}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-slate-300 mt-2 block hover:underline"
                  >
                    Cancel & Return to Login
                  </button>
                </form>
              )}

              {/* Login Form */}
              {!is2FAChallenge && !isForcedPasswordReset && authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4" id="login_form">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Email address or Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pioneer@velora.io"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200 transition-all"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.01] cursor-pointer"
                  >
                    {globalLoading ? 'Connecting...' : 'Secure Authorization'}
                  </button>
                  <p className="text-center text-xs text-slate-400 pt-2">
                    New waitlist candidate?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      Initialize Sign Up
                    </button>
                  </p>
                </form>
              )}

              {/* Registration Form */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4" id="register_form">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Pioneer Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. voyager_X"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Email Contact Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. pilot@universe.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Secure Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Referral Invitation Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. VEL_ADMIN"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.01] cursor-pointer"
                  >
                    {globalLoading ? 'Constructing Account...' : 'Generate Credentials'}
                  </button>
                  <p className="text-center text-xs text-slate-400 pt-2">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                    >
                      Authenticate login
                    </button>
                  </p>
                </form>
              )}

              {/* Forgot password */}
              {authMode === 'forgot' && (
                <form onSubmit={handlePasswordResetRequest} className="space-y-4" id="forgot_form">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Enter Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="registered@email.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
                  >
                    {globalLoading ? 'Processing...' : 'Request Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200 pt-2 block"
                  >
                    Return to Login
                  </button>
                </form>
              )}

              {/* Reset Password Form */}
              {authMode === 'reset' && (
                <form onSubmit={handlePasswordResetConfirm} className="space-y-4" id="reset_form">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Verification Reset Code</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit reset code"
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 text-center font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">New Secure Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={globalLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
                  >
                    Commit New Password
                  </button>
                </form>
              )}

              {/* Quick Login credentials helper for testing */}
              <div className="mt-8 pt-4 border-t border-slate-850 text-left">
                <span className="block text-[9px] uppercase font-bold text-indigo-400/80 tracking-wider mb-1">Developer test bypass:</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  To login as administrator, use identity <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono">admin</code> and password <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono">admin123</code>.
                </p>
              </div>
            </div>
          ) : (
            
            /* USER LOGGED IN - CORE TAB CONTENTS */
            <div className="space-y-6" id="tabs_container">
              
              {/* Alert: If not email verified, show verification card banner! */}
              {!user.verified && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" id="verify_alert">
                  <div className="flex gap-3 items-start text-left">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">Contact Email Verification Pending</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Verify your registration email to earn <span className="font-bold text-amber-400">+150 points</span> and fully unlock referral multiplier links!
                        Your simulation code is: <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-amber-300">{user.verificationCode || '123456'}</code>.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyEmail} className="flex gap-2 w-full md:w-auto shrink-0" id="verify_inline_form">
                    <input
                      type="text"
                      required
                      placeholder="6-digit code"
                      value={verificationCodeInput}
                      onChange={(e) => setVerificationCodeInput(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-center font-mono w-28 text-slate-200"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Verify
                    </button>
                  </form>
                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 1: USER DASHBOARD
                  ------------------------------------------------------------- */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6" id="tab_dashboard_view">
                  
                  {/* Top Row: Core statistics (Points, Rank, Streak, Referrals) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="stat_grid">
                    
                    {/* Points Balance Card */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Velora Score</span>
                        <Zap className="h-4 w-4 text-indigo-400" />
                      </div>
                      <p className="text-3xl font-black tracking-tight text-white glow-indigo">
                        {user.points}
                      </p>
                      <p className="text-[10px] text-indigo-400 font-mono mt-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Score priority active
                      </p>
                    </div>

                    {/* Waitlist Leaderboard Position */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Waitlist Rank</span>
                        <Award className="h-4 w-4 text-rose-400" />
                      </div>
                      <p className="text-3xl font-black tracking-tight text-white">
                        #{userRank}
                      </p>
                      <p className="text-[10px] text-rose-400 mt-0.5 font-mono">
                        Out of {leaderboard.length} pioneers
                      </p>
                    </div>

                    {/* Daily Check-in Streak */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Consecutive Streak</span>
                        <Calendar className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-3xl font-black tracking-tight text-white">
                        {user.dailyStreak}/7
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">
                        Claimed daily streaks
                      </p>
                    </div>

                    {/* Referrals Invite Count */}
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all" />
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Partner Referrals</span>
                        <Users className="h-4 w-4 text-amber-400" />
                      </div>
                      <p className="text-3xl font-black tracking-tight text-white">
                        {user.referralsCount}
                      </p>
                      <p className="text-[10px] text-amber-400 mt-0.5 font-mono">
                        +250 points per referral
                      </p>
                    </div>
                  </div>

                  {/* Daily Check-In streak board */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left" id="checkin_widget">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-4 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-400" /> Daily Synergy Check-In Rewards
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                          Claim rewards every 24 hours. Complete a 7-day streak to claim the <span className="text-indigo-400 font-semibold">Loyal Chronos</span> badge and 500 points!
                        </p>
                      </div>

                      <button
                        onClick={handleClaimCheckIn}
                        className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                        id="btn_checkin_claim"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Claim Check-In Reward
                      </button>
                    </div>

                    {/* Streak map visualization */}
                    <div className="grid grid-cols-7 gap-2" id="streak_map">
                      {[50, 100, 150, 200, 250, 300, 500].map((pts, i) => {
                        const dayNum = i + 1;
                        const isClaimed = user.dailyStreak >= dayNum;
                        const isActive = user.dailyStreak + 1 === dayNum || (user.dailyStreak === 0 && dayNum === 1);

                        return (
                          <div
                            key={pts}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isClaimed
                                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                                : isActive
                                ? 'bg-slate-800/80 border-indigo-500/20 text-slate-200 ring-1 ring-indigo-500/50 scale-[1.02]'
                                : 'bg-slate-950/40 border-slate-900 text-slate-500'
                            }`}
                          >
                            <span className="block text-[9px] uppercase tracking-wider font-bold mb-1 font-mono">Day {dayNum}</span>
                            <span className="block text-xs font-black">{pts}</span>
                            <span className="block text-[8px] opacity-75">pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Referral Progress Bar card */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left space-y-4" id="referral_widget">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-purple-400" /> Strategic Referral Milestone Hub
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Build your direct syndicate nodes. Grow team count to trigger massive priority multiplier boosts and achievement badges.
                      </p>
                    </div>

                    {/* Referral Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-300">
                        <span>Milestone Progress ({user.referralsCount}/10 referrals)</span>
                        <span className="text-purple-400">{Math.round(referralProgressPercent)}% complete</span>
                      </div>
                      
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 h-full rounded-full transition-all duration-500 shadow-inner"
                          style={{ width: `${referralProgressPercent}%` }}
                        />
                      </div>

                      {/* Milestone nodes map indicators */}
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-1">
                        <span className={user.referralsCount >= 1 ? 'text-indigo-400 font-bold' : ''}>0 Ref (Start)</span>
                        <span className={user.referralsCount >= 3 ? 'text-purple-400 font-bold' : ''}>3 Ref (Social Connector)</span>
                        <span className={user.referralsCount >= 10 ? 'text-rose-400 font-bold' : ''}>10 Ref (Referral Legend)</span>
                      </div>
                    </div>

                    {/* Invite Copy Box */}
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-left space-y-1 w-full">
                        <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Your personal referral link</span>
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/?ref=${user.referralCode}`}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 w-full focus:outline-hidden"
                        />
                      </div>

                      <button
                        onClick={handleCopyReferralLink}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold px-4 py-2 rounded-lg text-xs shrink-0 flex items-center gap-1.5 transition-all w-full md:w-auto justify-center cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" /> {copiedReferral ? 'Link Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  {/* Achievement Badges catalog list */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left" id="badges_widget">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-amber-400" /> Gained Pioneer Achievement Badges
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                      Complete milestones inside our platform. Badges represent permanent metadata credibility on the upcoming mainnet token launch.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {[
                        { id: 'Early Pioneer', name: 'Early Pioneer', desc: 'Welcome waitlist node registration bonus.', icon: Sparkle, color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10' },
                        { id: 'Verified Pioneer', name: 'Verified Pioneer', desc: 'Secure contact details verified on-chain.', icon: Shield, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
                        { id: 'Loyal Chronos', name: 'Loyal Chronos', desc: 'Completed a consecutive 7-day daily check-in sequence.', icon: Calendar, color: 'text-sky-400 bg-sky-500/5 border-sky-500/10' },
                        { id: 'Social Connector', name: 'Social Connector', desc: 'Generated 3 or more direct waitlist syndicates.', icon: Users, color: 'text-purple-400 bg-purple-500/5 border-purple-500/10' },
                        { id: 'Referral Legend', name: 'Referral Legend', desc: 'Secured 10+ strategic active waitlist partners.', icon: Award, color: 'text-rose-400 bg-rose-500/5 border-rose-500/10' },
                        { id: 'Task Master', name: 'Task Master', desc: 'Completed 5 active social or network missions.', icon: ListChecks, color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
                      ].map(badge => {
                        const isUnlocked = user.badges.includes(badge.id);

                        return (
                          <div
                            key={badge.id}
                            className={`p-3.5 rounded-xl border flex gap-3 text-left transition-all relative overflow-hidden ${
                              isUnlocked
                                ? `${badge.color} bg-opacity-10 opacity-100 scale-100 shadow-sm`
                                : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                            }`}
                          >
                            <div className="shrink-0 pt-0.5">
                              <badge.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-200">{badge.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{badge.desc}</p>
                              {isUnlocked ? (
                                <span className="inline-block text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded-md font-mono font-bold mt-2 uppercase">
                                  Unlocked
                                </span>
                              ) : (
                                <span className="inline-block text-[8px] bg-slate-900 text-slate-500 border border-slate-800 px-1.5 py-0.2 rounded-md font-mono font-bold mt-2 uppercase">
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 2: MISSION & TASKS
                  ------------------------------------------------------------- */}
              {activeTab === 'tasks' && (
                <div className="space-y-6" id="tab_tasks_view">
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          <ListChecks className="h-4 w-4 text-indigo-400" /> Active Strategic Missions
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Complete daily check-ins, verify social handles, and explore our networks to earn priority points multipliers.
                        </p>
                      </div>

                      <div className="text-xs text-slate-400 bg-slate-950 border border-slate-850 px-3.5 py-1.5 rounded-xl font-mono">
                        Global multiplier: <span className="font-bold text-indigo-400">x{settings?.pointMultiplier || '1.0'}</span>
                      </div>
                    </div>

                    <div className="space-y-3" id="active_tasks_list">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-8">No tasks published yet.</p>
                      ) : (
                        tasks.map((tsk) => {
                          let typeTag = "Social";
                          let colorClass = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                          if (tsk.type === 'daily') {
                            typeTag = "Daily Check";
                            colorClass = "text-sky-400 bg-sky-500/10 border-sky-500/20";
                          } else if (tsk.type === 'telegram') {
                            typeTag = "Telegram Join";
                            colorClass = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                          } else if (tsk.type === 'twitter') {
                            typeTag = "X/Twitter Follow";
                            colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                          } else if (tsk.type === 'website') {
                            typeTag = "Web Visit";
                            colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                          }

                          return (
                            <div
                              key={tsk.id}
                              className={`p-4 rounded-xl border text-left transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                                tsk.completed
                                  ? 'bg-slate-950/40 border-slate-900 opacity-70'
                                  : 'bg-slate-900 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded-full border ${colorClass}`}>
                                    {typeTag}
                                  </span>
                                  <span className="text-xs text-amber-400 font-bold font-mono">
                                    +{tsk.points * (settings?.pointMultiplier || 1.0)} pts
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-200">{tsk.title}</h4>
                                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">{tsk.description}</p>
                              </div>

                              <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0">
                                {tsk.completed ? (
                                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                    <Check className="h-3.5 w-3.5" /> Claimed Complete
                                  </span>
                                ) : (
                                  <>
                                    <a
                                      href={tsk.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-750 flex items-center gap-1 transition-all cursor-pointer"
                                    >
                                      Go <ExternalLink className="h-3 w-3" />
                                    </a>
                                    <button
                                      onClick={() => handleClaimTask(tsk.id)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      Verify Claim
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 3: WAITLIST RANKINGS (LEADERBOARD)
                  ------------------------------------------------------------- */}
              {activeTab === 'leaderboard' && (
                <LeaderboardView
                  leaderboard={leaderboard}
                  user={user}
                  userRank={userRank}
                />
              )}

              {/* -------------------------------------------------------------
                  TAB 4: SYSTEM ADMIN PANEL
                  ------------------------------------------------------------- */}
              {activeTab === 'admin' && user.role === 'admin' && (
                <React.Suspense fallback={
                  <div className="text-center py-12 text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" /> Connecting to Admin Node...
                  </div>
                }>
                  <AdminView
                    user={user}
                    analytics={analytics}
                    tasks={tasks}
                    token={token}
                    settings={settings}
                    setSettings={setSettings}
                    showSuccess={showSuccess}
                    showError={showError}
                    fetchAdminAnalytics={fetchAdminAnalytics}
                    fetchTelegramFeed={fetchTelegramFeed}
                    handleOpenCreateTask={handleOpenCreateTask}
                    handleOpenEditTask={handleOpenEditTask}
                    handleDeleteTask={handleDeleteTask}
                  />
                </React.Suspense>
              )}

              {/* -------------------------------------------------------------
                  TAB 5: REWARDS & TOKEN CLAIMS
                  ------------------------------------------------------------- */}
              {activeTab === 'rewards' && (
                <div className="space-y-6 animate-fade-in" id="tab_rewards_view">
                  
                  {/* Rewards Status banner */}
                  <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-left relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-1.5 relative z-10">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md">VLR Token Allocation</span>
                      <h3 className="text-lg font-black text-white">Velora Rewards Claiming Portal</h3>
                      <p className="text-xs text-slate-400 max-w-xl">
                        Swap your earned Pioneer points for real VLR Utility Tokens. Verified waitlist pioneers can claim instantly to their connected smart wallet address.
                      </p>
                    </div>

                    <div className="shrink-0 bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center relative z-10">
                      <span className="block text-[9px] uppercase font-bold text-slate-500 font-mono mb-1">Your Total Balance</span>
                      <div className="flex items-center gap-1.5 justify-center">
                        <Coins className="h-5 w-5 text-amber-400 animate-spin-slow" />
                        <span className="text-2xl font-black text-amber-400 font-mono">{user?.points || 0}</span>
                        <span className="text-xs text-slate-400 font-bold font-mono">PTS</span>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 block">≈ {Math.floor((user?.points || 0) / 10)} VLR Tokens</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Token Claim swap block */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-amber-400" /> Point to Token Swap Engine
                        </h3>
                        
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Pioneer Points</span>
                            <span className="text-slate-500">Rate: 10 PTS = 1 VLR</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-850 rounded-lg p-2.5">
                            <span className="text-sm font-bold text-indigo-400 font-mono">{user?.points || 0} PTS</span>
                            <span className="text-xs text-slate-500">Max Available</span>
                          </div>
                          
                          <div className="flex justify-center my-1">
                            <div className="bg-slate-900 p-1.5 rounded-full border border-slate-850">
                              <ArrowRight className="h-4 w-4 text-indigo-400 rotate-90" />
                            </div>
                          </div>

                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Estimated VLR Tokens</span>
                            <span className="text-slate-500">Mainnet Utility Contract</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-900/80 border border-slate-850 rounded-lg p-2.5">
                            <span className="text-sm font-bold text-emerald-400 font-mono">{Math.floor((user?.points || 0) / 10)} VLR</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Simulated</span>
                          </div>
                        </div>

                        {/* Claiming button logic with error display */}
                        {(!user?.verified || !user?.walletAddress || (user?.points || 0) < 100) ? (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-left flex gap-3">
                            <Info className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 text-[11px] text-rose-300">
                              <p className="font-bold">Claiming Locks Active</p>
                              <p className="leading-relaxed opacity-90">
                                To complete claiming, you must verify your email address, connect a Web3 wallet, and accumulate at least 100 points.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-left flex gap-3">
                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 text-[11px] text-emerald-300">
                              <p className="font-bold">Rewards Claims Unlocked</p>
                              <p className="leading-relaxed opacity-90">
                                All eligibility rules satisfied! Claiming will burn point logs and execute an instant simulated ledger record.
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleClaimAirdrop}
                          disabled={!user?.verified || !user?.walletAddress || (user?.points || 0) < 100}
                          className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                            (user?.verified && user?.walletAddress && (user?.points || 0) >= 100)
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black cursor-pointer shadow-md shadow-amber-500/10'
                              : 'bg-slate-800 border border-slate-750 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="h-4 w-4" /> Claim VLR Pioneer Tokens
                        </button>
                      </div>

                    </div>

                    {/* Eligibility checker checklist */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-indigo-400" /> Eligibility Checklist
                        </h3>

                        <div className="space-y-3">
                          {[
                            { title: 'Waitlist Node Registration', desc: 'Secure an active login credential on the Velora system.', met: true },
                            { title: 'Secure Email Verification', desc: 'Verify your contact details (+150 pts bonus).', met: user?.verified },
                            { title: 'Web3 Wallet Linking', desc: 'Associate a smart ledger address with your waitlist.', met: !!user?.walletAddress },
                            { title: 'Minimum Threshold Reached', desc: 'Collect at least 100 Pioneer points inside your portal.', met: (user?.points || 0) >= 100 }
                          ].map((rule, index) => (
                            <div key={index} className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex items-start gap-3">
                              <div className="pt-0.5">
                                {rule.met ? (
                                  <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-400 font-bold">✓</span>
                                ) : (
                                  <span className="h-4.5 w-4.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">×</span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <h4 className={`text-[11px] font-bold ${rule.met ? 'text-slate-200' : 'text-slate-500'}`}>{rule.title}</h4>
                                <p className="text-[9px] text-slate-400 leading-normal">{rule.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Claims History Table log */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                      <Terminal className="h-4 w-4 text-emerald-400" /> Web3 Smart Ledger Claims Ledger
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] text-slate-300">
                        <thead>
                          <tr className="uppercase text-[9px] text-slate-500 font-mono font-bold border-b border-slate-800">
                            <th className="py-2.5">Date Created</th>
                            <th className="py-2.5">Swapped Points</th>
                            <th className="py-2.5">VLR Claims Minted</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 font-mono text-right">Ledger Transaction Hash</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {(!user?.claimHistory || user.claimHistory.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500">No claim records detected.</td>
                            </tr>
                          ) : (
                            user.claimHistory.map((clm: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-950/20 font-mono">
                                <td className="py-2.5 text-slate-400">{clm.date}</td>
                                <td className="py-2.5 font-bold text-slate-200">{clm.pointsSwapped} PTS</td>
                                <td className="py-2.5 font-bold text-emerald-400">+{clm.tokensClaimed} VLR</td>
                                <td className="py-2.5">
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase">
                                    {clm.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right text-[10px] text-slate-500 text-indigo-400 hover:underline cursor-pointer select-all">
                                  {clm.txHash}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* -------------------------------------------------------------
                  TAB 6: USER PROFILE & IDENTITY DECENTRALIZATION
                  ------------------------------------------------------------- */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in" id="tab_profile_view">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* General Settings and toggles */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                          <Settings className="h-4 w-4 text-indigo-400" /> Account Settings
                        </h3>

                        <form onSubmit={handleSaveProfileSettings} className="space-y-4" id="profile_update_form">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Portal Username</label>
                            <input
                              type="text"
                              required
                              value={profileUsername}
                              onChange={(e) => setProfileUsername(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-hidden"
                            />
                          </div>

                          <div className="space-y-3.5 pt-2 border-t border-slate-850">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Notification Channels</span>
                            
                            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-200">Marketing & Campaign Alerts</h4>
                                <p className="text-[9px] text-slate-400">Receive announcements about launch sequences.</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailMarketing}
                                onChange={(e) => setEmailMarketing(e.target.checked)}
                                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-200">System Bulletins</h4>
                                <p className="text-[9px] text-slate-400">Essential security digests and system upgrades.</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailAnnouncements}
                                onChange={(e) => setEmailAnnouncements(e.target.checked)}
                                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-200">Referral Multiplier Milestones</h4>
                                <p className="text-[9px] text-slate-400">Get notified when partners join your node group.</p>
                              </div>
                              <input
                                type="checkbox"
                                checked={emailReferrals}
                                onChange={(e) => setEmailReferrals(e.target.checked)}
                                className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                            <div>
                              <h4 className="text-[11px] font-bold text-slate-200">Simulate Portal Chimes & Audio</h4>
                              <p className="text-[9px] text-slate-400">Play synthetic ticks on points claims achievements.</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={soundEffects}
                              onChange={(e) => setSoundEffects(e.target.checked)}
                              className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                            >
                              Apply Updates
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Two-Factor Authentication (2FA) Security Card */}
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left space-y-4" id="two_factor_settings_card">
                        <div>
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Lock className="h-4 w-4 text-rose-400" /> Multi-Factor Authentication (2FA)
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                            Secure your administrative node and user parameters with standard 6-digit dynamic key authentication locks.
                          </p>
                        </div>

                        {user?.twoFactorEnabled ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="font-bold">Two-Factor Authentication is active and protecting your node.</span>
                            </div>

                            {showDisable2FAForm ? (
                              <form onSubmit={handleDisable2FA} className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                <p className="text-[10px] text-slate-300">Enter your password to verify authorization and disable 2FA:</p>
                                <div>
                                  <input
                                    type="password"
                                    required
                                    placeholder="Confirm password"
                                    value={disable2FAPassword}
                                    onChange={(e) => setDisable2FAPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowDisable2FAForm(false);
                                      setDisable2FAPassword('');
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-slate-300 font-semibold px-2 py-1"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={globalLoading}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded-lg text-[10px] transition-all cursor-pointer"
                                  >
                                    Confirm Disable
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setShowDisable2FAForm(true)}
                                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 font-bold px-4 py-2 rounded-xl text-xs transition-all w-full cursor-pointer shadow-sm text-center"
                              >
                                Disable 2FA Protection
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              <span>2FA is currently disabled. Enable to block brute-force attacks.</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleGenerate2FA}
                              disabled={globalLoading}
                              className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all w-full cursor-pointer shadow-md text-center"
                            >
                              {globalLoading ? 'Initiating Setup...' : 'Setup Two-Factor Authentication'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Avatar picker module in-tab */}
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-400" /> Pioneer Avatar presets
                        </h3>
                        <p className="text-[11px] text-slate-400 mb-4 leading-normal">
                          Choose an elegant visual preset badge representing your cryptographic rank inside the waitlist.
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {PRESET_AVATARS.map(av => {
                            const isSelected = user?.avatar === av.id;
                            return (
                              <button
                                key={av.id}
                                onClick={() => handleSelectAvatar(av.id)}
                                className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                                  isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500/30 text-white shadow-md'
                                    : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400'
                                }`}
                              >
                                <span className="text-2xl">{av.emoji}</span>
                                <span className="text-[10px] font-bold block truncate max-w-full">{av.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Right side: Wallet link + KYC */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Web3 Wallet Association panel */}
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Wallet className="h-4 w-4 text-indigo-400" /> Decentralized Wallet Linker
                        </h3>

                        {user?.walletAddress ? (
                          <div className="space-y-3.5 bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-left">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Linked via {user.walletType?.toUpperCase() || 'WEB3'}
                            </div>
                            <div>
                              <span className="block text-[8px] uppercase font-bold text-slate-500 font-mono">Address Hash</span>
                              <p className="text-[11px] text-indigo-300 font-mono break-all bg-slate-900 p-2 border border-slate-850 rounded-lg select-all mt-1">
                                {user.walletAddress}
                              </p>
                            </div>
                            <button
                              onClick={() => setLinkingWalletModalOpen(true)}
                              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold py-2 rounded-lg text-[10px] text-slate-300 transition-all cursor-pointer"
                            >
                              Associate Different Wallet
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-left">
                            <p className="text-[11px] text-slate-400 leading-normal">
                              No Web3 address associated. Connect your smart contract wallet now to receive utility token tokens directly.
                            </p>
                            <button
                              onClick={() => {
                                setSelectedWalletType('metamask');
                                setLinkingWalletModalOpen(true);
                              }}
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                            >
                              Connect Smart Wallet
                            </button>
                          </div>
                        )}
                      </div>

                      {/* KYC status details */}
                      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left space-y-4">
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-emerald-400" /> KYC Identity Safeguard
                        </h3>

                        {user?.kycStatus === 'verified' ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="h-4.5 w-4.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-[11px] text-emerald-400 font-black">✓</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono uppercase">Identity Approved</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Your identity has been fully whitelisted for priority airdrop claim releases. No further actions needed.
                            </p>
                          </div>
                        ) : user?.kycStatus === 'pending' ? (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="h-4.5 w-4.5 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-[11px] text-amber-400 font-black animate-spin">⟳</span>
                              <span className="text-xs font-bold text-amber-400 font-mono uppercase">Verification Pending</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Your document details have been uploaded securely. Velora Core administrative teams are reviewing submissions.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Complete a 1-minute simulated KYC whitelist. This validates waitlist eligibility and keeps airdrop launches bot-free.
                            </p>
                            
                            <form onSubmit={handleStartKyc} className="space-y-3 bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-left">
                              <div>
                                <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Full Legal Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Satoshi Nakamoto"
                                  value={kycFullName}
                                  onChange={(e) => setKycFullName(e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Doc Type</label>
                                  <select
                                    value={kycDocumentType}
                                    onChange={(e) => setKycDocumentType(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                                  >
                                    <option value="passport">Passport</option>
                                    <option value="id_card">National ID Card</option>
                                    <option value="drivers_license">Driver's License</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Document No.</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. N904245"
                                    value={kycDocumentNumber}
                                    onChange={(e) => setKycDocumentNumber(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold py-2 rounded-lg text-xs transition-all cursor-pointer"
                              >
                                Submit Credentials
                              </button>
                            </form>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* 2FA SETUP MODAL DIALOG */}
                  {show2FASetupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="two_factor_modal_overlay">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative text-left">
                        <button
                          onClick={() => setShow2FASetupModal(false)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="text-center space-y-1.5">
                          <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                            <Shield className="h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-200">Set Up 2FA Protection</h3>
                          <p className="text-[11px] text-slate-400">
                            Pair your cryptographic credentials to block unsolicited authentication attempts.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col items-center justify-center bg-slate-950/40 p-3 rounded-xl border border-slate-950">
                            {setup2FAQRCode ? (
                              <img
                                src={setup2FAQRCode}
                                alt="2FA Setup QR Code"
                                className="h-40 w-40 rounded-lg border border-slate-850 p-1 bg-white"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="h-40 w-40 flex items-center justify-center text-slate-500 text-xs">Generating...</div>
                            )}
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-2.5">Or Enter Secret Manually</span>
                            <div className="bg-slate-950 border border-slate-900 rounded-lg p-2 flex items-center justify-between w-full mt-1.5 font-mono text-center">
                              <span className="text-slate-300 text-xs text-center w-full select-all">{setup2FASecret}</span>
                            </div>
                          </div>

                          <form onSubmit={handleVerifyAndEnable2FA} className="space-y-3">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 text-center font-mono">Verify 6-Digit Authenticator Code</label>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="000000"
                                value={setup2FACode}
                                onChange={(e) => setSetup2FACode(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-center text-sm font-mono tracking-widest text-slate-200 focus:outline-hidden"
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={globalLoading}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg text-xs transition-all shadow-md cursor-pointer"
                            >
                              {globalLoading ? 'Verifying...' : 'Enable 2FA Protection'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Side Drawer Column: Live Simulated feeds & Integrations */}
        <div className="w-full lg:w-80 space-y-6 shrink-0 text-left" id="integration_sidebar">
          
          {/* Telegram Simulator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative" id="telegram_simulator_box">
            {/* Box header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6.5 w-6.5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Terminal className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Telegram Bot Sandbox</h4>
                  <p className="text-[9px] text-slate-500">Live API simulation</p>
                </div>
              </div>
              
              <button
                onClick={() => setTelegramSimulatorOpen(!telegramSimulatorOpen)}
                className="text-[10px] bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850 px-2 py-0.5 rounded cursor-pointer"
              >
                {telegramSimulatorOpen ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Quick Simulation Actions Banner */}
            <div className="bg-indigo-950/20 border-b border-slate-800 p-2.5 space-y-1.5 text-center">
              <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Quick Sandbox Joins (Auto Bind)</span>
              <div className="flex gap-1.5 justify-center">
                <button
                  onClick={() => handleSimulateJoin('channel')}
                  className="bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 text-[9px] font-bold py-1 px-2 rounded-md transition-all cursor-pointer"
                >
                  Join Channel
                </button>
                <button
                  onClick={() => handleSimulateJoin('community')}
                  className="bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 text-[9px] font-bold py-1 px-2 rounded-md transition-all cursor-pointer"
                >
                  Join Community
                </button>
              </div>
            </div>

            {telegramSimulatorOpen && (
              <div className="flex flex-col h-72 bg-slate-950/80">
                {/* Chat feed history logs */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 font-mono text-[10px]">
                  {simulatedChatHistory.map((ch, idx) => (
                    <div key={idx} className={`flex flex-col ${ch.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] text-slate-500 mb-0.5">{ch.sender === 'user' ? 'Me (Waitlist)' : 'Telegram Bot'}</span>
                      <div className={`p-2 rounded-lg max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                        ch.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-850 text-slate-300'
                      }`}>
                        {ch.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulated quick commands helper */}
                {user && (
                  <div className="p-1.5 border-t border-slate-900/60 bg-slate-950 flex gap-1 justify-center overflow-x-auto">
                    <button
                      onClick={() => setSimulatorInput('/start')}
                      className="bg-slate-900 hover:bg-slate-850 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono text-slate-400"
                    >
                      /start
                    </button>
                    <button
                      onClick={() => setSimulatorInput(`/verify ${user.username}`)}
                      className="bg-slate-900 hover:bg-slate-850 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono text-slate-400"
                    >
                      /verify username
                    </button>
                    <button
                      onClick={() => setSimulatorInput('/status')}
                      className="bg-slate-900 hover:bg-slate-850 px-1.5 py-0.5 rounded text-[8px] font-bold font-mono text-slate-400"
                    >
                      /status
                    </button>
                  </div>
                )}

                {/* Input form */}
                <form onSubmit={handleSendSimulatorMsg} className="p-2 border-t border-slate-850 bg-slate-950 flex gap-1">
                  <input
                    type="text"
                    placeholder="Type TG command..."
                    value={simulatorInput}
                    onChange={(e) => setSimulatorInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-[10px] font-mono text-slate-200 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Virtual Channel Broadcast Live announcements display */}
          <TelegramFeedView telegramFeed={telegramFeed} />

          {/* Formspree contact assistance module */}
          {settings?.formspreeId && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-3 shadow-sm">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-rose-400" /> Syndicate Inquiry Portal
              </h4>
              <p className="text-[10px] text-slate-500">Submit bugs, waitlist queries, or strategic feedback directly.</p>
              
              <form
                action={`https://formspree.io/f/${settings.formspreeId}`}
                method="POST"
                className="space-y-2.5"
                id="formspree_contact"
              >
                <div>
                  <input
                    type="email"
                    name="_replyto"
                    required
                    placeholder="Your Email..."
                    defaultValue={user?.email || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-200"
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    required
                    rows={2}
                    placeholder="Inquiry or issue details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-200 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 font-bold py-1 px-3 rounded-lg text-[10px] transition-all cursor-pointer"
                >
                  Dispatch Inquiry
                </button>
              </form>
            </div>
          )}

        </div>

      </main>

      {/* Task Creation/Editing Admin Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-left space-y-4 shadow-2xl relative">
            
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-850 rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-400" /> {editingTask ? 'Edit Published Task' : 'Publish Strategic Social Quest'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Publish a dynamic quest that waitlist members can instantly complete.</p>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5" id="admin_task_form">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subscribe on Youtube"
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain exactly what verification requires..."
                  value={taskFormDesc}
                  onChange={(e) => setTaskFormDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Task Type</label>
                  <select
                    value={taskFormType}
                    onChange={(e: any) => setTaskFormType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                  >
                    <option value="social">Social Quest</option>
                    <option value="daily">Daily Mission</option>
                    <option value="telegram">Telegram Verification</option>
                    <option value="twitter">X/Twitter Mission</option>
                    <option value="website">Explore Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reward (Points)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={taskFormPoints}
                    onChange={(e) => setTaskFormPoints(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Navigation/Redirect Link</label>
                <input
                  type="text"
                  placeholder="https://t.me/VeloraAnnouncements"
                  value={taskFormLink}
                  onChange={(e) => setTaskFormLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
                >
                  {editingTask ? 'Apply Changes' : 'Publish Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Footer */}
      <footer className="mt-auto py-6 border-t border-slate-900 bg-slate-950/80 text-center relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <span className="font-medium font-mono text-slate-400/80 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
            <Zap className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> VELORA waitlist node
          </span>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> by Velora Core Developers © 2026.
          </p>
          <div className="flex gap-4 font-bold">
            <a href="#privacy" className="hover:text-slate-300">Privacy</a>
            <a href="#terms" className="hover:text-slate-300">Terms</a>
            <a href="#syndicate" className="hover:text-slate-300">Whitepaper</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
