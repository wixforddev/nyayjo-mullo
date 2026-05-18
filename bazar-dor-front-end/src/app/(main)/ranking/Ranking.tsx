'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle2, TrendingUp, Award, Star } from 'lucide-react';
import { useGetLeaderboardQuery } from '../../../store/api/userApi';

/* ── helpers ─────────────────────────────────────── */
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

function getBadge(total: number) {
  if (total === 0)  return null;
  if (total < 6)    return { label: 'নতুন',           color: 'text-slate-500 bg-slate-100' };
  if (total < 21)   return { label: 'সক্রিয়',         color: 'text-blue-600 bg-blue-50' };
  if (total < 51)   return { label: 'অবদানকারী',      color: 'text-violet-600 bg-violet-50' };
  return             { label: 'শীর্ষ কন্ট্রিবিউটর',  color: 'text-emerald-700 bg-emerald-50' };
}

function verifyRate(total: number, verified: number) {
  if (!total) return 0;
  return Math.round((verified / total) * 100);
}

/* countdown to end of month */
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

function CountdownBlock({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {str.split('').map((digit, i) => (
          <div key={i} className="w-8 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30 shadow-inner">
            <span className="text-xl font-black text-white tabular-nums">{digit}</span>
          </div>
        ))}
      </div>
      <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ── Avatar component ────────────────────────────── */
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className={`${sizes[size]} ${avatarColor(name)} rounded-full flex items-center justify-center font-extrabold text-white shadow-md shrink-0`}>
      {initials(name)}
    </div>
  );
}

/* ── Podium card ─────────────────────────────────── */
function PodiumCard({
  user, rank, onClick,
}: { user: any; rank: 1 | 2 | 3; onClick: () => void }) {
  const isFirst = rank === 1;
  const medal   = rank === 1 ? '👑' : rank === 2 ? '🥈' : '🥉';
  const ringCls = rank === 1
    ? 'ring-4 ring-amber-400 shadow-amber-200'
    : rank === 2
    ? 'ring-4 ring-slate-300 shadow-slate-100'
    : 'ring-4 ring-amber-700/50 shadow-amber-100';
  const scoreCls = rank === 1 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : rank === 2 ? 'text-slate-600 bg-slate-50 border-slate-200'
    : 'text-amber-700 bg-orange-50 border-orange-200';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 active:scale-95 transition-transform ${isFirst ? 'mt-0' : 'mt-6'}`}
    >
      {/* Medal */}
      <span className="text-2xl">{medal}</span>

      {/* Avatar */}
      <div className={`relative rounded-full shadow-lg ${ringCls}`}>
        <Avatar name={user.name} size={isFirst ? 'lg' : 'md'} />
        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border border-slate-100">
          {rank}
        </span>
      </div>

      {/* Name */}
      <p className={`font-extrabold truncate max-w-[80px] text-center leading-tight ${isFirst ? 'text-sm text-[#064E3B]' : 'text-xs text-slate-700'}`}>
        {user.name}
      </p>

      {/* Score */}
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black ${scoreCls}`}>
        <CheckCircle2 className="w-3 h-3" />
        {user.verifiedSubmissions.toLocaleString()}
      </div>

      {/* Submissions */}
      <p className="text-[10px] text-slate-400 font-medium">{user.totalSubmissions} দাম</p>
    </button>
  );
}

/* ── Main component ──────────────────────────────── */
export function Ranking() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [countdown, setCountdown] = useState(getSeasonDiff());
  const { data: leaderboardRes, isLoading } = useGetLeaderboardQuery(undefined);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getSeasonDiff()), 1000);
    return () => clearInterval(id);
  }, []);

  const leaderboard: any[] = Array.isArray(leaderboardRes?.data?.attributes)
    ? leaderboardRes.data.attributes
    : [];

  const top3   = leaderboard.slice(0, 3);
  const rest   = leaderboard.slice(3, 10);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4 animate-pulse pb-20">
        <div className="h-20 bg-slate-100 rounded-3xl" />
        <div className="h-52 bg-slate-100 rounded-3xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-3">

      {/* ── Season banner ── */}
      <div className="bg-gradient-to-br from-[#064E3B] via-[#065f46] to-[#059669] rounded-3xl p-5 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-emerald-300/10 rounded-full blur-xl pointer-events-none" />

        {/* Header row */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">সিজন শেষ হবে</p>
            <p className="text-sm font-semibold text-white/80 mt-0.5">এর মধ্যে দাম সাবমিট করুন</p>
          </div>
          <div className="flex items-center gap-2 bg-white/15 rounded-2xl px-3 py-1.5 border border-white/20">
            <span className="text-lg">🎁</span>
            <div>
              <p className="text-[10px] font-bold text-emerald-200 leading-tight">Top 10 জিতবে</p>
              <p className="text-[10px] font-semibold text-white leading-tight">পুরস্কার</p>
            </div>
          </div>
        </div>

        {/* Countdown blocks */}
        <div className="flex items-center justify-center gap-2 relative z-10">
          <CountdownBlock value={countdown.d} label="দিন" />
          <span className="text-white/50 font-black text-xl mb-4">:</span>
          <CountdownBlock value={countdown.h} label="ঘণ্টা" />
          <span className="text-white/50 font-black text-xl mb-4">:</span>
          <CountdownBlock value={countdown.m} label="মিনিট" />
          <span className="text-white/50 font-black text-xl mb-4">:</span>
          <CountdownBlock value={countdown.s} label="সেকেন্ড" />
        </div>
      </div>

      {/* ── Podium ── */}
      {top3.length >= 3 ? (
        <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm px-4 py-6">
          <div className="flex items-end justify-center gap-6">
            {/* 2nd */}
            <PodiumCard user={top3[1]} rank={2} onClick={() => setSelectedUser({ ...top3[1], rank: 2 })} />
            {/* 1st */}
            <PodiumCard user={top3[0]} rank={1} onClick={() => setSelectedUser({ ...top3[0], rank: 1 })} />
            {/* 3rd */}
            <PodiumCard user={top3[2]} rank={3} onClick={() => setSelectedUser({ ...top3[2], rank: 3 })} />
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">এখনো কোনো র‍্যাংকিং নেই</p>
          <p className="text-sm mt-1">দাম সাবমিট করুন এবং র‍্যাংকিং-এ উঠুন</p>
        </div>
      ) : null}

      {/* ── Rest of the list ── */}
      {rest.length > 0 && (
        <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {rest.map((user: any, i: number) => {
            const rank    = i + 4;
            const badge   = getBadge(user.totalSubmissions);
            const rate    = verifyRate(user.totalSubmissions, user.verifiedSubmissions);
            return (
              <button
                key={user.userId || user.name}
                onClick={() => setSelectedUser({ ...user, rank })}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
              >
                {/* Rank */}
                <span className="w-6 text-center text-sm font-black text-slate-400 shrink-0">{rank}</span>

                {/* Avatar */}
                <Avatar name={user.name} size="sm" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.totalSubmissions} দাম · {rate}% যাচাই</p>
                </div>

                {/* Verified badge */}
                <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-black shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" />
                  {user.verifiedSubmissions}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Keep going banner ── */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-100 shadow-sm px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">চালিয়ে যান!</p>
            <p className="text-[11px] text-slate-400">আরো দাম সাবমিট করুন, পুরস্কার জিতুন</p>
          </div>
        </div>
        <a href="/submit" className="shrink-0 bg-[#064E3B] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#043d2e] transition-colors">
          দাম দিন
        </a>
      </div>

      {/* ══════════════════════════════════════════
          USER PROFILE BOTTOM SHEET
      ══════════════════════════════════════════ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200 pb-20 md:pb-0 md:items-center">
          <div className="absolute inset-0" onClick={() => setSelectedUser(null)} />

          <div className="relative w-full md:max-w-sm bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300">

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Close (desktop) */}
            <button
              onClick={() => setSelectedUser(null)}
              className="hidden md:flex absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ─── Header gradient ─── */}
            <div className="bg-gradient-to-br from-[#064E3B] via-[#065f46] to-[#10B981] px-6 pt-4 pb-8">
              <div className="flex items-center gap-4">
                {/* Large avatar */}
                <div className="relative">
                  <div className={`w-20 h-20 ${avatarColor(selectedUser.name)} rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-xl ring-4 ring-white/30`}>
                    {initials(selectedUser.name)}
                  </div>
                  {/* Rank badge */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-base">
                      {selectedUser.rank === 1 ? '👑' : selectedUser.rank === 2 ? '🥈' : selectedUser.rank === 3 ? '🥉' : `#${selectedUser.rank}`}
                    </span>
                  </div>
                </div>

                {/* Name + rank */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-white truncate">{selectedUser.name}</h2>
                  <p className="text-emerald-300 text-sm font-semibold mt-0.5">র‍্যাংক #{selectedUser.rank}</p>
                  {(() => {
                    const badge = getBadge(selectedUser.totalSubmissions);
                    return badge ? (
                      <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white`}>
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>

            {/* ─── Stats grid ─── */}
            <div className="px-5 -mt-4">
              <div className="bg-white rounded-2xl shadow-md border border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-[#064E3B]">{selectedUser.totalSubmissions}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">মোট দাম</p>
                </div>
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-emerald-600">{selectedUser.verifiedSubmissions}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">যাচাইকৃত</p>
                </div>
                <div className="text-center py-4 px-2">
                  <p className="text-2xl font-black text-blue-600">
                    {verifyRate(selectedUser.totalSubmissions, selectedUser.verifiedSubmissions)}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">নির্ভুলতা</p>
                </div>
              </div>
            </div>

            {/* ─── Info rows ─── */}
            <div className="px-5 py-4 space-y-3">
              {selectedUser.location?.lat && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">অবস্থান</p>
                    <p className="text-sm font-bold text-slate-700">
                      {selectedUser.location.lat.toFixed(4)}, {selectedUser.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">পুরস্কার যোগ্যতা</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedUser.rank <= 10
                      ? `✅ Top ${selectedUser.rank} — পুরস্কারের জন্য যোগ্য!`
                      : 'আরো সাবমিট করুন, Top 10-এ উঠুন'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">সর্বোচ্চ যাচাই স্কোর</p>
                  <p className="text-sm font-bold text-slate-700">
                    {selectedUser.verifiedSubmissions} × ✓ সাবমিশন
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Close button ─── */}
            <div className="px-5 pb-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
