'use client';

import { useState, useEffect } from 'react';
import {
  MapPin, TrendingDown, Clock, ChevronRight, Search,
  ArrowRight, Store, X, Map, LayoutGrid, Navigation,
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PromoBanner } from '@/components/PromoBanner';
import dynamic from 'next/dynamic';
import { useGetProductsQuery } from '../../store/api/productApi';
import { useGetBazarsQuery } from '../../store/api/bazarApi';
import { useGetAlertsQuery } from '../../store/api/alertApi';
import { useGetPricesQuery, useVotePriceMutation, useMarkStockOutMutation } from '../../store/api/priceApi';
import { useAppSelector } from '../../store/hooks';
import { useUserLocation } from '../../hooks/useUserLocation';
import { distanceKm, formatDistance, googleMapsDirectionsUrl } from '../../lib/distance';

const BazarMap = dynamic(() => import('../../components/BazarMap'), { ssr: false });

const sparklineData = [
  { value: 450 }, { value: 430 }, { value: 460 }, { value: 420 }, { value: 400 }, { value: 390 }, { value: 385 },
];
const indexChartData = [
  { date: '১ মার্চ', value: 1150 }, { date: '৫ মার্চ', value: 1180 }, { date: '১০ মার্চ', value: 1120 },
  { date: '১৫ মার্চ', value: 1250 }, { date: '২০ মার্চ', value: 1210 }, { date: '২৫ মার্চ', value: 1260 },
  { date: '৩০ মার্চ', value: 1280 },
];

export function Home() {
  const [selectedBazarId, setSelectedBazarId]   = useState<string>('');
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedProduct, setSelectedProduct]   = useState<any>(null);
  const [selectedProductPrice, setSelectedProductPrice] = useState<any>(null);
  const [isPriceConfirmed, setIsPriceConfirmed] = useState(false);
  const [isStockOutReported, setIsStockOutReported] = useState(false);
  const [isIndexSheetOpen, setIsIndexSheetOpen] = useState(false);
  const [viewMode, setViewMode]                 = useState<'list' | 'map'>('list');
  const [alreadyVotedPopup, setAlreadyVotedPopup] = useState(false);

  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const { location: userLocation, loading: locLoading, refresh: refreshLocation } = useUserLocation();

  const { data: productsRes, isLoading: loadingProducts } = useGetProductsQuery({ limit: 20 });
  const { data: bazarsRes,   isLoading: loadingBazars   } = useGetBazarsQuery({ limit: 50 });
  const { data: alertsRes } = useGetAlertsQuery({ limit: 3 });
  const { data: pricesRes } = useGetPricesQuery(
    selectedBazarId ? { bazarId: selectedBazarId, limit: 50 } : {},
    { skip: !selectedBazarId }
  );

  const [votePrice]    = useVotePriceMutation();
  const [markStockOut] = useMarkStockOutMutation();

  const products = productsRes?.data?.attributes?.data || [];
  const bazars   = bazarsRes?.data?.attributes?.data   || [];
  const alerts   = alertsRes?.data?.attributes?.data   || [];
  const prices   = pricesRes?.data?.attributes?.data   || [];

  // Sort bazars by distance if location available
  const sortedBazars = userLocation
    ? [...bazars].sort((a: any, b: any) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : bazars;

  useEffect(() => {
    const saved = localStorage.getItem('defaultBazarId');
    if (saved && bazars.some((b: any) => b._id === saved)) {
      setSelectedBazarId(saved);
    } else if (sortedBazars.length > 0) {
      setSelectedBazarId((sortedBazars[0] as any)._id);
    }
  }, [bazars]);

  const handleBazarChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBazarId(e.target.value);
    localStorage.setItem('defaultBazarId', e.target.value);
  };

  const handleBazarSelectOnMap = (bazar: any) => {
    setSelectedBazarId(bazar._id);
    localStorage.setItem('defaultBazarId', bazar._id);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsPriceConfirmed(false);
    setIsStockOutReported(false);
    const price = prices.find((p: any) => p.productId?._id === product._id || p.productId === product._id);
    setSelectedProductPrice(price || null);
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated || !selectedProductPrice) return;
    try {
      await votePrice({ priceId: selectedProductPrice._id, voteType }).unwrap();
      setIsPriceConfirmed(true);
    } catch (err: any) {
      // HTTP 409 = already voted
      if (err?.status === 409 || err?.data?.statusCode === 409) {
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

  const currentBazar  = bazars.find((b: any) => b._id === selectedBazarId) as any;
  const basketTotal   = prices.slice(0, 5).reduce((sum: number, p: any) => sum + (p.price || 0), 0);
  const filteredProducts = searchQuery
    ? products.filter((p: any) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.nameBn?.includes(searchQuery))
    : products.slice(0, 8);
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
                      <option value="" disabled>বাজার নির্বাচন করুন</option>
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
                {/* Route to bazar */}
                {currentBazar && userLocation && (
                  <a
                    href={googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, currentBazar.lat, currentBazar.lng)}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    🗺️ Google Maps-এ রুট দেখুন →
                  </a>
                )}
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

          {/* View mode toggle + Search */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
              <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 glass-card focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-sm transition-shadow" />
            </div>
            {/* Map / List toggle */}
            <div className="flex glass-card rounded-2xl overflow-hidden p-1 gap-1 shrink-0">
              <button onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-[#064E3B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> পণ্য
              </button>
              <button onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-[#064E3B] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Map className="w-3.5 h-3.5" /> মানচিত্র
              </button>
            </div>
          </div>

          {/* ── MAP VIEW ── */}
          {viewMode === 'map' && (
            <div className="flex flex-col gap-4">
              {/* Location status */}
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-slate-700">
                  {userLocation ? '📍 আপনার অবস্থান থেকে বাজারগুলো' : '🗺️ সকল বাজার'}
                </p>
                {!userLocation && (
                  <button onClick={refreshLocation}
                    className="text-xs font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                    <Navigation className="w-3.5 h-3.5" /> লোকেশন চালু করুন
                  </button>
                )}
              </div>

              {/* Live Map */}
              <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100">
                <BazarMap
                  bazars={bazars}
                  userLocation={userLocation}
                  selectedBazarId={selectedBazarId}
                  onBazarSelect={handleBazarSelectOnMap}
                  height="420px"
                />
              </div>

              {/* Nearby bazar cards */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-slate-700 px-1">
                  {userLocation ? 'কাছের বাজারগুলো' : 'সব বাজার'}
                </h3>
                {sortedBazars.slice(0, 6).map((bazar: any) => {
                  const dist    = getBazarDistance(bazar);
                  const isSelected = bazar._id === selectedBazarId;
                  return (
                    <button
                      key={bazar._id}
                      onClick={() => handleBazarSelectOnMap(bazar)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-lg shadow-emerald-900/20'
                          : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${isSelected ? 'bg-white/20' : 'bg-emerald-50'}`}>
                        🏪
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {bazar.nameBn || bazar.name}
                        </p>
                        <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                          {bazar.area}{bazar.city && bazar.city !== bazar.area ? `, ${bazar.city}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {dist !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {formatDistance(dist)}
                          </span>
                        )}
                        {userLocation && (
                          <a
                            href={googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className={`text-[10px] font-semibold flex items-center gap-0.5 ${isSelected ? 'text-white/80' : 'text-blue-500'}`}
                          >
                            🗺️ রুট
                          </a>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PRODUCTS VIEW ── */}
          {viewMode === 'list' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#064E3B]">{searchQuery ? 'অনুসন্ধানের ফলাফল' : 'জনপ্রিয় পণ্য'}</h3>
                {!searchQuery && <button className="text-sm font-medium text-[#10B981]">সব দেখুন</button>}
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white/60 border border-slate-100 rounded-[16px] p-3 min-h-[110px] animate-pulse">
                      <div className="h-4 bg-slate-100 rounded mb-2 w-2/3" />
                      <div className="h-3 bg-slate-100 rounded mb-4 w-1/3" />
                      <div className="h-6 bg-slate-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((product: any) => {
                    const livePrice    = getProductPrice(product._id);
                    const displayPrice = livePrice ?? product.defaultPrice;
                    return (
                      <div key={product._id}
                        className="backdrop-blur-md border border-[rgba(15,23,42,0.05)] bg-[rgba(255,255,255,0.85)] rounded-[16px] p-[12px] flex flex-col justify-between min-h-[110px] relative cursor-pointer transition-transform hover:-translate-y-1"
                        onClick={() => handleProductClick(product)}>
                        <div className="flex justify-between items-start">
                          <div className="pr-1">
                            <h4 className="text-[14px] font-bold text-[#0F172A] m-0 leading-[1.2]">{product.nameBn || product.name}</h4>
                            <p className="text-[11px] text-[#64748B] mt-[2px]">{product.unit}</p>
                          </div>
                          <div className="w-[40px] h-[40px] bg-[#F1F5F9] rounded-[8px] flex items-center justify-center text-2xl shrink-0">
                            {product.icon || '🛒'}
                          </div>
                        </div>
                        <div className="mt-auto flex items-baseline gap-[4px] pt-2">
                          <span className="text-[18px] font-[800] tracking-[-0.5px] text-[#064E3B]">
                            ৳ {displayPrice}
                          </span>
                          {livePrice && <span className="text-[10px] text-emerald-600 font-medium">লাইভ</span>}
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-4 text-center py-12 text-slate-400">
                      <p className="text-4xl mb-2">🔍</p>
                      <p className="font-medium">কোনো পণ্য পাওয়া যায়নি</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Food Rescue card */}
          <div className="glass-card p-6 relative overflow-hidden group cursor-pointer mt-2">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <h2 className="text-[22px] font-bold text-[#064E3B] mb-1 leading-tight">অতিরিক্ত খাবার নষ্ট করবেন না</h2>
                <p className="text-[15px] font-medium text-slate-500 mb-4">যা আছে, তা দিয়েই রান্না করুন</p>
                <Link href="/planner?tab=rescue"
                  className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-5 py-2.5 rounded-full font-medium text-sm shadow-md hover:bg-[#043d2e] transition-colors">
                  রেসিপি দেখুন <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="w-28 h-28 relative shrink-0">
                <img src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=400&auto=format&fit=crop"
                  alt="Fresh Vegetables"
                  className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white/50"
                  referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
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
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center">বিস্তারিত দেখতে ট্যাপ করুন</p>
          </div>

          <PromoBanner />

          {/* Nearby bazars mini list (right column) */}
          {userLocation && sortedBazars.length > 0 && (
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#064E3B] flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" /> কাছের বাজার
                </h3>
                <button onClick={() => setViewMode('map')} className="text-xs text-emerald-600 font-semibold">মানচিত্রে দেখুন →</button>
              </div>
              {sortedBazars.slice(0, 4).map((b: any) => {
                const dist = getBazarDistance(b);
                const isSelected = b._id === selectedBazarId;
                return (
                  <button key={b._id} onClick={() => handleBazarSelectOnMap(b)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left w-full ${
                      isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white/60 border-slate-100 hover:border-emerald-200'
                    }`}>
                    <span className="text-xl">🏪</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{b.nameBn || b.name}</p>
                      <p className="text-xs text-slate-500 truncate">{b.area}</p>
                    </div>
                    {dist !== null && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        {formatDistance(dist)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="glass-card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-[#064E3B]">আজকের সারসংক্ষেপ</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-[#064E3B]">{prices.length || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">নতুন দাম</p>
              </div>
              <div className="bg-blue-50/60 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-blue-700">{bazars.length || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">বাজার</p>
              </div>
              <div className="bg-amber-50/60 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-amber-700">{alerts.length || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">জরুরী এলার্ট</p>
              </div>
              <div className="bg-rose-50/60 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-rose-700">{products.length || '—'}</p>
                <p className="text-xs text-slate-500 mt-1">মোট পণ্য</p>
              </div>
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
              <div className="bg-white rounded-[32px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-4 mt-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full text-2xl mb-3">
                  {selectedProduct.icon || '🛒'}
                </div>
                <h2 className="text-sm font-bold text-slate-500 mb-2">{selectedProduct.nameBn || selectedProduct.name}</h2>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                      ৳ {selectedProductPrice?.price ?? selectedProduct.defaultPrice}
                    </h1>
                    {selectedProductPrice?.isVerified && (
                      <span className="bg-emerald-100/80 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-200/50">✓ ভেরিফায়েড</span>
                    )}
                  </div>
                  <span className="text-base font-semibold text-slate-600">প্রতি {selectedProduct.unit}</span>
                </div>
              </div>

              {selectedProductPrice ? (
                <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-50 mb-4">
                  <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider text-center">আপনার মতামত দিন</h3>
                  {!isAuthenticated ? (
                    <div className="text-center py-2">
                      <p className="text-sm text-slate-500 mb-3">ভোট দিতে লগইন করুন</p>
                      <Link href="/login" className="bg-[#064E3B] text-white px-5 py-2.5 rounded-xl font-bold text-sm">লগইন করুন</Link>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 mb-4">
                        {!isPriceConfirmed ? (
                          <button onClick={() => handleVote('up')}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-emerald-100/50 flex items-center justify-center gap-2">
                            <span>✓</span> সঠিক ({selectedProductPrice.upvotes || 0})
                          </button>
                        ) : (
                          <div className="flex-1 bg-emerald-50/80 text-emerald-700 font-bold py-3.5 rounded-2xl border border-emerald-200/60 flex items-center justify-center">
                            ✨ ভোট যুক্ত হয়েছে
                          </div>
                        )}
                        <button onClick={() => handleVote('down')}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200/60 flex items-center justify-center gap-2">
                          <span>✕</span> ভুল ({selectedProductPrice.downvotes || 0})
                        </button>
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
                  )}
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
              <div className="flex flex-col items-center mt-2 mb-2">
                <p className="text-slate-500 text-sm font-medium mb-1">ঢাকা এসেনশিয়াল বাস্কেট</p>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-3">৳ {basketTotal || 1280}</h2>
              </div>
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">গত ৩০ দিনের ট্রেন্ড</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={indexChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(15,23,42,0.04)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} minTickGap={30} />
                      <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} domain={[1100, 1400]} tickFormatter={(v) => `৳${v}`} width={45} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [`৳${v}`, 'সূচক']} />
                      <Line type="monotone" dataKey="value" stroke="#064E3B" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#064E3B' }} />
                    </LineChart>
                  </ResponsiveContainer>
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
