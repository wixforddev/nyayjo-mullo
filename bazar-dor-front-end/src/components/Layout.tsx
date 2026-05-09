'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, PlusCircle, User, Home, Map, Info, ShieldCheck, LogIn, Bell } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { locationRequested, locationResolved, locationFailed } from '../store/slices/locationSlice';
import { useUpdateProfileMutation } from '../store/api/userApi';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.role === 'admin';
  const dispatch = useAppDispatch();

  // ── Location state ──
  const resolvedLocation = useAppSelector(s => s.location.location);
  const patchedRef       = useRef<string | null>(null);
  const [updateProfile]  = useUpdateProfileMutation();

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    dispatch(locationRequested());
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        dispatch(locationResolved(loc));
        localStorage.setItem('userLocation', JSON.stringify(loc));
      },
      () => {
        dispatch(locationFailed('লোকেশন অ্যাক্সেস দেওয়া হয়নি'));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Patch backend whenever location resolves (uses RTK Query auth — token auto-injected)
  useEffect(() => {
    if (!resolvedLocation || !user) return;
    const locKey = `${resolvedLocation.lat},${resolvedLocation.lng}`;
    if (patchedRef.current === locKey) return;
    patchedRef.current = locKey;
    const id = (user as any).id || (user as any)._id;
    if (!id) return;
    updateProfile({ id, location: resolvedLocation });
  }, [resolvedLocation, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const navItems = [
    { icon: Home,       label: 'হোম',          path: '/' },
    { icon: Map,        label: 'মানচিত্র',     path: '/heatmap' },
    { icon: PlusCircle, label: 'দাম যোগ করুন', path: '/submit', primary: true },
    { icon: Calendar,   label: 'প্ল্যানার',    path: '/planner' },
    { icon: User,       label: 'প্রোফাইল',     path: '/profile' },
  ];

  // Active check: exact match for home, prefix match for all others
  const isActivePath = (path: string) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-[#FAFCFC] font-sans relative">

      {/* ── Ambient background (fixed to viewport, always full-screen) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]" />
        <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-100/20 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-[#10B981]/10 blur-[100px]" />
      </div>

      {/* ════════════════════════════════════════════════════
          CENTERED APP SHELL
          max-w-[1440px] mx-auto  →  centers everything on
          large/ultra-wide desktops; looks native on smaller
      ════════════════════════════════════════════════════ */}
      <div className="relative z-10 max-w-[1440px] mx-auto flex min-h-screen">

        {/* ──────────────────────────────────────────────────
            SIDEBAR
            mobile   (< 768px)   : hidden  →  bottom nav used
            tablet   (768-1023px): w-16    →  icons only
            laptop+  (≥ 1024px)  : w-60    →  icons + labels
        ────────────────────────────────────────────────── */}
        <aside className={cn(
          'hidden md:flex sticky top-0 h-screen flex-shrink-0 flex-col z-40 overflow-y-auto',
          'md:w-16 lg:w-60',
          'bg-white/80 backdrop-blur-xl',
          'border-r border-slate-100/80',
          'shadow-[1px_0_0_0_rgba(0,0,0,0.03)]',
        )}>

          {/* Logo */}
          <div className={cn(
            'flex items-center gap-3 border-b border-slate-100/60 shrink-0',
            'md:justify-center md:px-3 md:py-5',
            'lg:justify-start lg:px-6 lg:py-6',
          )}>
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-lg shadow-emerald-900/20">
              <Image src="/images/logo.png" alt="নায্যমূল্য" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <span className="hidden lg:block font-bold text-xl text-[#064E3B] tracking-tight whitespace-nowrap">
              নায্যমূল্য
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4 flex flex-col gap-1 md:px-1.5 lg:px-3">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon     = item.icon;

              /* ── Primary (Add price) button ── */
              if (item.primary) {
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    title={item.label}
                    className={cn(
                      'flex items-center gap-3 font-bold transition-all my-1 active:scale-95',
                      'bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-900/30',
                      isActive && 'ring-2 ring-offset-2 ring-[#10B981]',
                      // tablet: small pill centered
                      'md:justify-center md:mx-auto md:w-10 md:h-10 md:rounded-full md:p-0',
                      // laptop+: full-width row
                      'lg:justify-start lg:w-auto lg:h-auto lg:rounded-2xl lg:px-4 lg:py-3 lg:mx-0',
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                    <span className="hidden lg:block text-sm">{item.label}</span>
                  </Link>
                );
              }

              /* ── Regular nav item ── */
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={item.label}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl transition-all duration-200 active:scale-95',
                    'md:justify-center md:py-3 md:px-0',
                    'lg:justify-start lg:px-4 lg:py-3',
                    isActive
                      ? 'border-2 border-[#10B981] text-[#064E3B] font-bold'
                      : 'border-2 border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 font-medium',
                  )}
                >
                  <Icon
                    className="w-5 h-5 shrink-0"
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  <span className="hidden lg:block text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Panel link (admin only) */}
          {isAdmin && (
            <div className="shrink-0 md:px-1.5 lg:px-3 pb-2">
              <Link
                href="/admin"
                title="অ্যাডমিন প্যানেল"
                className={cn(
                  'w-full flex items-center gap-3 rounded-2xl transition-all',
                  'text-violet-600 hover:bg-violet-50',
                  'md:justify-center md:py-3 md:px-0',
                  'lg:justify-start lg:px-4 lg:py-3',
                )}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                <span className="hidden lg:block text-sm font-semibold">অ্যাডমিন প্যানেল</span>
              </Link>
            </div>
          )}

          {/* Login button (only when not logged in) */}
          {!user && (
            <div className="shrink-0 md:px-1.5 lg:px-3 pb-2">
              <Link
                href="/login"
                title="লগইন"
                className={cn(
                  'w-full flex items-center gap-3 rounded-2xl transition-all',
                  'text-[#064E3B] hover:bg-emerald-50',
                  'md:justify-center md:py-3 md:px-0',
                  'lg:justify-start lg:px-4 lg:py-3',
                )}
              >
                <LogIn className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                <span className="hidden lg:block text-sm font-semibold">লগইন করুন</span>
              </Link>
            </div>
          )}

          {/* Info / About */}
          <div className="shrink-0 md:px-1.5 lg:px-3 pb-6">
            <button
              onClick={() => setShowDisclaimer(true)}
              title="আমাদের সম্পর্কে"
              className={cn(
                'w-full flex items-center gap-3 rounded-2xl transition-all',
                'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80',
                'md:justify-center md:py-3 md:px-0',
                'lg:justify-start lg:px-4 lg:py-3',
              )}
            >
              <Info className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span className="hidden lg:block text-sm font-medium">আমাদের সম্পর্কে</span>
            </button>
          </div>
        </aside>

        {/* ──────────────────────────────────────────────────
            MAIN CONTENT
            fills remaining width after sidebar
        ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col pb-24 md:pb-0">

          {/* Header */}
          <header className="px-4 md:px-6 lg:px-8 py-4 md:py-5 flex items-center justify-between shrink-0">
            {/* Mobile-only logo */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg shadow-emerald-900/20">
                <Image src="/images/logo.png" alt="নায্যমূল্য" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg text-[#064E3B] tracking-tight">নায্যমূল্য</span>
            </div>
            {/* Spacer on tablet+ */}
            <div className="hidden md:block" />
            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notification / Alerts button */}
              <Link
                href="/alerts"
                title="এলার্ট"
                className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-slate-500 hover:text-[#064E3B] transition-colors active:scale-95"
              >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
              </Link>

              {/* Info button */}
              <button
                onClick={() => setShowDisclaimer(true)}
                className="w-10 h-10 rounded-full glass-pill flex items-center justify-center text-slate-500 hover:text-[#064E3B] transition-colors active:scale-95"
              >
                <Info className="w-5 h-5" strokeWidth={1.5} />
              </button>

            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 md:px-6 lg:px-8 pb-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
      {/* end centered app shell */}

      {/* ──────────────────────────────────────────────────
          MOBILE BOTTOM NAV  (hidden md+)
          outside the centered shell so it spans full width
      ────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="glass-pill px-2 py-2 flex items-center gap-1 pointer-events-auto max-w-sm w-full justify-between">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon     = item.icon;

            if (item.primary) {
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'relative -top-5 w-14 h-14 rounded-full flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all',
                    'bg-gradient-to-br from-[#064E3B] to-[#10B981] shadow-[0_8px_32px_rgba(16,185,129,0.4)]',
                    isActive && 'ring-4 ring-offset-2 ring-[#10B981]',
                  )}
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
                  'flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all duration-200 active:scale-95',
                  isActive
                    ? 'border-2 border-[#10B981] text-[#064E3B]'
                    : 'border-2 border-transparent text-slate-400 hover:text-slate-600',
                )}
              >
                <Icon
                  className="w-5 h-5 mb-0.5 transition-transform duration-200"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Disclaimer Modal ── */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-7 shadow-[0_24px_48px_rgba(0,0,0,0.12)] relative animate-in zoom-in-95 duration-300 mt-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-5 border-[4px] border-white shadow-sm mx-auto -mt-12">
              🛡️
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-1">আমাদের তথ্যের উৎস</h2>
              <p className="text-sm text-slate-500 font-medium">ব্যবহারকারীদের দেওয়া রিয়েল-টাইম ডাটা</p>
            </div>
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
                  আমাদের মূল উদ্দেশ্য আপনাকে নায্যমূল্য সম্পর্কে একটি সঠিক ধারণা দেওয়া।
                </p>
              </div>
            </div>
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
