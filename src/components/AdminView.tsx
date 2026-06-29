import React, { useState, useEffect } from 'react';
import { Settings, MessageSquare, ListChecks, Plus, TrendingUp, Terminal } from 'lucide-react';
import { SignupChart } from './SignupChart.tsx';
import { AuditLogsView } from './AuditLogsView.tsx';
import { User, Task, SystemSettings } from '../types.ts';

interface AdminViewProps {
  user: User;
  analytics: {
    stats: {
      totalUsers: number;
      activeUsers: number;
      waitlistCount: number;
      telegramConversions: number;
      referralConversions: number;
    };
    signupsOverTime: any[];
    auditLogs: any[];
    userSummary: any[];
    sentEmails: any[];
  } | null;
  tasks: Task[];
  token: string | null;
  settings: SystemSettings | null;
  setSettings: (settings: SystemSettings) => void;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  fetchAdminAnalytics: () => void;
  fetchTelegramFeed: () => void;
  handleOpenCreateTask: () => void;
  handleOpenEditTask: (task: Task) => void;
  handleDeleteTask: (id: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = React.memo(({
  user,
  analytics,
  tasks,
  token,
  settings,
  setSettings,
  showSuccess,
  showError,
  fetchAdminAnalytics,
  fetchTelegramFeed,
  handleOpenCreateTask,
  handleOpenEditTask,
  handleDeleteTask
}) => {
  // Admin settings inputs (localized state to prevent outer app re-renders on keystroke)
  const [adminAppName, setAdminAppName] = useState('');
  const [adminChannelLink, setAdminChannelLink] = useState('');
  const [adminGroupLink, setAdminGroupLink] = useState('');
  const [adminBotUsername, setAdminBotUsername] = useState('');
  const [adminFormspree, setAdminFormspree] = useState('');
  const [adminLaunchDate, setAdminLaunchDate] = useState('');
  const [adminMultiplier, setAdminMultiplier] = useState(1.0);
  const [adminMaintenance, setAdminMaintenance] = useState(false);

  // Admin Broadcast form (localized state)
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Prepopulate settings when loaded
  useEffect(() => {
    if (settings) {
      setAdminAppName(settings.appName || '');
      setAdminChannelLink(settings.telegramChannelLink || '');
      setAdminGroupLink(settings.telegramGroupLink || '');
      setAdminBotUsername(settings.telegramBotUsername || '');
      setAdminFormspree(settings.formspreeId || '');
      setAdminLaunchDate(settings.launchDate || '');
      setAdminMultiplier(settings.pointMultiplier || 1.0);
      setAdminMaintenance(settings.maintenanceMode || false);
    }
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appName: adminAppName,
          telegramChannelLink: adminChannelLink,
          telegramGroupLink: adminGroupLink,
          telegramBotUsername: adminBotUsername,
          formspreeId: adminFormspree,
          launchDate: adminLaunchDate,
          pointMultiplier: adminMultiplier,
          maintenanceMode: adminMaintenance
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        showSuccess("Ecosystem settings updated successfully!");
        fetchAdminAnalytics();
      } else {
        showError(data.error || "Failed to update settings.");
      }
    } catch (err) {
      showError("Error applying settings.");
    }
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showError("Please specify a title and message body for broadcast.");
      return;
    }

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
      });

      if (res.ok) {
        showSuccess("Broadcast successfully pushed to all waitlist members!");
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchAdminAnalytics();
        fetchTelegramFeed();
      } else {
        showError("Broadcast failed to send.");
      }
    } catch (err) {
      showError("Server broadcast error.");
    }
  };

  return (
    <div className="space-y-6" id="tab_admin_view">
      
      {/* Dynamic Analytics Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="admin_stats">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mb-1">Total Users</span>
          <p className="text-2xl font-black text-white">{analytics?.stats.totalUsers ?? '-'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mb-1">Active Pioneers</span>
          <p className="text-2xl font-black text-indigo-400">{analytics?.stats.activeUsers ?? '-'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mb-1">Waitlist Count</span>
          <p className="text-2xl font-black text-rose-400">{analytics?.stats.waitlistCount ?? '-'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mb-1">TG Conversions</span>
          <p className="text-2xl font-black text-sky-400">{analytics?.stats.telegramConversions ?? '-'}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left">
          <span className="block text-[9px] uppercase font-bold text-slate-400 font-mono mb-1">Ref Conversions</span>
          <p className="text-2xl font-black text-amber-400">{analytics?.stats.referralConversions ?? '-'}</p>
        </div>
      </div>

      {/* Dynamic SVG Charts + Audit Log Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Beautiful SVG Registration Chart */}
        <SignupChart signupsOverTime={analytics?.signupsOverTime} />

        {/* System Audit Logs list */}
        <AuditLogsView auditLogs={analytics?.auditLogs} />

      </div>

      {/* Tasks Management Grid (Table with creation trigger) */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left" id="tasks_manager">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-emerald-400" /> Active Waitlist Tasks Manager
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Launch, alter, or permanently terminate waitlist social tasks directly.</p>
          </div>

          <button
            onClick={handleOpenCreateTask}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Publish Task
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-300">
            <thead>
              <tr className="uppercase text-[9px] text-slate-500 font-mono font-bold border-b border-slate-800">
                <th className="py-2.5">Task Title</th>
                <th className="py-2.5">Type</th>
                <th className="py-2.5">Reward</th>
                <th className="py-2.5">Navigation link</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {tasks.map(tsk => (
                <tr key={tsk.id} className="hover:bg-slate-950/20">
                  <td className="py-2.5 font-bold text-slate-200">{tsk.title}</td>
                  <td className="py-2.5 font-mono text-slate-400">{tsk.type.toUpperCase()}</td>
                  <td className="py-2.5 font-bold font-mono text-amber-400">+{tsk.points} pts</td>
                  <td className="py-2.5 max-w-xs truncate font-mono text-slate-500" title={tsk.link}>{tsk.link}</td>
                  <td className="py-2.5 text-right space-x-1.5">
                    <button
                      onClick={() => handleOpenEditTask(tsk)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(tsk.id)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row forms: Global Settings + Broadcast controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Editable global properties panel */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left" id="global_properties_panel">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-indigo-400" /> Editable System Parameters
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4" id="settings_form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ecosystem Name</label>
                <input
                  type="text"
                  value={adminAppName}
                  onChange={(e) => setAdminAppName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Telegram Bot Username</label>
                <input
                  type="text"
                  value={adminBotUsername}
                  onChange={(e) => setAdminBotUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Telegram Channel link</label>
                <input
                  type="text"
                  value={adminChannelLink}
                  onChange={(e) => setAdminChannelLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Telegram Chat Group link</label>
                <input
                  type="text"
                  value={adminGroupLink}
                  onChange={(e) => setAdminGroupLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Formspree ID</label>
                <input
                  type="text"
                  value={adminFormspree}
                  onChange={(e) => setAdminFormspree(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Launch date target</label>
                <input
                  type="date"
                  value={adminLaunchDate}
                  onChange={(e) => setAdminLaunchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Maintenance Mode</span>
                <input
                  type="checkbox"
                  checked={adminMaintenance}
                  onChange={(e) => setAdminMaintenance(e.target.checked)}
                  className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
              <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Score Multiplier: {adminMultiplier}x</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.5"
                  value={adminMultiplier}
                  onChange={(e) => setAdminMultiplier(Number(e.target.value))}
                  className="w-20 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-850">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Announcement broadcast panel */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl text-left" id="global_announcer">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-purple-400" /> Syndicate Broadcaster Node
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 leading-normal">
            Push live updates to all Waitlist members. Broadcasts generate an immediate in-app notification + simulated Telegram feed post.
          </p>

          <form onSubmit={handleBroadcastAnnouncement} className="space-y-4" id="broadcast_form">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Broadcast Title</label>
              <input
                type="text"
                placeholder="e.g. Phase 2 Smart Contracts Verified!"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Message content</label>
              <textarea
                rows={3}
                placeholder="Provide details about waitlist priority, multipliers, or releases..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Disseminate Broadcast
            </button>
          </form>
        </div>

      </div>

    </div>
  );
});

AdminView.displayName = 'AdminView';
export default AdminView;
