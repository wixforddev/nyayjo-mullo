'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MapPin, TrendingDown, TrendingUp, Clock, Search,
  ArrowRight, X, Navigation, CheckCircle2, ChevronRight, Store,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import { PromoBanner } from '@/components/PromoBanner';
import { useGetBazarsQuery, useGetNearbyBazarsQuery } from '../../store/api/bazarApi';
import { useGetAlertsQuery } from '../../store/api/alertApi';
import { useGetPricesQuery, useVotePriceMutation, useMarkStockOutMutation, useGetPriceHistoryQuery } from '../../store/api/priceApi';
import { useGetDailySnapshotsQuery } from '../../store/api/snapshotApi';
import { useAppSelector } from '../../store/hooks';
import { useUserLocation } from '../../hooks/useUserLocation';
import { distanceKm, formatDistance } from '../../lib/distance';

function getDivision(lat: number, lng: number): string {
  if (lat >= 25.0 && lng <= 90.0) return 'রংপুর';
  if (lat >= 24.5 && lng >= 90.5) return 'ময়মনসিংহ';
  if (lat >= 24.0 && lng <= 89.5) return 'রাজশাহী';
  if (lat >= 24.0 && lng >= 91.5) return 'সিলেট';
  if (lat >= 23.5 && lat < 24.5 && lng >= 89.9 && lng < 91.5) return 'ঢাকা';
  if (lat < 23.5 && lng >= 91.0) return 'চট্টগ্রাম';
  if (lat >= 22.0 && lat < 23.5 && lng >= 89.9) return 'বরিশাল';
  if (lat >= 22.0 && lng < 89.9) return 'খুলনা';
  return 'আপনার এলাকা';
}



export function Home() {
  const [selectedBazarId, setSelectedBazarId]   = useState<string>('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedProduct, setSelectedProduct]   = useState<any>(null);
  const [selectedProductPrice, setSelectedProductPrice] = useState<any>(null);
  const [isPriceConfirmed, setIsPriceConfirmed] = useState(false);
  const [isStockOutReported, setIsStockOutReported] = useState(false);
  const [isIndexSheetOpen, setIsIndexSheetOpen] = useState(false);
  const [viewMode, setViewMode]                 = useState<'list' | 'map'>('list'); // map kept for right-column button
  const [alreadyVotedPopup, setAlreadyVotedPopup] = useState(false);
  const [votedPriceIds, setVotedPriceIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voted_prices') || '[]');
      setVotedPriceIds(new Set(stored));
    } catch {}
  }, []);

  const markVoted = (priceId: string) => {
    setVotedPriceIds(prev => {
      const next = new Set(prev);
      next.add(priceId);
      try { localStorage.setItem('voted_prices', JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const { location: userLocation, refresh: refreshLocation } = useUserLocation();

  const { data: bazarsRes, isLoading: loadingBazars1 } = useGetBazarsQuery(
    { limit: 50 },
    { skip: !!userLocation },
  );
  const { data: nearbyBazarsRes, isLoading: loadingBazars2 } = useGetNearbyBazarsQuery(
    { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 10, limit: 50 },
    { skip: !userLocation },
  );
  const loadingBazars = loadingBazars1 || loadingBazars2;
  const { data: alertsRes }       = useGetAlertsQuery({ limit: 10 });
  const { data: localAlertsRes }  = useGetAlertsQuery(
    { bazarId: selectedBazarId, limit: 5 },
    { skip: !selectedBazarId },
  );
  // Bazar-specific prices (all, verified badge shown on card)
  const { data: pricesRes, isFetching: loadingBazarPrices } = useGetPricesQuery(
    { bazarId: selectedBazarId, limit: 100 },
    { skip: !selectedBazarId }
  );
  // Recent prices from all bazars
  const { data: recentPricesRes, isFetching: loadingRecentPrices } = useGetPricesQuery(
    { limit: 100 },
    { skip: !!selectedBazarId }
  );
  // Price history for selected product (modal sparkline)
  const { data: priceHistoryRes } = useGetPriceHistoryQuery(
    { productId: selectedProduct?._id, bazarId: selectedBazarId || undefined },
    { skip: !selectedProduct?._id }
  );
  // All submissions for selected product — for best-time calculation
  const { data: productSubmissionsRes } = useGetPricesQuery(
    { productId: selectedProduct?._id, limit: 200 },
    { skip: !selectedProduct?._id }
  );

  const today30 = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: snapshotRes } = useGetDailySnapshotsQuery({ startDate: sevenDaysAgo, endDate: today30 });

  const [votePrice]    = useVotePriceMutation();
  const [markStockOut] = useMarkStockOutMutation();

  const bazars       = userLocation
    ? (nearbyBazarsRes?.data?.attributes || [])
    : (bazarsRes?.data?.attributes?.data || []);
  const globalAlerts = (alertsRes?.data?.attributes?.data     || []).filter((a: any) => !a.bazarId);
  const localAlerts  = localAlertsRes?.data?.attributes?.data || [];
  const alerts       = [...localAlerts, ...globalAlerts];
  const prices       = pricesRes?.data?.attributes?.data      || [];

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // When location available, all returned bazars are already within 10km
  const nearbyBazarIds = userLocation
    ? new Set(bazars.map((b: any) => b._id))
    : null;

  const recentAllPrices = (recentPricesRes?.data?.attributes?.data || [])
    .filter((p: any) => {
      if (Date.now() - new Date(p.createdAt).getTime() >= SEVEN_DAYS) return false;
      if (!nearbyBazarIds) return true;
      const bid = typeof p.bazarId === 'object' ? p.bazarId?._id : p.bazarId;
      return nearbyBazarIds.has(bid);
    });

  const loadingProducts = selectedBazarId ? loadingBazarPrices : loadingRecentPrices;

  // Sort bazars by distance if location available
  const sortedBazars = userLocation
    ? [...bazars].sort((a: any, b: any) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : bazars;


  const handleBazarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBazarId(e.target.value);
  };

  const handleBazarSelectOnMap = (bazar: any) => {
    setSelectedBazarId(bazar._id);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsPriceConfirmed(false);
    setIsStockOutReported(false);
    setSelectedProductPrice(product.priceEntry || null);
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated || !selectedProductPrice) return;
    try {
      await votePrice({ priceId: selectedProductPrice._id, voteType }).unwrap();
      setIsPriceConfirmed(true);
      markVoted(selectedProductPrice._id);
    } catch (err: any) {
      if (err?.status === 409 || err?.data?.statusCode === 409) {
        markVoted(selectedProductPrice._id);
        setAlreadyVotedPopup(true);
      }
    }
  };

  const handleStockOut = async () => {
    if (!isAuthenticated || !selectedProductPrice) return;
    try { await markStockOut(selectedProductPrice._id).unwrap(); setIsStockOutReported(true); } catch {}
  };


  const getProductPrice = (productId: string) => {
    const p = prices.find((pr: any) => pr.productId?._id === productId || pr.productId === productId);
    return p?.price ?? null;
  };

  const isVerifiedPrice = (p: any) => {
    const total = (p?.upvotes || 0) + (p?.downvotes || 0);
    return total >= 10 && (p?.upvotes || 0) / total >= 0.6;
  };

  const currentBazar = bazars.find((b: any) => b._id === selectedBazarId) as any;

  // Essential products for daily basket index
  const ESSENTIAL = [
    { key: 'rice',    label: 'চাল',     unit: '১ কেজি',  qty: 1, match: (n: string) => /চাল|rice/i.test(n) },
    { key: 'chicken', label: 'মুরগি',   unit: '১ কেজি',  qty: 1, match: (n: string) => /মুরগি|chicken/i.test(n) },
    { key: 'oil',     label: 'সয়াবিন তেল', unit: '১ লিটার', qty: 1, match: (n: string) => /তেল|oil/i.test(n) },
    { key: 'onion',   label: 'পেঁয়াজ', unit: '১ কেজি',  qty: 1, match: (n: string) => /পেঁয়াজ|onion/i.test(n) },
    { key: 'potato',  label: 'আলু',     unit: '২ কেজি',  qty: 2, match: (n: string) => /আলু|potato/i.test(n) },
  ];
  const allRecentForIndex = [...prices, ...recentAllPrices];
  const NOW = Date.now();
  const essentialData = ESSENTIAL.map(e => {
    const matched = allRecentForIndex.filter((p: any) => {
      const n = (typeof p.productId === 'object' ? (p.productId?.nameBn || p.productId?.name) : '') || '';
      return e.match(n);
    });
    const todayPrices = matched.filter((p: any) => NOW - new Date(p.createdAt).getTime() < 24 * 60 * 60 * 1000);
    const yestPrices  = matched.filter((p: any) => {
      const age = NOW - new Date(p.createdAt).getTime();
      return age >= 24 * 60 * 60 * 1000 && age < 48 * 60 * 60 * 1000;
    });
    const avg = (arr: any[]) => arr.length ? Math.round(arr.reduce((s, p) => s + p.price, 0) / arr.length) : null;
    const todayUnit = avg(todayPrices) ?? avg(matched);
    const yestUnit  = avg(yestPrices);
    const change = todayUnit !== null && yestUnit !== null ? todayUnit - yestUnit : null;
    const itemTotal = todayUnit !== null ? Math.round(todayUnit * e.qty) : null;
    return { ...e, today: todayUnit, change, itemTotal };
  });
  const basketTotal = essentialData.reduce((s, e) => s + (e.itemTotal || 0), 0);

  // Basket change vs yesterday
  const basketYestTotal = essentialData.reduce((s, e) => {
    if (e.change === null || e.today === null) return s;
    return s + Math.round((e.today - e.change) * e.qty);
  }, 0);
  const basketChange = basketTotal > 0 && basketYestTotal > 0 ? basketTotal - basketYestTotal : null;

  // Division from location
  const division = userLocation ? getDivision(userLocation.lat, userLocation.lng) : 'আপনার এলাকা';

  // 7-day trend from live prices (day-by-day basket total)
  const bnMonths = ['জান', 'ফেব', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ', 'অক্টো', 'নভে', 'ডিসে'];
  const trendData = (() => {
    const result: { value: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = Date.now() - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd   = Date.now() - i * 24 * 60 * 60 * 1000;
      const d = new Date(dayEnd);
      const label = `${d.getDate()} ${bnMonths[d.getMonth()]}`;
      const dayPrices = allRecentForIndex.filter((p: any) => {
        const t = new Date(p.createdAt).getTime();
        return t >= dayStart && t < dayEnd;
      });
      let total = 0; let hasAny = false;
      ESSENTIAL.forEach(e => {
        const matched = dayPrices.filter((p: any) => {
          const n = (typeof p.productId === 'object' ? (p.productId?.nameBn || p.productId?.name) : '') || '';
          return e.match(n);
        });
        if (matched.length > 0) {
          const avg = Math.round(matched.reduce((s: number, p: any) => s + p.price, 0) / matched.length);
          total += avg * e.qty;
          hasAny = true;
        }
      });
      if (hasAny) result.push({ value: total, label });
    }
    return result;
  })();

  // Auto insight
  const biggestChange = essentialData
    .filter(e => e.change !== null && e.today !== null)
    .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))[0];
  const insightTip = biggestChange?.change
    ? `${biggestChange.label}র দাম কেজিতে ৳${Math.abs(biggestChange.change)} ${biggestChange.change > 0 ? 'বাড়ায় আজকের সূচক ঊর্ধ্বমুখী।' : 'কমায় আজকের সূচক নিম্নমুখী।'}`
    : null;

  const toBnTime = (h: number) => {
    const period = h >= 5 && h < 12 ? 'সকাল' : h === 12 ? 'দুপুর' : h >= 13 && h < 17 ? 'বিকেল' : h >= 17 && h < 20 ? 'সন্ধ্যা' : 'রাত';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${period} ${h12}টা`;
  };

  const getBestBuyTime = (submissions: any[]) => {
    if (submissions.length < 5) return null;
    const counts: Record<number, number> = {};
    submissions.forEach((p: any) => {
      const bdHour = (new Date(p.createdAt).getUTCHours() + 6) % 24;
      counts[bdHour] = (counts[bdHour] || 0) + 1;
    });
    const best = Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    if (!best) return null;
    const h = Number(best[0]);
    return `${toBnTime(h)} – ${toBnTime((h + 1) % 24)}`;
  };

  const timeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1)   return 'এইমাত্র';
    if (mins < 60)  return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs} ঘণ্টা আগে`;
    return `${Math.floor(hrs / 24)} দিন আগে`;
  };

  // Products to display: bazar-specific or recent all-bazar
  const sourceList = selectedBazarId ? prices : recentAllPrices;
  const bazarProducts = sourceList.map((p: any) => ({
    ...(typeof p.productId === 'object' ? p.productId : { _id: p.productId }),
    bazarPrice: p.price,
    priceEntry: p,
    bazarName: typeof p.bazarId === 'object' ? (p.bazarId?.nameBn || p.bazarId?.name) : '',
    submittedAt: p.createdAt,
  }));
  const filteredProducts = searchQuery
    ? bazarProducts.filter((p: any) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.nameBn?.includes(searchQuery)
      )
    : bazarProducts;
  const topAlert = alerts[0];

  const getBazarDistance = (bazar: any) => {
    if (!userLocation) return null;
    return distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng);
  };

  return (
    <div className="pb-24 lg:pb-12">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">

        {/* ── Left Column ── */}
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-w-0 w-full">

          {/* Alert Banner */}
          {topAlert ? (
            <Link href="/alerts" className="block">
              <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-3.5 flex items-start gap-3 active:bg-rose-100/80 transition-colors relative overflow-hidden">
                <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1 min-w-0">
                  {topAlert.bazarId ? (
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide mb-0.5">📍 {topAlert.bazarId?.nameBn || topAlert.bazarId?.name}</p>
                  ) : (
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide mb-0.5">🌐 সারাদেশে</p>
                  )}
                  <h3 className="text-sm font-bold text-rose-800 leading-tight">{topAlert.messageBn || topAlert.message}</h3>
                </div>
                <ChevronRight className="shrink-0 text-rose-300 w-4 h-4 mt-0.5" />
              </div>
            </Link>
          ) : (
            <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3">
              <span className="text-lg shrink-0">✅</span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-emerald-800">বাজারের দাম স্বাভাবিক আছে</h3>
                <p className="text-xs text-emerald-600 mt-0.5 hidden sm:block">এই মুহূর্তে কোনো অস্বাভাবিক মূল্য বৃদ্ধি পাওয়া যায়নি।</p>
              </div>
            </div>
          )}

          {/* Mobile-only compact market index */}
          <button
            onClick={() => setIsIndexSheetOpen(true)}
            className="lg:hidden w-full glass-card px-4 py-3 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-400 font-medium">{division} বাজার সূচক</span>
                <span className="text-xl font-black text-[#064E3B] tracking-tight">৳ {basketTotal || '—'}</span>
              </div>
              {basketChange !== null && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${basketChange > 0 ? 'text-rose-500 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                  {basketChange > 0 ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} /> : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                  {basketChange > 0 ? '+' : ''}{basketChange}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              <span>লাইভ</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>

          {/* Hero Card */}
          <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:gap-8 gap-4">
              <div className="flex-1 min-w-0">
                {/* Bazar selector — full width on mobile */}
                <div className="w-full flex items-center gap-2 bg-white/70 border border-slate-200/80 rounded-xl px-3 py-2 mb-3 shadow-sm">
                  <MapPin className="w-4 h-4 text-[#10B981] shrink-0" strokeWidth={2} />
                  {loadingBazars ? (
                    <span className="text-xs text-slate-400 flex-1">লোড হচ্ছে...</span>
                  ) : (
                    <select value={selectedBazarId} onChange={handleBazarChange}
                      className="flex-1 min-w-0 text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none appearance-none cursor-pointer">
                      <option value="">সব বাজার (কাছের)</option>
                      {sortedBazars.map((b: any) => {
                        const dist = getBazarDistance(b);
                        return (
                          <option key={b._id} value={b._id}>
                            {b.nameBn || b.name}{dist !== null ? ` (${formatDistance(dist)})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0 pointer-events-none" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-[#064E3B] leading-tight mb-2">
                  আশেপাশের সঠিক দাম জানুন
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 min-w-0">
                    <Store className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span className="truncate">{currentBazar ? (currentBazar.nameBn || currentBazar.name) : 'আপনার এলাকা'} এর বাজার দর</span>
                  </p>
                  {currentBazar && userLocation && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Navigation className="w-3 h-3" />
                      {formatDistance(distanceKm(userLocation.lat, userLocation.lng, currentBazar.lat, currentBazar.lng))} দূরে
                    </span>
                  )}
                </div>
              </div>

              <Link href="/heatmap"
                className="flex items-center justify-center gap-3 w-full lg:w-auto bg-[#064E3B] text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-[0_8px_16px_rgba(6,78,59,0.2)] active:scale-[0.98] transition-all lg:shrink-0">
                <span>আশেপাশের দাম দেখুন</span>
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
            <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 glass-card focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-sm transition-shadow" />
          </div>

          {/* ── PRODUCTS VIEW ── */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#064E3B]">
              {searchQuery ? 'অনুসন্ধানের ফলাফল' : currentBazar ? `${currentBazar.nameBn || currentBazar.name} এর পণ্য` : 'সাম্প্রতিক দাম'}
            </h3>
            {filteredProducts.length > 0 && (
              <Link href={`/products${selectedBazarId ? `?bazar_id=${selectedBazarId}` : ''}`}
                className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                সব দেখুন <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/60 border border-slate-100 rounded-2xl p-3 min-h-[100px] animate-pulse">
                  <div className="h-3.5 bg-slate-100 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-slate-100 rounded mb-3 w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-1/2 mt-auto" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm font-medium">{selectedBazarId ? 'এই বাজারে এখনো কোনো দাম সাবমিট হয়নি' : 'গত ৭ দিনে কোনো দাম সাবমিট হয়নি'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredProducts.slice(0, 8).map((product: any, idx: number) => (
                <div key={`${product._id}-${idx}`}
                  className="bg-white/85 border border-slate-100/80 rounded-2xl p-3 flex flex-col justify-between min-h-[100px] cursor-pointer active:scale-[0.97] transition-transform shadow-sm"
                  onClick={() => handleProductClick(product)}>
                  <div className="flex justify-between items-start gap-1">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-900 leading-tight truncate">{product.nameBn || product.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{product.unit}</p>
                      {!selectedBazarId && product.bazarName && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">🏪 {product.bazarName}</p>
                      )}
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {product.icon || '🛒'}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-base font-black text-[#064E3B] tracking-tight">
                        ৳{product.bazarPrice ?? product.defaultPrice}
                      </span>
                      {isVerifiedPrice(product.priceEntry) && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" strokeWidth={2.5} />
                      )}
                    </div>
                    {product.submittedAt && (
                      <span className="text-[9px] text-slate-400 font-medium shrink-0 hidden xs:block">{timeAgo(product.submittedAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 hidden lg:flex flex-col gap-4">
          <div className="glass-card p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsIndexSheetOpen(true)}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-medium text-slate-500 mb-1">{division} বাজার সূচক</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#064E3B] tracking-tight">৳ {basketTotal || '—'}</span>
                  {basketChange !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${basketChange > 0 ? 'text-rose-500 bg-rose-50' : 'text-[#10B981] bg-emerald-50'}`}>
                      {basketChange > 0 ? <TrendingUp className="w-3 h-3" strokeWidth={2.5} /> : <TrendingDown className="w-3 h-3" strokeWidth={2.5} />}
                      <span className="text-xs font-bold">{basketChange > 0 ? '+' : ''}{basketChange}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                <span>লাইভ ডেটা</span>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={essentialData.filter(e => e.today).map(e => ({ value: e.today }))}>
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center">বিস্তারিত দেখতে ট্যাপ করুন</p>
          </div>

          <PromoBanner />

          {/* Food Rescue card */}
          <div className="glass-card p-5 relative overflow-hidden group cursor-pointer">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">ক্রেতা সচেতনতা</p>
              <h2 className="text-[18px] font-bold text-[#064E3B] mb-1 leading-tight">অতিরিক্ত খাবার নষ্ট করবেন না</h2>
              <p className="text-sm font-medium text-slate-500 mb-4">যা আছে, তা দিয়েই রান্না করুন</p>
              <Link href="/planner?tab=rescue"
                className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2 rounded-full font-medium text-sm shadow-md hover:bg-[#043d2e] transition-colors">
                রেসিপি দেখুন <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300 pb-20 lg:pb-0">
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)} />
          <div className="w-full lg:max-w-lg h-[85vh] lg:h-auto lg:max-h-[85vh] bg-[#FAFCFC] rounded-t-[32px] lg:rounded-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300">
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 lg:hidden">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <div className="hidden lg:flex justify-end px-6 pt-5 pb-1 shrink-0">
              <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4">
              {(() => {
                const isVerified = isVerifiedPrice(selectedProductPrice);
                const currentPrice = selectedProductPrice?.price ?? selectedProduct.bazarPrice ?? selectedProduct.defaultPrice;
                const history5 = (priceHistoryRes?.data?.attributes || [])
                  .slice(-5)
                  .map((h: any) => ({ value: Math.round(h.avgPrice) }));
                return (
                  <div className="bg-white rounded-[32px] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-2 mt-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full text-2xl mb-3">
                      {selectedProduct.icon || '🛒'}
                    </div>
                    <h2 className="text-sm font-bold text-slate-500 mb-1">{selectedProduct.nameBn || selectedProduct.name}</h2>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight">৳ {currentPrice}</h1>
                      {isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">প্রতি {selectedProduct.unit}</span>
                    {isVerified && <p className="text-xs text-emerald-600 font-bold mt-1">✓ ভেরিফায়েড দাম</p>}
                  </div>
                );
              })()}

              {selectedProductPrice ? (
                <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-50 mb-4">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider text-center">আপনার মতামত দিন</h3>
                  {!isAuthenticated ? (
                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-center">
                      <p className="text-sm font-medium text-amber-800 mb-3">🔑 ভোট দিতে লগইন করুন</p>
                      <div className="flex gap-2 justify-center">
                        <Link href="/login" className="bg-[#064E3B] text-white px-5 py-2.5 rounded-xl font-bold text-sm">লগইন</Link>
                        <Link href="/register" className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm">রেজিস্ট্রেশন</Link>
                      </div>
                    </div>
                  ) : (() => {
                    const hasVoted = !!(selectedProductPrice?._id && votedPriceIds.has(selectedProductPrice._id));
                    return (
                    <>
                      {hasVoted && (
                        <p className="text-xs text-center text-slate-400 font-medium mb-3">
                          আপনি এই দামে ইতিমধ্যে ভোট দিয়েছেন
                        </p>
                      )}
                      <div className="flex gap-3 mb-4">
                        {isPriceConfirmed ? (
                          <div className="flex-1 bg-emerald-50/80 text-emerald-700 font-bold py-3.5 rounded-2xl border border-emerald-200/60 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> ঠিক আছে
                          </div>
                        ) : hasVoted ? (
                          <div className="flex-1 bg-slate-50 text-slate-300 font-bold py-3.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 cursor-not-allowed">
                            ✓ সঠিক
                          </div>
                        ) : (
                          <button onClick={() => handleVote('up')}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-emerald-100/50 flex items-center justify-center gap-2">
                            ✓ সঠিক ({selectedProductPrice.upvotes || 0})
                          </button>
                        )}
                        {hasVoted ? (
                          <div className="flex-1 bg-slate-50 text-slate-300 font-bold py-3.5 rounded-2xl border border-slate-100 flex items-center justify-center gap-2 cursor-not-allowed">
                            ✕ আপডেট করুন
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedProduct(null); router.push('/submit'); }}
                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-amber-100/50 flex items-center justify-center gap-2">
                            ✕ আপডেট করুন
                          </button>
                        )}
                      </div>
                      <div className="h-px w-full bg-slate-100 my-2" />
                      {!isStockOutReported ? (
                        <button onClick={handleStockOut}
                          className="w-full flex items-center justify-center gap-2 text-rose-500 text-sm font-semibold py-2 mt-1 rounded-xl hover:bg-rose-50 transition-colors">
                          🚫 পণ্যটি বাজারে পাননি?
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-center gap-2 text-rose-700 text-sm font-semibold py-2 mt-1 rounded-xl bg-rose-50 border border-rose-200/60">
                          ✅ স্টক আউট রিপোর্ট গৃহীত
                        </div>
                      )}
                    </>
                  );
                  })()}
                </div>
              ) : (
                <div className="bg-amber-50 rounded-[24px] p-5 text-center border border-amber-100">
                  <p className="text-sm text-amber-700 font-medium">এই বাজারে এখনো দাম সাবমিট হয়নি।</p>
                  <Link href="/submit" className="inline-block mt-3 bg-[#064E3B] text-white px-5 py-2.5 rounded-xl text-sm font-bold">দাম যোগ করুন</Link>
                </div>
              )}

              {/* Proof photo */}
              {selectedProductPrice?.photoUrl && (
                <div className="bg-white rounded-[24px] overflow-hidden border border-slate-50 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-4 pb-2">প্রমাণ ছবি</p>
                  <div className="relative w-full h-44">
                    <Image src={selectedProductPrice.photoUrl} alt="দামের প্রমাণ" fill className="object-cover" unoptimized />
                  </div>
                </div>
              )}

              {/* কেনার সেরা সময় + গত ৫ দিনে দাম */}
              {(() => {
                const history5 = (priceHistoryRes?.data?.attributes || [])
                  .slice(-5)
                  .map((h: any) => ({ value: Math.round(h.avgPrice) }));
                const submissions = productSubmissionsRes?.data?.attributes?.data || [];
                const bestTime = getBestBuyTime(submissions);
                return (
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-white rounded-[24px] p-4 border border-slate-50 shadow-sm flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">কেনার সেরা সময়</p>
                      {bestTime ? (
                        <>
                          <p className="text-sm font-black text-[#064E3B]">{bestTime}</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">এই সময়ে সবচেয়ে বেশি দাম জমা হয়</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-300 pt-1">পর্যাপ্ত ডেটা নেই</p>
                      )}
                    </div>
                    <div className="bg-white rounded-[24px] p-4 border border-slate-50 shadow-sm flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">গত ৫ দিনে দাম</p>
                      {history5.length >= 2 ? (
                        <div className="h-12 -mx-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history5}>
                              <Tooltip formatter={(v: any) => [`৳${v}`, '']} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 10 }} />
                              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300 pt-2">ডেটা নেই</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Market Index Modal */}
      {isIndexSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300 pb-20 lg:pb-0">
          <div className="absolute inset-0" onClick={() => setIsIndexSheetOpen(false)} />
          <div className="w-full lg:max-w-lg h-[85vh] lg:h-auto lg:max-h-[85vh] bg-[#FAFCFC] rounded-t-[32px] lg:rounded-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full lg:zoom-in-95 duration-300">
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 lg:hidden">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
            </div>
            <div className="hidden lg:flex justify-end px-6 pt-5 pb-1 shrink-0">
              <button onClick={() => setIsIndexSheetOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4">

              {/* Header + Chart — single white card */}
              <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
                <p className="text-xs font-bold text-emerald-600 mb-1">{division} এসেনশিয়াল বাস্কেট</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                  ৳ {basketTotal > 0 ? basketTotal.toLocaleString() : '—'}
                </h2>
                {basketChange !== null && (
                  <p className={`text-sm font-semibold flex items-center gap-1 mb-4 ${basketChange > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {basketChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    গতকালের চেয়ে ৳{Math.abs(basketChange)} {basketChange > 0 ? 'বেশি' : 'কম'}
                  </p>
                )}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">গত ৭ দিনের সূচক</p>
                {trendData.length >= 2 ? (
                  <div className="h-36 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `৳${v}`} domain={['auto', 'auto']} />
                        <Tooltip
                          formatter={(v: any) => [`৳${v}`, 'সূচক']}
                          contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 11, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                          labelStyle={{ color: '#64748b', fontSize: 10 }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 text-center py-6">ডেটা সংগ্রহ হচ্ছে...</p>
                )}
              </div>

              {/* Insight tip */}
              {insightTip && (
                <div className="bg-amber-50 rounded-[20px] px-4 py-3 border border-amber-100 flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5">💡</span>
                  <p className="text-sm font-semibold text-amber-800 leading-relaxed">{insightTip}</p>
                </div>
              )}

              {/* Basket items list */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-1 px-1">বাস্কেটের উপাদান</p>
                <div className="divide-y divide-slate-100">
                  {essentialData.map(e => (
                    <div key={e.key} className="flex items-center justify-between py-3 px-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-700">{e.label}</span>
                        <span className="text-xs text-slate-400">({e.unit})</span>
                      </div>
                      <span className="font-black text-[#064E3B]">
                        {e.itemTotal ? `৳${e.itemTotal}` : e.today ? `৳${e.today}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setIsIndexSheetOpen(false)} className="w-full bg-slate-900 text-white rounded-[20px] py-4 font-bold mt-2">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Already-voted popup */}
      {alreadyVotedPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-xs text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-white shadow-sm">
              🗳️
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ইতিমধ্যে ভোট দিয়েছেন</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              আপনি এই দামে আগেই ভোট দিয়েছেন।<br />
              প্রতিটি দামে একবারই ভোট দেওয়া যাবে।
            </p>
            <button
              onClick={() => setAlreadyVotedPopup(false)}
              className="w-full bg-[#064E3B] text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all"
            >
              বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
