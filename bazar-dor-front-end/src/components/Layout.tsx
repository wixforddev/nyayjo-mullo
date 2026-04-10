'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Calendar, PlusCircle, User, Activity, Home, Map, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const navItems = [
    { icon: Home, label: 'হোম', path: '/' },
    { icon: Map, label: 'ম্যাপ', path: '/heatmap' },
    { icon: PlusCircle, label: 'যোগ করুন', path: '/submit', primary: true },
    { icon: Calendar, label: 'প্ল্যানার', path: '/planner' },
    { icon: User, label: 'প্রোফাইল', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFCFC] relative overflow-hidden pb-24 font-sans">
      {/* Ambient Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]"></div>
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-100/20 blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#10B981]/10 blur-[100px]"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Activity className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-xl text-[#064E3B] tracking-tight">বাজার দর</span>
          </div>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-slate-600 hover:text-[#064E3B] transition-colors active:scale-95"
          >
            <Info className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 px-4">
          {children}
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="glass-pill px-2 py-2 flex items-center gap-1 pointer-events-auto max-w-md w-full justify-between">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="relative -top-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center text-white shadow-[0_8px_32px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform"
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-[#064E3B] bg-emerald-50/50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                )}
              >
                <Icon
                  className={cn("w-5 h-5 mb-1 transition-transform duration-300", isActive && "scale-110")}
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ========================================= */}
      {/* 🛡️ THE DISCLAIMER MODAL (NEW DESIGN) 🛡️ */}
      {/* ========================================= */}

      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">

          <div className="bg-white w-full max-w-[340px] rounded-[32px] p-7 shadow-[0_24px_48px_rgba(0,0,0,0.1)] relative animate-in zoom-in-95 duration-300">

            {/* Top Icon Badge */}
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-5 border-[4px] border-white shadow-sm mx-auto -mt-12">
              🛡️
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-1">আমাদের তথ্যের উৎস</h2>
              <p className="text-sm text-slate-500 font-medium">ব্যবহারকারীদের দেওয়া রিয়েল-টাইম ডাটা</p>
            </div>

            {/* The 3 Bullet Points (Scannable) */}
            <div className="space-y-4 mb-8">

              <div className="flex gap-3 items-start">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600 text-xs font-bold">✓</div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  এই অ্যাপের দামগুলো আপনার মতো সাধারণ ক্রেতাদের দেওয়া তথ্যের ওপর ভিত্তি করে তৈরি।
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 text-xs font-bold">⚠️</div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  দোকান, সময় এবং আপনার দামাদামির দক্ষতার ওপর ভিত্তি করে প্রকৃত দাম কিছুটা ভিন্ন হতে পারে।
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 text-xs font-bold">💡</div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  আমাদের মূল উদ্দেশ্য আপনাকে বাজার দর সম্পর্কে একটি সঠিক ধারণা দেওয়া।
                </p>
              </div>

            </div>

            {/* Acknowledge Button */}
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-[16px] active:scale-95 transition-all duration-300 shadow-md"
            >
              বুঝতে পেরেছি
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
