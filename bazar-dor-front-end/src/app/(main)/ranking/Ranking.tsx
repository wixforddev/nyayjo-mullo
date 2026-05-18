'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, X, MapPin, CheckCircle2, TrendingUp, Award, Star, Info } from 'lucide-react';
import { useGetLeaderboardQuery } from '../../../store/api/userApi';

/* ── Avatar color ─────────────────────────────── */
const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500',   'bg-teal-500', 'bg-pink-500',   'bg-indigo-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/* ── Helpers ──────────────────────────────────── */
function getBadge(total: number) {
  if (total === 0)  return null;
  if (total < 6)    return { label: 'নতুন',          color: 'text-slate-500 bg-slate-100' };
  if (total < 21)   return { label: 'সক্রিয়',        color: 'text-blue-600 bg-blue-50' };
  if (total < 51)   return { label: 'অবদানকারী',     color: 'text-violet-600 bg-violet-50' };
  return             { label: 'শীর্ষ কন্ট্রিবিউটর', color: 'text-emerald-700 bg-emerald-50' };
}
function verifyRate(total: number, verified: number) {
  return total ? Math.round((verified / total) * 100) : 0;
}
function memberDays(memberSince: string) {
  if (!memberSince) return 0;
  return Math.max(1, Math.floor((Date.now() - new Date(memberSince).getTime()) / 86400000));
}
function getSeasonDiff() {
  const now  = new Date();
  const end  = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = Math.max(0, end.getTime() - now.getTime());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}
function pad(n: number) { return String(n).padStart(2, '0'); }

/* ── Avatar ───────────────────────────────────── */
function Avatar({ name, size = 'md', ring }: { name: string; size?: 'sm'|'md'|'lg'; ring?: string }) {
  const sz = { sm: 'w-10 h-10 text-sm', md: 'w-14 h-14 text-base', lg: 'w-[72px] h-[72px] text-xl' };
  return (
    <div className={`${sz[size]} ${avatarColor(name)} rounded-full flex items-center justify-center font-extrabold text-white shrink-0 ${ring ? `ring-[3px] ${ring} ring-offset-2` : ''}`}>
      {initials(name)}
    </div>
  );
}

/* ── Main ─────────────────────────────────────── */
export function Ranking() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [cd, setCd] = useState(getSeasonDiff());
  const { data: leaderboardRes, isLoading } = useGetLeaderboardQuery(undefined);

  useEffect(() => {
    const id = setInterval(() => setCd(getSeasonDiff()), 1000);
    return () => clearInterval(id);
  }, []);

  const leaderboard: any[] = Array.isArray(leaderboardRes?.data?.attributes)
    ? leaderboardRes.data.attributes : [];
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3, 10);

  /* ── Skeleton ── */
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse pb-20">
        <div className="h-20 bg-slate-100 rounded-3xl" />
        <div className="h-56 bg-slate-100 rounded-3xl" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Ranking</h1>
            <p className="text-xs text-slate-400">Price champions of today ✨</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center">
          <Info className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* ── Season countdown banner ── */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl px-5 py-4 flex items-center justify-between shadow-lg shadow-indigo-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
        {/* Left: countdown */}
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 border border-white rounded-full" />
            </div>
            <p className="text-white/80 text-xs font-semibold">Season ends in</p>
          </div>
          <div className="flex items-center gap-1 font-black text-white text-lg tracking-wide">
            <span>{pad(cd.d)}d</span>
            <span className="text-white/50 mx-0.5">:</span>
            <span>{pad(cd.h)}h</span>
            <span className="text-white/50 mx-0.5">:</span>
            <span>{pad(cd.m)}m</span>
            <span className="text-white/50 mx-0.5">:</span>
            <span>{pad(cd.s)}s</span>
          </div>
        </div>
        {/* Right: reward */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="text-4xl drop-shadow-md">🎁</span>
          <div>
            <p className="text-white text-[11px] font-bold leading-tight">Top 10 win</p>
            <p className="text-white/80 text-[11px] font-semibold leading-tight">Premium Rewards</p>
          </div>
        </div>
      </div>

      {/* ── Podium ── */}
      {top3.length >= 3 && (
        <div className="bg-gradient-to-b from-slate-100 to-slate-50 rounded-3xl pt-6 pb-5 px-4 border border-slate-200/60">
          <div className="flex items-end justify-center gap-3">

            {/* 2nd place */}
            <PodiumCard user={top3[1]} rank={2} onPress={() => setSelectedUser({ ...top3[1], rank: 2 })} />

            {/* 1st place — taller */}
            <PodiumCard user={top3[0]} rank={1} onPress={() => setSelectedUser({ ...top3[0], rank: 1 })} />

            {/* 3rd place */}
            <PodiumCard user={top3[2]} rank={3} onPress={() => setSelectedUser({ ...top3[2], rank: 3 })} />
          </div>
        </div>
      )}

      {leaderboard.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">এখনো কোনো র‍্যাংকিং নেই</p>
        </div>
      )}

      {/* ── List #4-10 ── */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((user: any, i: number) => {
            const rank = i + 4;
            return (
              <button key={user.userId || user.name}
                onClick={() => setSelectedUser({ ...user, rank })}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left">
                <span className="w-5 text-sm font-black text-slate-300 shrink-0 text-center">{rank}</span>
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{memberDays(user.memberSince)} days streak</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full text-xs font-black shrink-0">
                  <span className="text-base leading-none">⭐</span>
                  {(user.verifiedSubmissions * 100 + user.totalSubmissions * 20).toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Keep going banner ── */}
      <div className="bg-indigo-50 rounded-3xl border border-indigo-100 px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Keep going!</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">Check more prices, stay ahead<br />and win amazing rewards.</p>
          </div>
        </div>
        <a href="/submit"
          className="shrink-0 flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
          <Award className="w-3.5 h-3.5" />
          View Rewards
        </a>
      </div>

      {/* ── Profile sheet ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200 pb-20 md:pb-0 md:items-center">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full md:max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300">
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <button onClick={() => setSelectedUser(null)}
              className="hidden md:flex absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full items-center justify-center z-10">
              <X className="w-4 h-4 text-slate-500" />
            </button>
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-6 pt-4 pb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`w-20 h-20 ${avatarColor(selectedUser.name)} rounded-full flex items-center justify-center text-2xl font-extrabold text-white ring-4 ring-white/30 shadow-xl`}>
                    {initials(selectedUser.name)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md text-base">
                    {selectedUser.rank === 1 ? '👑' : selectedUser.rank === 2 ? '🥈' : selectedUser.rank === 3 ? '🥉' : `#${selectedUser.rank}`}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-white truncate">{selectedUser.name}</h2>
                  <p className="text-indigo-200 text-sm font-semibold mt-0.5">র‍্যাংক #{selectedUser.rank}</p>
                  {(() => { const b = getBadge(selectedUser.totalSubmissions); return b ? (
                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{b.label}</span>
                  ) : null; })()}
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="px-5 -mt-4">
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-slate-800">{selectedUser.totalSubmissions}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">মোট দাম</p>
                </div>
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-emerald-600">{selectedUser.verifiedSubmissions}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">যাচাইকৃত</p>
                </div>
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-indigo-600">{verifyRate(selectedUser.totalSubmissions, selectedUser.verifiedSubmissions)}%</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">নির্ভুলতা</p>
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="px-5 py-4 space-y-2.5">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">পুরস্কার যোগ্যতা</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedUser.rank <= 10 ? `✅ Top ${selectedUser.rank} — পুরস্কারের জন্য যোগ্য!` : 'Top 10-এ উঠুন'}
                  </p>
                </div>
              </div>
              {selectedUser.location?.lat && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">অবস্থান</p>
                    <p className="text-sm font-bold text-slate-700">{selectedUser.location.lat.toFixed(3)}, {selectedUser.location.lng.toFixed(3)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-6">
              <button onClick={() => setSelectedUser(null)}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Podium Card ──────────────────────────────── */
function PodiumCard({ user, rank, onPress }: { user: any; rank: 1|2|3; onPress: () => void }) {
  const isFirst = rank === 1;

  const cardBg   = isFirst ? 'bg-amber-50 border-amber-200'   : rank === 2 ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200';
  const ring     = isFirst ? 'ring-amber-400'  : rank === 2 ? 'ring-slate-300' : 'ring-orange-300';
  const medal    = isFirst ? '👑'              : rank === 2 ? '🥈'             : '🥉';
  const badgeBg  = isFirst ? 'bg-amber-100 text-amber-700 border-amber-200'
                 : rank === 2 ? 'bg-blue-100 text-blue-700 border-blue-200'
                 : 'bg-orange-100 text-orange-700 border-orange-200';
  const nameColor = isFirst ? 'text-amber-700' : 'text-slate-700';
  const streakColor = isFirst ? 'text-amber-500 font-semibold' : 'text-slate-400';
  const score    = (user.verifiedSubmissions * 100 + user.totalSubmissions * 20).toLocaleString();

  return (
    <button
      onClick={onPress}
      className={`flex flex-col items-center gap-2 rounded-3xl border px-3 py-4 active:scale-95 transition-all ${cardBg} ${isFirst ? 'pb-5 pt-3 flex-1' : 'flex-[0.85]'}`}
    >
      {/* Medal / rank badge */}
      {isFirst ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs font-black text-amber-500 bg-amber-100 w-6 h-6 rounded-full flex items-center justify-center border border-amber-200">1</span>
          <span className="text-2xl">👑</span>
        </div>
      ) : (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${rank === 2 ? 'bg-slate-200 text-slate-600' : 'bg-orange-200 text-orange-700'}`}>
          {rank}
        </div>
      )}

      {/* Avatar */}
      <div className={`rounded-full p-[3px] ${isFirst ? 'bg-gradient-to-br from-amber-300 to-yellow-400' : rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' : 'bg-gradient-to-br from-orange-300 to-amber-400'}`}>
        <div className={`${isFirst ? 'w-16 h-16' : 'w-12 h-12'} ${avatarColor(user.name)} rounded-full flex items-center justify-center ${isFirst ? 'text-xl' : 'text-sm'} font-extrabold text-white bg-white`}>
          <span className={`${avatarColor(user.name)} w-full h-full rounded-full flex items-center justify-center font-extrabold text-white`}>
            {initials(user.name)}
          </span>
        </div>
      </div>

      {/* Name */}
      <p className={`font-extrabold text-xs truncate max-w-[80px] text-center ${nameColor}`}>{user.name}</p>

      {/* Streak */}
      <p className={`text-[10px] ${streakColor}`}>{memberDays(user.memberSince)} days streak</p>

      {/* Score */}
      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-black ${badgeBg}`}>
        <span className="text-sm">⭐</span>
        {score}
      </div>
    </button>
  );
}
