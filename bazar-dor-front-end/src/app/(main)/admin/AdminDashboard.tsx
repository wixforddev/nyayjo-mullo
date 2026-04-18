'use client';

import Link from 'next/link';
import { ShoppingBasket, Store, TrendingUp, Bell, Users, ArrowRight } from 'lucide-react';
import { useGetProductsQuery } from '../../../store/api/productApi';
import { useGetBazarsQuery } from '../../../store/api/bazarApi';
import { useGetPricesQuery } from '../../../store/api/priceApi';
import { useGetAlertsQuery } from '../../../store/api/alertApi';
import { useGetUsersQuery } from '../../../store/api/userApi';

const statCards = [
  {
    label: 'মোট পণ্য',
    icon: ShoppingBasket,
    color: 'bg-emerald-50 text-emerald-700',
    link: '/admin/products',
    key: 'products',
  },
  {
    label: 'মোট বাজার',
    icon: Store,
    color: 'bg-blue-50 text-blue-700',
    link: '/admin/bazars',
    key: 'bazars',
  },
  {
    label: 'মোট দাম এন্ট্রি',
    icon: TrendingUp,
    color: 'bg-violet-50 text-violet-700',
    link: '/admin/prices',
    key: 'prices',
  },
  {
    label: 'মোট এলার্ট',
    icon: Bell,
    color: 'bg-amber-50 text-amber-700',
    link: '/admin/alerts',
    key: 'alerts',
  },
  {
    label: 'মোট ইউজার',
    icon: Users,
    color: 'bg-rose-50 text-rose-700',
    link: '/admin/users',
    key: 'users',
  },
];

const quickLinks = [
  { label: 'নতুন পণ্য যোগ করুন', path: '/admin/products', color: 'bg-emerald-600' },
  { label: 'নতুন বাজার যোগ করুন', path: '/admin/bazars', color: 'bg-blue-600' },
  { label: 'নতুন এলার্ট পাঠান', path: '/admin/alerts', color: 'bg-amber-600' },
];

export function AdminDashboard() {
  const { data: productsRes } = useGetProductsQuery({ limit: 1 });
  const { data: bazarsRes }   = useGetBazarsQuery({ limit: 1 });
  const { data: pricesRes }   = useGetPricesQuery({ limit: 1 });
  const { data: alertsRes }   = useGetAlertsQuery({ limit: 1 });
  const { data: usersRes }    = useGetUsersQuery({ limit: 1 });

  const counts: Record<string, number> = {
    products: productsRes?.data?.attributes?.totalResults ?? 0,
    bazars:   bazarsRes?.data?.attributes?.totalResults   ?? 0,
    prices:   pricesRes?.data?.attributes?.totalResults   ?? 0,
    alerts:   alertsRes?.data?.attributes?.totalResults   ?? 0,
    users:    usersRes?.data?.attributes?.totalResults    ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-[#064E3B]">অ্যাডমিন ড্যাশবোর্ড</h1>
        <p className="text-sm text-slate-500 mt-1">বাজার দর প্ল্যাটফর্মের সকল তথ্য এখানে পরিচালনা করুন।</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.link}
              className="glass-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 font-num">
                  {counts[card.key] ?? '—'}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-[#064E3B] transition-colors">
                দেখুন <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-[#064E3B] mb-4">দ্রুত অ্যাকশন</h2>
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((q) => (
            <Link
              key={q.path}
              href={q.path}
              className={`${q.color} text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity`}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Sections overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h2 className="font-bold text-[#064E3B] mb-2">পণ্য ও বাজার</h2>
          <p className="text-sm text-slate-500 mb-4">প্রোডাক্ট লিস্ট এবং বাজার যোগ, সম্পাদনা ও মুছুন।</p>
          <div className="flex gap-3">
            <Link href="/admin/products" className="flex-1 text-center py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">পণ্য ম্যানেজ</Link>
            <Link href="/admin/bazars"   className="flex-1 text-center py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">বাজার ম্যানেজ</Link>
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="font-bold text-[#064E3B] mb-2">দাম ও এলার্ট</h2>
          <p className="text-sm text-slate-500 mb-4">ইউজারদের দেওয়া দাম পর্যালোচনা এবং এলার্ট পরিচালনা করুন।</p>
          <div className="flex gap-3">
            <Link href="/admin/prices" className="flex-1 text-center py-2.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-medium hover:bg-violet-100 transition-colors">দাম দেখুন</Link>
            <Link href="/admin/alerts" className="flex-1 text-center py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">এলার্ট দেখুন</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
