'use client';

import { useState, useEffect } from 'react';
import {
  MapPin, TrendingDown, TrendingUp, Clock, Search,
  ArrowRight, X, Navigation, CheckCircle2, ChevronRight, Store,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { PromoBanner } from '@/components/PromoBanner';
import { useGetBazarsQuery } from '../../store/api/bazarApi';
import { useGetAlertsQuery } from '../../store/api/alertApi';
import { useGetPricesQuery, useVotePriceMutation, useMarkStockOutMutation, useGetPriceHistoryQuery } from '../../store/api/priceApi';
import { useAppSelector } from '../../store/hooks';
import { useUserLocation } from '../../hooks/useUserLocation';
import { distanceKm, formatDistance } from '../../lib/distance';



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

  const { data: bazarsRes, isLoading: loadingBazars } = useGetBazarsQuery({ limit: 50 });
  const { data: alertsRes } = useGetAlertsQuery({ limit: 3 });
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

  const [votePrice]    = useVotePriceMutation();
  const [markStockOut] = useMarkStockOutMutation();

  const bazars   = bazarsRes?.data?.attributes?.data   || [];
  const alerts   = alertsRes?.data?.attributes?.data   || [];
  const prices   = pricesRes?.data?.attributes?.data   || [];

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const NEARBY_KM  = 10;

  // Bazars within 10km (or all if no location)
  const nearbyBazarIds = userLocation
    ? new Set(bazars
        .filter((b: any) => b.lat && b.lng && distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) <= NEARBY_KM)
        .map((b: any) => b._id))
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

  // Essential products for daily index
  const ESSENTIAL = [
    { key: 'chicken', label: 'মুরগি',   match: (n: string) => /মুরগি|chicken/i.test(n) },
    { key: 'beef',    label: 'গরুর মাংস', match: (n: string) => /গরু|beef/i.test(n) },
    { key: 'oil',     label: 'তেল',      match: (n: string) => /তেল|oil/i.test(n) },
    { key: 'potato',  label: 'আলু',      match: (n: string) => /আলু|potato/i.test(n) },
    { key: 'onion',   label: 'পেঁয়াজ',  match: (n: string) => /পেঁয়াজ|onion/i.test(n) },
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
    const today = avg(todayPrices) ?? avg(matched);
    const yest  = avg(yestPrices);
    const change = today !== null && yest !== null ? today - yest : null;
    return { ...e, today, change };
  });
  const basketTotal = essentialData.reduce((s, e) => s + (e.today || 0), 0);

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
    <div className="pb-12">
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left Column ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Alert Banner */}
          {topAlert ? (
            <div className="bg-rose-50/80 backdrop-blur-md border border-rose-100 rounded-2xl p-4 flex items-start gap-3 cursor-pointer hover:bg-rose-100/80 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 border-2 border-rose-200/50 rounded-2xl animate-pulse pointer-events-none" />
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-800 leading-tight">{topAlert.message}</h3>
                {topAlert.messageBn && <p className="text-xs text-rose-600 mt-0.5">{topAlert.messageBn}</p>}
              </div>
              <Link href="/alerts" className="shrink-0 text-rose-400 text-lg mt-2">→</Link>
            </div>
          ) : (
            <div className="bg-rose-50/80 backdrop-blur-md border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-rose-800">জরুরী এলার্ট: বাজারে কাঁচা মরিচের চরম সংকট ও দাম ঊর্ধ্বমুখী।</h3>
                <p className="text-xs text-rose-600 mt-0.5">গত ২৪ ঘণ্টায় দাম ৪০% বৃদ্ধি পেয়েছে।</p>
              </div>
            </div>
          )}

          {/* Hero Card */}
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-2xl opacity-60 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:gap-8 gap-6">
              <div className="flex-1">
                {/* Bazar selector */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/80 shadow-sm mb-4 relative">
                  <MapPin className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={2} />
                  {loadingBazars ? (
                    <span className="text-xs text-slate-400">লোড হচ্ছে...</span>
                  ) : (
                    <select value={selectedBazarId} onChange={handleBazarChange}
                      className="text-xs font-medium text-slate-600 bg-transparent border-none focus:outline-none appearance-none pr-4 cursor-pointer">
                      <option value="">📍 সব বাজার (কাছের)</option>
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
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 rotate-90 pointer-events-none" />
                </div>
                <h1 className="text-3xl font-bold text-[#064E3B] leading-tight mb-2">আশেপাশের<br />সঠিক দাম জানুন</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#10B981]" />
                    {currentBazar ? (currentBazar.nameBn || currentBazar.name) : 'আপনার এলাকা'} এর বাজার দর
                  </p>
                  {currentBazar && userLocation && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {formatDistance(distanceKm(userLocation.lat, userLocation.lng, currentBazar.lat, currentBazar.lng))} দূরে
                    </span>
                  )}
                </div>
              </div>
              <Link href="/heatmap"
                className="inline-flex items-center justify-between bg-[#064E3B] text-white px-5 py-3.5 rounded-2xl font-medium shadow-[0_8px_16px_rgba(6,78,59,0.2)] hover:bg-[#043d2e] transition-colors active:scale-[0.98] lg:shrink-0">
                <span>আশেপাশের দাম</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-3">
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </div>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 glass-card focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-sm transition-shadow" />
          </div>

          {/* ── PRODUCTS VIEW ── */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#064E3B]">
              {searchQuery ? 'অনুসন্ধানের ফলাফল' : currentBazar ? `${currentBazar.nameBn || currentBazar.name} এর পণ্য` : 'সাম্প্রতিক দাম'}
            </h3>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`bg-white/60 border border-slate-100 rounded-[16px] p-3 min-h-[110px] animate-pulse${i >= 6 ? ' hidden md:block' : ''}`}>
                  <div className="h-4 bg-slate-100 rounded mb-2 w-2/3" />
                  <div className="h-3 bg-slate-100 rounded mb-4 w-1/3" />
                  <div className="h-6 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="font-medium">{selectedBazarId ? 'এই বাজারে এখনো কোনো দাম সাবমিট হয়নি' : 'গত ৭ দিনে কোনো দাম সাবমিট হয়নি'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredProducts.slice(0, 8).map((product: any, idx: number) => (
                  <div key={`${product._id}-${idx}`}
                    className={`backdrop-blur-md border border-[rgba(15,23,42,0.05)] bg-[rgba(255,255,255,0.85)] rounded-[16px] p-[12px] flex flex-col justify-between min-h-[110px] relative cursor-pointer transition-transform hover:-translate-y-1${idx >= 6 ? ' hidden md:flex' : ''}`}
                    onClick={() => handleProductClick(product)}>
                    <div className="flex justify-between items-start">
                      <div className="pr-1 flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-[#0F172A] m-0 leading-[1.2] truncate">{product.nameBn || product.name}</h4>
                        <p className="text-[11px] text-[#64748B] mt-[2px]">{product.unit}</p>
                        {!selectedBazarId && product.bazarName && (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5 truncate">🏪 {product.bazarName}</p>
                        )}
                      </div>
                      <div className="w-[40px] h-[40px] bg-[#F1F5F9] rounded-[8px] flex items-center justify-center text-2xl shrink-0 ml-1">
                        {product.icon || '🛒'}
                      </div>
                    </div>
                    <div className="mt-auto pt-2 flex items-end justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[18px] font-[800] tracking-[-0.5px] text-[#064E3B]">
                          ৳ {product.bazarPrice ?? product.defaultPrice}
                        </span>
                        {isVerifiedPrice(product.priceEntry) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                        )}
                      </div>
                      {product.submittedAt && (
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{timeAgo(product.submittedAt)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {filteredProducts.length > 6 && (
                <Link href={`/products${selectedBazarId ? `?bazar_id=${selectedBazarId}` : ''}`}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-100 text-[#064E3B] font-bold py-3.5 rounded-2xl shadow-sm hover:bg-emerald-50 transition-colors mt-1">
                  সব দেখুন ({filteredProducts.length})
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-4">
          <div className="glass-card p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsIndexSheetOpen(true)}>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-medium text-slate-500 mb-1">দৈনিক বাজার সূচক</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#064E3B] tracking-tight">৳ {basketTotal || 385}</span>
                  <div className="flex items-center gap-1 text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md">
                    <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
                    <span className="text-xs font-bold">৩.২%</span>
                  </div>
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
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
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
                const history7 = (priceHistoryRes?.data?.attributes || [])
                  .slice(-7)
                  .map((h: any) => ({ value: Math.round(h.avgPrice) }));
                return (
                  <div className="bg-white rounded-[32px] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-2 mt-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full text-2xl mb-3">
                      {selectedProduct.icon || '🛒'}
                    </div>
                    <h2 className="text-sm font-bold text-slate-500 mb-1">{selectedProduct.nameBn || selectedProduct.name}</h2>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                        ৳ {selectedProductPrice?.price ?? selectedProduct.bazarPrice ?? selectedProduct.defaultPrice}
                      </h1>
                      {isVerified && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">প্রতি {selectedProduct.unit}</span>
                    {isVerified && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">✓ ভেরিফায়েড দাম</p>
                    )}
                    {history7.length >= 2 && (
                      <div className="h-12 mt-3 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={history7}>
                            <Tooltip formatter={(v: any) => [`৳${v}`, 'গড় দাম']} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 11 }} />
                            <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                );
              })()}

              {selectedProductPrice ? (
                <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-50 mb-4">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider text-center">আপনার মতামত দিন</h3>
                  {!isAuthenticated ? (
                    <div className="text-center py-2">
                      <p className="text-sm text-slate-500 mb-3">ভোট দিতে লগইন করুন</p>
                      <Link href="/login" className="bg-[#064E3B] text-white px-5 py-2.5 rounded-xl font-bold text-sm">লগইন করুন</Link>
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
            </div>
          </div>
        </div>
      )}

      {/* Market Index Modal */}
      {isIndexSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
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
              <div className="flex flex-col items-center mt-2 mb-1">
                <p className="text-slate-500 text-sm font-medium mb-1">৫টি নিত্যপ্রয়োজনীয় পণ্যের সূচক</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                  ৳ {basketTotal > 0 ? basketTotal : '—'}
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {essentialData.map(e => (
                  <div key={e.key} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-50 shadow-sm">
                    <span className="font-bold text-slate-700">{e.label}</span>
                    <div className="flex items-center gap-3">
                      {e.change !== null && (
                        <span className={`text-xs font-bold flex items-center gap-0.5 ${e.change > 0 ? 'text-rose-500' : e.change < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {e.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {e.change > 0 ? '+' : ''}{e.change} টাকা
                        </span>
                      )}
                      <span className="font-black text-[#064E3B] text-lg">
                        {e.today ? `৳${e.today}` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
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
