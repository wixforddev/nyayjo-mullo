'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, MapPin, ChevronRight, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useGetBazarsQuery } from '../../../store/api/bazarApi';
import { useGetPricesQuery, useVotePriceMutation, useMarkStockOutMutation, useGetPriceHistoryQuery } from '../../../store/api/priceApi';
import { useAppSelector } from '../../../store/hooks';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { distanceKm, formatDistance } from '../../../lib/distance';

export function AllProducts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedBazarId, setSelectedBazarId] = useState(searchParams.get('bazar_id') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProductPrice, setSelectedProductPrice] = useState<any>(null);
  const [isPriceConfirmed, setIsPriceConfirmed] = useState(false);
  const [isStockOutReported, setIsStockOutReported] = useState(false);
  const [alreadyVotedPopup, setAlreadyVotedPopup] = useState(false);
  const [votedPriceIds, setVotedPriceIds] = useState<Set<string>>(new Set());

  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const { location: userLocation } = useUserLocation();

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

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const NEARBY_KM = 10;

  const { data: bazarsRes, isLoading: loadingBazars } = useGetBazarsQuery({ limit: 50 });
  const { data: pricesRes, isFetching: loadingBazarPrices } = useGetPricesQuery(
    { bazarId: selectedBazarId, limit: 200 },
    { skip: !selectedBazarId }
  );
  const { data: recentPricesRes, isFetching: loadingRecentPrices } = useGetPricesQuery(
    { limit: 200 },
    { skip: !!selectedBazarId }
  );
  const { data: priceHistoryRes } = useGetPriceHistoryQuery(
    { productId: selectedProduct?._id, bazarId: selectedBazarId || undefined },
    { skip: !selectedProduct?._id }
  );
  const { data: productSubmissionsRes } = useGetPricesQuery(
    { productId: selectedProduct?._id, limit: 200 },
    { skip: !selectedProduct?._id }
  );

  const [votePrice] = useVotePriceMutation();
  const [markStockOut] = useMarkStockOutMutation();

  const bazars = bazarsRes?.data?.attributes?.data || [];
  const prices = pricesRes?.data?.attributes?.data || [];

  const nearbyBazarIds = userLocation
    ? new Set(bazars.filter((b: any) => b.lat && b.lng && distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) <= NEARBY_KM).map((b: any) => b._id))
    : null;

  const recentAllPrices = (recentPricesRes?.data?.attributes?.data || []).filter((p: any) => {
    if (Date.now() - new Date(p.createdAt).getTime() >= SEVEN_DAYS) return false;
    if (!nearbyBazarIds) return true;
    const bid = typeof p.bazarId === 'object' ? p.bazarId?._id : p.bazarId;
    return nearbyBazarIds.has(bid);
  });

  const sortedBazars = userLocation
    ? [...bazars].sort((a: any, b: any) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : bazars;

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

  const currentBazar = bazars.find((b: any) => b._id === selectedBazarId) as any;
  const loadingProducts = selectedBazarId ? loadingBazarPrices : loadingRecentPrices;

  const isVerifiedPrice = (p: any) => {
    const total = (p?.upvotes || 0) + (p?.downvotes || 0);
    return total >= 10 && (p?.upvotes || 0) / total >= 0.6;
  };

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
    if (mins < 1) return 'এইমাত্র';
    if (mins < 60) return `${mins} মিনিট আগে`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
    return `${Math.floor(hrs / 24)} দিন আগে`;
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

  const getBazarDistance = (bazar: any) => {
    if (!userLocation) return null;
    return distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng);
  };

  return (
    <div className="pb-12">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()}
          className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[#064E3B] truncate">
            {currentBazar ? (currentBazar.nameBn || currentBazar.name) : 'সব পণ্য'}
          </h1>
          <p className="text-xs text-slate-400">{filteredProducts.length}টি পণ্য পাওয়া গেছে</p>
        </div>
      </div>

      {/* Bazar selector */}
      <div className="glass-card p-4 mb-4">
        <div className="inline-flex items-center gap-1.5 w-full">
          <MapPin className="w-4 h-4 text-[#10B981] shrink-0" strokeWidth={2} />
          {loadingBazars ? (
            <span className="text-sm text-slate-400">লোড হচ্ছে...</span>
          ) : (
            <select
              value={selectedBazarId}
              onChange={e => setSelectedBazarId(e.target.value)}
              className="flex-1 text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none appearance-none cursor-pointer">
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
          <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 shrink-0" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
        <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-4 glass-card focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-sm transition-shadow" />
      </div>

      {/* Products grid */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white/60 border border-slate-100 rounded-[16px] p-3 min-h-[110px] animate-pulse">
              <div className="h-4 bg-slate-100 rounded mb-2 w-2/3" />
              <div className="h-3 bg-slate-100 rounded mb-4 w-1/3" />
              <div className="h-6 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-3">🛒</p>
          <p className="font-medium">{selectedBazarId ? 'এই বাজারে এখনো কোনো দাম সাবমিট হয়নি' : 'গত ৭ দিনে কোনো দাম সাবমিট হয়নি'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredProducts.map((product: any, idx: number) => (
            <div key={`${product._id}-${idx}`}
              className="backdrop-blur-md border border-[rgba(15,23,42,0.05)] bg-[rgba(255,255,255,0.85)] rounded-[16px] p-[12px] flex flex-col justify-between min-h-[110px] relative cursor-pointer transition-transform hover:-translate-y-1"
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
      )}

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
                const currentPrice = selectedProductPrice?.price ?? selectedProduct.bazarPrice ?? selectedProduct.defaultPrice;
                const bulkPrice = currentPrice ? Math.round(currentPrice * 0.93) : null;
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
                    {bulkPrice && (
                      <p className="text-xs text-blue-600 font-semibold mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full">
                        💡 ২ {selectedProduct.unit || 'কেজি'}র বেশি কিনলে ৳{bulkPrice}
                      </p>
                    )}
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
                            <button onClick={() => { setSelectedProduct(null); router.push('/submit'); }}
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

      {/* Already-voted popup */}
      {alreadyVotedPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200 px-4">
          <div className="bg-white rounded-[28px] shadow-2xl p-7 w-full max-w-xs text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-white shadow-sm">🗳️</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ইতিমধ্যে ভোট দিয়েছেন</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">আপনি এই দামে আগেই ভোট দিয়েছেন।<br />প্রতিটি দামে একবারই ভোট দেওয়া যাবে।</p>
            <button onClick={() => setAlreadyVotedPopup(false)}
              className="w-full bg-[#064E3B] text-white font-bold py-3.5 rounded-2xl active:scale-95 transition-all">
              বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
