import React from 'react';
import { Users } from 'lucide-react';
import { User } from '../types';

interface PresetAvatar {
  id: string;
  name: string;
  emoji: string;
  bg: string;
}

const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'avatar_1', name: 'Emerald Cipher', emoji: '👽', bg: 'bg-emerald-950 border-emerald-500 text-emerald-400' },
  { id: 'avatar_2', name: 'Cyber Samurai', emoji: '⚔️', bg: 'bg-rose-950 border-rose-500 text-rose-400' },
  { id: 'avatar_3', name: 'Crypto Wizard', emoji: '🧙‍♂️', bg: 'bg-violet-950 border-violet-500 text-violet-400' },
  { id: 'avatar_4', name: 'Web3 Goddess', emoji: '👩‍🎤', bg: 'bg-sky-950 border-sky-500 text-sky-400' },
  { id: 'avatar_5', name: 'Alpha Chad', emoji: '🦁', bg: 'bg-amber-950 border-amber-500 text-amber-400' },
  { id: 'avatar_6', name: 'Vortex Nomade', emoji: '🌌', bg: 'bg-indigo-950 border-indigo-500 text-indigo-400' },
  { id: 'avatar_admin', name: 'Velora Architect', emoji: '👑', bg: 'bg-slate-950 border-slate-400 text-slate-100' },
];

interface LeaderboardViewProps {
  leaderboard: User[];
  user: User;
  userRank: number;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = React.memo(({ leaderboard, user, userRank }) => {
  const currentAvatar = PRESET_AVATARS.find(a => a.id === user?.avatar);

  return (
    <div className="space-y-6" id="tab_leaderboard_view">
      
      {/* Personal stats overview float */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-rose-950 border border-indigo-500/20 rounded-2xl p-5 text-left flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-indigo-500/5">
        <div className="flex gap-3.5 items-center">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg border-2 ${
            currentAvatar?.bg || 'bg-slate-900 border-slate-700'
          }`}>
            {currentAvatar?.emoji || '👤'}
          </div>
          <div className="text-left">
            <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Your Position</span>
            <h4 className="text-sm font-black text-slate-200">@{user?.username} <span className="text-xs text-slate-400 font-mono">({user?.email})</span></h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Points: <span className="font-bold text-indigo-300">{user?.points}</span> | Referrals: <span className="font-bold text-rose-300">{user?.referralsCount}</span></p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-indigo-500/20 px-5 py-2.5 rounded-xl text-center shrink-0">
          <span className="block text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-0.5 font-mono">Current waitlist rank</span>
          <span className="text-2xl font-black text-indigo-400">#{userRank}</span>
        </div>
      </div>

      {/* Leaderboard database listings table */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-indigo-400" /> Active Global Waitlist Rankings
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Refer active users, claim daily check-ins, and secure credentials to secure high ranks. Top 10 members gain elite developer honors and premium launch priorities.
        </p>

        <div className="overflow-x-auto" id="leaderboard_table_container">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-2">Rank</th>
                <th className="py-3 px-3">Pioneer</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Syndicates</th>
                <th className="py-3 px-3">Acquired Badges</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Waitlist rankings calculating...</td>
                </tr>
              ) : (
                leaderboard.map((u, i) => {
                  const rank = i + 1;
                  const isSelf = user?.username === u.username;
                  const avatarPreset = PRESET_AVATARS.find(pa => pa.id === u.avatar);

                  return (
                    <tr
                      key={u.id}
                      className={`transition-all ${
                        isSelf ? 'bg-indigo-500/5 font-semibold text-white' : 'hover:bg-slate-900/30'
                      }`}
                    >
                      <td className="py-3 px-2 font-mono">
                        {rank === 1 ? (
                          <span className="text-base">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-base">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-base">🥉</span>
                        ) : (
                          <span className="font-bold text-slate-400">#{rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-6.5 w-6.5 rounded-md flex items-center justify-center text-xs border ${
                            avatarPreset?.bg || 'bg-slate-800 text-slate-400'
                          }`}>
                            {avatarPreset?.emoji || '👤'}
                          </div>
                          <div>
                            <span className="block font-bold">@{u.username}</span>
                            {u.role === 'admin' && (
                              <span className="inline-block text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded uppercase font-bold font-mono">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold font-mono text-indigo-300">
                        {u.points}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {u.referralsCount}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.badges && u.badges.slice(0, 2).map((bgName: string) => (
                            <span
                              key={bgName}
                              className="text-[8px] bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.2 rounded font-mono"
                            >
                              {bgName}
                            </span>
                          ))}
                          {u.badges && u.badges.length > 2 && (
                            <span className="text-[8px] text-slate-500 font-mono">+{u.badges.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {u.verified ? (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                            Candidate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

LeaderboardView.displayName = 'LeaderboardView';
