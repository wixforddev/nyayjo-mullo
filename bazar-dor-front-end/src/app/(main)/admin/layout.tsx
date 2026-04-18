'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBasket, Store, TrendingUp, Bell, Users, ArrowLeft, Activity,
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { cn } from '../../../components/Layout';

const adminNav = [
  { icon: LayoutDashboard, label: 'ড্যাশবোর্ড',  path: '/admin' },
  { icon: ShoppingBasket,  label: 'পণ্য',         path: '/admin/products' },
  { icon: Store,           label: 'বাজার',         path: '/admin/bazars' },
  { icon: TrendingUp,      label: 'দামের তালিকা', path: '/admin/prices' },
  { icon: Bell,            label: 'এলার্ট',        path: '/admin/alerts' },
  { icon: Users,           label: 'ইউজার',         path: '/admin/users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useAppSelector((s) => s.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && user.role !== 'admin') {
      router.replace('/');
    }
  }, [mounted, user, router]);

  // Show loading until client has hydrated (avoids SSR mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFCFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAFCFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-bold text-slate-600">অ্যাডমিন অ্যাক্সেস প্রয়োজন</p>
          <Link href="/" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">হোমে ফিরুন</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFCFC] font-sans">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-teal-100/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto flex min-h-screen">
        {/* Sidebar */}
        <aside className={cn(
          'hidden md:flex sticky top-0 h-screen flex-shrink-0 flex-col z-40 overflow-y-auto',
          'md:w-16 lg:w-64',
          'bg-white/80 backdrop-blur-xl border-r border-slate-100/80',
        )}>
          {/* Logo */}
          <div className={cn(
            'flex items-center gap-3 border-b border-slate-100/60 shrink-0',
            'md:justify-center md:px-3 md:py-5',
            'lg:justify-start lg:px-6 lg:py-5',
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-900/20 shrink-0">
              <Activity className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="hidden lg:block">
              <span className="font-bold text-base text-[#064E3B] tracking-tight block">বাজার দর</span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 flex flex-col gap-1 md:px-1.5 lg:px-3">
            {adminNav.map((item) => {
              const isActive = item.path === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={item.label}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl transition-all duration-200',
                    'md:justify-center md:py-3 md:px-0',
                    'lg:justify-start lg:px-4 lg:py-3',
                    isActive
                      ? 'bg-emerald-50 text-[#064E3B] font-bold'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50/80 font-medium',
                  )}
                >
                  <Icon className={cn('w-5 h-5 shrink-0', isActive && 'text-[#064E3B]')} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="hidden lg:block text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Back to app */}
          <div className="shrink-0 md:px-1.5 lg:px-3 pb-6">
            <Link
              href="/"
              title="অ্যাপে ফিরুন"
              className="w-full flex items-center gap-3 rounded-2xl transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-50/80 md:justify-center md:py-3 md:px-0 lg:justify-start lg:px-4 lg:py-3"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span className="hidden lg:block text-sm font-medium">অ্যাপে ফিরুন</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col pb-24 md:pb-0">
          {/* Top bar */}
          <header className="px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between shrink-0 border-b border-slate-100/60">
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="font-bold text-base text-[#064E3B]">Admin Panel</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Admin</span>
              <span className="text-sm font-medium text-slate-600">{user?.fullName || user?.email}</span>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> অ্যাপে ফিরুন
            </Link>
          </header>

          <main className="flex-1 px-4 md:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="glass-pill px-2 py-2 flex items-center gap-1 pointer-events-auto max-w-sm w-full justify-between">
          {adminNav.slice(0, 5).map((item) => {
            const isActive = item.path === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
                  isActive ? 'text-[#064E3B] bg-emerald-50/60' : 'text-slate-400',
                )}
              >
                <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'scale-110')} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
