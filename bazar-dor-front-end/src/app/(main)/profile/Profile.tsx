'use client';

import React, { useState } from 'react';
import { Shield, Bell, ChevronRight, LogOut, Settings, X, Medal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaderboard } from './Leaderboard';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { useGetMyStatsQuery, useGetLeaderboardQuery } from '../../../store/api/userApi';

export function Profile() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const user = useAppSelector(s => s.auth.user);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  const { data: statsRes, isLoading: loadingStats } = useGetMyStatsQuery(undefined, { skip: !isAuthenticated });
  const { data: leaderboardRes } = useGetLeaderboardQuery(undefined, { skip: !showLeaderboard });

  const stats = statsRes?.data?.attributes || {};
  const leaderboard = leaderboardRes?.data?.attributes || [];
  const recentPrices = stats.recentPrices || [];

  const handleLogout = () => {
    dispatch(logout());
    setShowLogoutConfirm(false);
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">👤</div>
        <h2 className="text-xl font-bold text-slate-800">প্রোফাইল দেখতে লগইন করুন</h2>
        <div className="flex gap-3">
          <Link href="/login" className="bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold">লগইন করুন</Link>
          <Link href="/register" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">রেজিস্ট্রেশন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* Hero Card */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-[#064E3B] text-2xl font-bold border-2 border-white shadow-sm">
            {user?.fullName?.[0] || '👤'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#064E3B] mb-1">{user?.fullName || 'ব্যবহারকারী'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#10B981] text-[11px] px-2.5 py-1 rounded-full font-bold border border-emerald-100/50 shadow-sm mt-1">
              <Shield className="w-3 h-3" strokeWidth={2.5} /> {user?.role === 'admin' ? 'অ্যাডমিন' : user?.role === 'vendor' ? 'ভেন্ডর' : 'ব্যবহারকারী'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-[#064E3B]">{loadingStats ? '—' : (stats.totalSubmissions || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">মোট সাবমিশন</p>
          </div>
          <div className="bg-blue-50/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-700">{loadingStats ? '—' : (stats.verifiedSubmissions || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">ভেরিফাইড</p>
          </div>
          <div className="bg-amber-50/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-amber-700">
              {loadingStats ? '—' : stats.totalSubmissions > 0 ? Math.round((stats.verifiedSubmissions / stats.totalSubmissions) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-1">নির্ভুলতা</p>
          </div>
          <div className="bg-rose-50/60 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-rose-700">৳০</p>
            <p className="text-xs text-slate-500 mt-1">সাশ্রয়</p>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      {recentPrices.length > 0 && (
        <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50">
          <h3 className="text-sm font-bold text-slate-700 mb-4">সাম্প্রতিক সাবমিশন</h3>
          <div className="space-y-3">
            {recentPrices.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.productId?.icon || '🛒'}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{p.productId?.nameBn || p.productId?.name}</p>
                    <p className="text-xs text-slate-400">{p.bazarId?.nameBn || p.bazarId?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#064E3B]">৳ {p.price}</p>
                  {p.isVerified && <span className="text-[10px] text-emerald-600 font-bold">✓ ভেরিফাইড</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Button */}
      <button onClick={() => setShowLeaderboard(true)}
        className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="font-bold text-slate-700">লিডারবোর্ড</p>
            <p className="text-xs text-slate-400">শীর্ষ অবদানকারীদের তালিকা</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </button>

      {/* Account Actions */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 overflow-hidden">
        <Link href="/settings" className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><Settings className="w-4 h-4 text-slate-500" /></div>
            <span className="font-semibold text-slate-700">সেটিংস</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>

        <Link href="/alerts" className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 rounded-full flex items-center justify-center"><Bell className="w-4 h-4 text-rose-500" /></div>
            <span className="font-semibold text-slate-700">এলার্ট</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </Link>

        <div className="flex items-center justify-between p-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center"><Bell className="w-4 h-4 text-blue-500" /></div>
            <span className="font-semibold text-slate-700">নোটিফিকেশন</span>
          </div>
          <button onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
          </button>
        </div>

        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 p-4 hover:bg-rose-50 transition text-left">
          <div className="w-9 h-9 bg-rose-50 rounded-full flex items-center justify-center"><LogOut className="w-4 h-4 text-rose-500" /></div>
          <span className="font-semibold text-rose-600">লগআউট</span>
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowLeaderboard(false)}></div>
          <div className="w-full lg:max-w-lg max-h-[85vh] bg-[#FAFCFC] rounded-t-[32px] lg:rounded-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">🏆 লিডারবোর্ড</h2>
              <button onClick={() => setShowLeaderboard(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {(Array.isArray(leaderboard) ? leaderboard : []).map((u: any, i: number) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-slate-50'}`}>
                  <span className="text-lg font-black w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">{u.name || 'ব্যবহারকারী'}</p>
                    <p className="text-xs text-slate-400">{u.totalSubmissions} সাবমিশন · {u.verifiedSubmissions} ভেরিফাইড</p>
                  </div>
                  <Medal className="w-4 h-4 text-amber-400" />
                </div>
              ))}
              {(!leaderboard || leaderboard.length === 0) && (
                <p className="text-center text-slate-400 py-8">এখনো কোনো ডেটা নেই</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-xl">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">লগআউট করবেন?</h3>
            <p className="text-sm text-slate-500 mb-6">আপনার অ্যাকাউন্ট থেকে বের হতে চান?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">বাতিল</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">লগআউট</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
