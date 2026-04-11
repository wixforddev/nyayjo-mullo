'use client';

import React, { useState } from 'react';
import { Shield, MapPin, Calendar, CheckCircle2, TrendingUp, Bell, ChevronRight, LogOut, Settings, Phone, X, Medal } from 'lucide-react';
import Link from 'next/link';
import { Leaderboard } from './Leaderboard';

export function Profile() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="glass-card p-6 text-center">
        <h1 className="text-2xl font-bold text-[#064E3B] mb-2">আমার প্রোফাইল</h1>
        <p className="text-sm text-slate-500">আপনার আর্থিক ও অবদান পোর্টফোলিও</p>
      </div>

      {/* Hero + Budget — side by side on desktop */}
      <div className="flex flex-col lg:flex-row gap-4">

      {/* Hero Savings Bento Card */}
      <div className="glass-card p-6 md:p-8 relative overflow-hidden flex-1">
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-[#064E3B] text-xl font-bold border-2 border-white shadow-sm overflow-hidden">
            <img src="https://i.pravatar.cc/150?u=ahmed" alt="আহমেদ ফয়সাল" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#064E3B] mb-1">আহমেদ ফয়সাল</h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#10B981] text-[11px] px-2.5 py-1 rounded-full font-bold border border-emerald-100/50 shadow-sm">
              <MapPin className="w-3 h-3" strokeWidth={2.5} /> মিরপুর ক্যাপ্টেন
            </span>
          </div>
        </div>

        <div className="bg-[#10B981]/5 border border-[#10B981]/15 rounded-[16px] py-4 px-5 mt-6 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute -top-5 -left-5 w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] z-0"></div>
          <div className="flex items-center gap-1.5 relative z-10">
            <p className="text-[13px] text-slate-500 font-medium m-0">এই মাসে আপনি সাশ্রয় করেছেন</p>
          </div>
          <p className="font-sans text-[32px] font-[800] text-[#064E3B] tracking-[-1px] m-0 leading-none relative z-10">
            ৳ ৮৪০
          </p>
          <div className="inline-flex items-center gap-1 bg-[#10B981]/10 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit mt-1 relative z-10">
            <TrendingUp className="w-3 h-3" strokeWidth={2.5} /> গত মাসের চেয়ে ১২% বেশি
          </div>
        </div>
      </div>

      {/* Household Budget Tracker Card */}
      <div className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 lg:mt-0 mt-0 lg:w-80 lg:shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-emerald-900">📊 মাসিক বাজার বাজেট</h3>
          <button
            onClick={() => setShowAddExpense(true)}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-medium transition-colors active:scale-95"
          >
            + খরচ যোগ করুন
          </button>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-600 tracking-tight font-num">৳ ১২,৫০০</span>
          <span className="text-base font-medium text-slate-400 font-num">/ ৳১৫,০০০</span>
        </div>

        <div className="mt-4">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '83%' }}></div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          {83 > 100 ? (
            <p className="text-xs font-medium text-emerald-600">✅ আপনি বাজেটের ভেতরেই আছেন</p>
          ) : (
            <p className="text-xs font-medium text-rose-500">⚠️ গত মাসের চেয়ে ১২% বেশি খরচ হয়েছে</p>
          )}
        </div>
      </div>
      </div>{/* end hero+budget flex row */}

      {/* Contribution Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="glass-card p-5 flex flex-col justify-between">
          <h3 className="text-[14px] text-slate-500 font-semibold text-center mb-4">তথ্য সঠিকতা</h3>
          <div className="relative w-[90px] h-[90px] mx-auto">
            <svg viewBox="0 0 36 36" className="block mx-auto max-w-full max-h-[250px]">
              <path className="fill-none stroke-slate-100" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="fill-none stroke-[#10B981]" strokeWidth="3" strokeLinecap="round" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[24px] font-[800] text-[#0F172A]">
              92<span className="text-sm">%</span>
            </div>
          </div>
          <div className="mt-4 text-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-full w-fit mx-auto border border-emerald-100/50">
            🌟 বিশ্বস্ত কন্ট্রিবিউটর
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col justify-between">
          <h3 className="text-[14px] text-slate-500 font-semibold text-center mb-4">মোট অবদান</h3>
          <div className="flex flex-col justify-center flex-1">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <div className="text-base">🏷️</div>
                <span className="text-[13px] text-slate-600 font-medium">নতুন দাম</span>
              </div>
              <span className="font-sans text-[18px] font-bold text-[#064E3B]">45</span>
            </div>
            <div className="h-[1px] bg-slate-900/5 my-1"></div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <div className="text-base">✅</div>
                <span className="text-[13px] text-slate-600 font-medium">ভোট দিয়েছেন</span>
              </div>
              <span className="font-sans text-[18px] font-bold text-[#064E3B]">60</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard CTA */}
      <button
        onClick={() => setShowLeaderboard(true)}
        className="glass-card p-5 flex items-center justify-between w-full hover:scale-[0.98] hover:bg-white/40 transition-all duration-300 active:scale-[0.96] group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981] border border-emerald-100/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Medal className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-[#064E3B]">শীর্ষ অবদানকারী</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">আপনার বর্তমান র্যাংক: <span className="font-num font-bold">৪৫</span></p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
      </button>

      {/* Settings & Toggles Bento */}
      <div className="glass-card overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-black/[0.05]">
          <div>
            <p className="text-base font-bold text-[#064E3B]">এলাকা নোটিফিকেশন</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">মিরপুর ৬</p>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
              notificationsEnabled ? 'bg-[#064E3B]' : 'bg-slate-200'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <Link href="/settings" className="flex items-center justify-between p-5 hover:bg-white/40 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Settings className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-[#064E3B]">অ্যাকাউন্ট সেটিংস</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <button className="flex items-center justify-between p-5 hover:bg-rose-50/50 transition-colors border-t border-black/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <LogOut className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-rose-600">লগ আউট</p>
          </div>
        </button>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full h-[90vh] sm:h-[85vh] sm:max-w-md bg-[#F8FAFC] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col relative">
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          </div>
        </div>
      )}

      {/* Add Expense Bottom Sheet */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowAddExpense(false)}></div>
          <div className="w-full bg-[#FAFCFC] rounded-t-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 pb-8">
            <div className="w-full flex justify-center pt-4 pb-4 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            <div className="px-6 flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-900">নতুন খরচ যোগ করুন</h2>
                <button onClick={() => setShowAddExpense(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <label className="text-xs font-medium text-slate-500 mb-1 block">পরিমাণ (৳)</label>
                <input type="number" placeholder="0" className="w-full text-3xl font-black text-emerald-600 bg-transparent outline-none font-num placeholder:text-slate-200" autoFocus />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <label className="text-xs font-medium text-slate-500 mb-1 block">বিবরণ</label>
                <input type="text" placeholder="যেমন: চাল ও ডাল" className="w-full text-base font-medium text-slate-700 bg-transparent outline-none placeholder:text-slate-300" />
              </div>
              <button onClick={() => setShowAddExpense(false)} className="w-full bg-[#064E3B] hover:bg-[#043d2e] text-white rounded-[20px] py-4 font-bold text-base transition-colors shadow-md mt-4 active:scale-[0.98]">
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
