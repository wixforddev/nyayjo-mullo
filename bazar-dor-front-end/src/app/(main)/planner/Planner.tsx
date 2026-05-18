'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, Minus, Plus, ChevronRight, Search, Car, ArrowRight, TrendingDown, CheckCircle2, AlertTriangle, Navigation, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FoodRescue } from '@/components/FoodRescue';
import { useGetBazarsQuery, useGetNearbyBazarsQuery } from '../../../store/api/bazarApi';
import { useGetPricesQuery } from '../../../store/api/priceApi';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { distanceKm } from '../../../lib/distance';

const SAVINGS_KEY = 'bazar_savings';

function persistSaving(amount: number) {
  try {
    const prev = JSON.parse(localStorage.getItem(SAVINGS_KEY) || '[]');
    prev.push({ amount, date: new Date().toISOString() });
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(prev));
  } catch {}
}

export function Planner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab]               = useState(searchParams.get('tab') === 'rescue' ? 'rescue' : 'planner');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery]           = useState('');
  const [bazarSearch, setBazarSearch]           = useState('');
  const [bazarDropdownOpen, setBazarDropdownOpen] = useState(false);
  const [selectedBazarId, setSelectedBazarId]   = useState('');
  const bazarRef = useRef<HTMLDivElement>(null);
  const [travelCost, setTravelCost]             = useState('');

  const { location: userLocation } = useUserLocation();

  // When location available: nearby bazars within 25km (covers all reachable bazars)
  // When no location: server-side text search so any bazar can be found regardless of DB size
  const { data: bazarsRes, isLoading: loadingBazars1 } = useGetBazarsQuery(
    { search: bazarSearch || undefined, limit: 50 },
    { skip: !!userLocation },
  );
  const { data: nearbyBazarsRes, isLoading: loadingBazars2 } = useGetNearbyBazarsQuery(
    { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 25, limit: 100 },
    { skip: !userLocation },
  );
  const loadingBazars = loadingBazars1 || loadingBazars2;

  const { data: allPricesRes,   isFetching: loadingAllPrices } = useGetPricesQuery({ limit: 200 });
  const { data: bazarPricesRes, isFetching: loadingBazarPrices } = useGetPricesQuery(
    { bazarId: selectedBazarId, limit: 200 },
    { skip: !selectedBazarId }
  );

  // Full list used for comparison and bazar name lookup
  const bazars: any[] = userLocation
    ? (nearbyBazarsRes?.data?.attributes || [])
    : (bazarsRes?.data?.attributes?.data || []);

  // Autocomplete options: filter by typed text, but show all when search matches selected bazar name
  const selectedBazarName = selectedBazarId
    ? (bazars.find((b: any) => b._id === selectedBazarId)?.nameBn ||
       bazars.find((b: any) => b._id === selectedBazarId)?.name || '')
    : '';
  const bazarOptions = bazarSearch && bazarSearch !== selectedBazarName
    ? bazars.filter((b: any) =>
        b.name?.toLowerCase().includes(bazarSearch.toLowerCase()) ||
        b.nameBn?.includes(bazarSearch) ||
        b.area?.toLowerCase().includes(bazarSearch.toLowerCase())
      )
    : bazars;

  useEffect(() => {
    const saved = localStorage.getItem('defaultBazarId');
    if (saved) setSelectedBazarId(saved);
  }, []);

  // When bazars load, populate search field with selected bazar name
  useEffect(() => {
    if (selectedBazarId && !bazarSearch && bazars.length > 0) {
      const b = bazars.find((b: any) => b._id === selectedBazarId);
      if (b) setBazarSearch(b.nameBn || b.name || '');
    }
  }, [bazars, selectedBazarId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    router.replace(`/planner?${params.toString()}`);
  }, [activeTab, router]);

  const TODAY_MS = 24 * 60 * 60 * 1000;
  const rawPrices: any[] = (selectedBazarId
    ? bazarPricesRes?.data?.attributes?.data
    : allPricesRes?.data?.attributes?.data) || [];
  const allPrices: any[] = allPricesRes?.data?.attributes?.data || [];

  const refPrices = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    allPrices.forEach((p: any) => {
      const pid = typeof p.productId === 'object' ? p.productId?._id : p.productId;
      if (!pid) return;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(p.price);
    });
    const result: Record<string, number> = {};
    Object.entries(grouped).forEach(([pid, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      result[pid] = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    });
    return result;
  }, [allPrices]);

  const bazarProductPriceMap = useMemo(() => {
    const bpp: Record<string, Record<string, number>> = {};
    allPrices.forEach((p: any) => {
      const bid = typeof p.bazarId === 'object' ? p.bazarId?._id : p.bazarId;
      const pid = typeof p.productId === 'object' ? p.productId?._id : p.productId;
      if (!bid || !pid) return;
      if (!bpp[bid]) bpp[bid] = {};
      if (bpp[bid][pid] === undefined) bpp[bid][pid] = p.price;
    });
    return bpp;
  }, [allPrices]);

  const products = useMemo(() => {
    const todayPrices = rawPrices.filter(
      (p: any) => Date.now() - new Date(p.createdAt).getTime() < TODAY_MS
    );
    const seen = new Set<string>();
    return todayPrices
      .filter((p: any) => {
        const pid = typeof p.productId === 'object' ? p.productId?._id : p.productId;
        if (!pid || seen.has(pid)) return false;
        seen.add(pid);
        return true;
      })
      .map((p: any) => ({
        ...(typeof p.productId === 'object' ? p.productId : { _id: p.productId }),
        currentPrice: p.price,
        priceEntry: p,
      }));
  }, [rawPrices]);

  const loadingProducts = selectedBazarId ? loadingBazarPrices : loadingAllPrices;
  const getDisplayPrice = (product: any) => product.currentPrice ?? product.defaultPrice ?? 0;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p: any) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameBn?.includes(searchQuery)
    );
  }, [searchQuery, products]);

  const bazarComparisons = useMemo(() => {
    const totalSelected = Object.keys(selectedProducts).length;
    if (totalSelected === 0 || bazars.length === 0) return [];
    return bazars
      .map((b: any) => {
        const priceMap = bazarProductPriceMap[b._id] || {};
        let total = 0, matched = 0;
        Object.entries(selectedProducts).forEach(([pid, qty]) => {
          if (priceMap[pid] !== undefined) {
            total += priceMap[pid] * (qty as number);
            matched++;
          }
        });
        const coverage = matched / totalSelected;
        const dist = userLocation && b.lat && b.lng
          ? distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
          : null;
        return { bazar: b, total: Math.round(total), matched, coverage, dist };
      })
      .filter(r => r.coverage >= 0.5 && r.total > 0)
      .sort((a, b) => a.total - b.total);
  }, [selectedProducts, bazarProductPriceMap, bazars, userLocation]);

  const selectedComp  = bazarComparisons.find(r => r.bazar._id === selectedBazarId);
  const cheapest      = bazarComparisons[0];
  const isAlreadyBest = cheapest?.bazar._id === selectedBazarId;

  const savingVsAvg = useMemo(() => {
    if (!isAlreadyBest || !selectedComp || bazarComparisons.length < 2) return null;
    const others = bazarComparisons.filter(r => r.bazar._id !== selectedBazarId);
    const avg = others.reduce((s, r) => s + r.total, 0) / others.length;
    return Math.round(avg - selectedComp.total);
  }, [isAlreadyBest, selectedComp, bazarComparisons, selectedBazarId]);

  const savingIfSwitch = !isAlreadyBest && selectedComp && cheapest
    ? Math.round(selectedComp.total - cheapest.total)
    : null;

  const handleToggle = (id: string) => {
    setSelectedProducts(prev => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 1 };
    });
  };
  const handleQty = (id: string, delta: number) => {
    setSelectedProducts(prev => {
      const next = (prev[id] || 0) + delta;
      if (next <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: next };
    });
  };

  const getSaving = (productId: string, currentPrice: number, qty: number) => {
    const ref = refPrices[productId] || 0;
    return ref > currentPrice ? Math.round((ref - currentPrice) * qty) : 0;
  };

  const productCost = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find((pr: any) => pr._id === id);
    return sum + (getDisplayPrice(p || {}) * qty);
  }, 0);
  const travel      = parseFloat(travelCost) || 0;
  const totalCost   = productCost + travel;
  const grossSaving = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find((pr: any) => pr._id === id);
    return sum + (p ? getSaving(p._id, getDisplayPrice(p), qty) : 0);
  }, 0);
  const displaySaving = isAlreadyBest && savingVsAvg && savingVsAvg > 0
    ? Math.max(0, savingVsAvg - travel)
    : Math.max(0, grossSaving - travel);

  const selectBazar = (bid: string) => {
    setSelectedBazarId(bid);
    localStorage.setItem('defaultBazarId', bid);
    const b = bazars.find((b: any) => b._id === bid);
    if (b) setBazarSearch(b.nameBn || b.name || '');
    setBazarDropdownOpen(false);
  };

  const clearBazar = () => {
    setSelectedBazarId('');
    setBazarSearch('');
    setBazarDropdownOpen(false);
    localStorage.removeItem('defaultBazarId');
  };

  const handleCalculate = () => {
    const items = Object.entries(selectedProducts).map(([id, qty]) => {
      const p = products.find((pr: any) => pr._id === id);
      const price = getDisplayPrice(p || {});
      return {
        productId: id,
        name: p?.nameBn || p?.name,
        qty, price,
        icon: p?.icon,
        saving: p ? getSaving(p._id, price, qty) : 0,
        refPrice: refPrices[id] || price,
      };
    });
    if (displaySaving > 0) persistSaving(displaySaving);
    sessionStorage.setItem('plannerResult', JSON.stringify({
      totalCost: productCost,
      savings: displaySaving,
      grossSaving,
      savingVsAvg: savingVsAvg || 0,
      savingIfSwitch: savingIfSwitch || 0,
      isAlreadyBest,
      bazarId: selectedBazarId,
      bazarName: bazars.find((b: any) => b._id === selectedBazarId)?.nameBn || 'সব বাজার',
      itemCount: Object.keys(selectedProducts).length,
      travelCost: travel,
      items,
      comparisons: bazarComparisons.slice(0, 5).map(r => ({
        name: r.bazar.nameBn || r.bazar.name,
        total: r.total,
        dist: r.dist,
      })),
    }));
    router.push('/result');
  };

  const selectedCount = Object.keys(selectedProducts).length;

  return (
    <div className="flex flex-col gap-3 sm:gap-5 pb-24 md:pb-6  w-full">

      {/* ── Header & Tabs ── */}
      <div className="glass-card p-4 sm:p-6 text-center flex flex-col gap-3 sm:gap-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B] mb-0.5">স্মার্ট প্ল্যানার</h1>
          <p className="text-xs text-slate-500">আপনার বাজার ও রান্না সহজ করুন</p>
        </div>
        <div className="bg-slate-100/60 p-1 rounded-2xl flex items-center">
          {['planner', 'rescue'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white text-[#064E3B] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}>
              {tab === 'planner' ? 'বাজার প্ল্যানার' : 'ফুড রেসকিউ'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'rescue' ? <FoodRescue /> : (
        <>
          {/* ══════════════════════════════════════════
              MOBILE LAYOUT  (hidden on lg+)
          ══════════════════════════════════════════ */}
          <div className="flex flex-col gap-3 lg:hidden">

            {/* Info card */}
            <div className={`glass-card relative${bazarDropdownOpen ? ' z-20' : ''}`}>
              <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-[#064E3B]">প্রাথমিক তথ্য</h2>
              </div>

              {/* Bazar selector */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> আপনার বাজার
                  </label>
                  {userLocation && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> কাছের বাজার
                    </span>
                  )}
                </div>
                {/* Bazar autocomplete */}
                <div className="relative" ref={bazarRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="বাজার খুঁজুন বা বেছে নিন..."
                      value={bazarSearch}
                      onChange={e => { setBazarSearch(e.target.value); setBazarDropdownOpen(true); if (selectedBazarId) setSelectedBazarId(''); }}
                      onFocus={() => setBazarDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setBazarDropdownOpen(false), 150)}
                      className={`w-full h-10 pl-8 pr-8 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300/30 transition-colors ${selectedBazarId ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 focus:bg-white'}`}
                    />
                    {selectedBazarId ? (
                      <button onMouseDown={clearBazar} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : loadingBazars ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 rotate-90 pointer-events-none" />
                    )}
                  </div>
                  {bazarDropdownOpen && bazarOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                      {bazarOptions.slice(0, 20).map((b: any) => {
                        const dist = userLocation && b.lat && b.lng ? distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : null;
                        return (
                          <button key={b._id} onMouseDown={() => selectBazar(b._id)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-slate-100 last:border-0 transition-colors ${b._id === selectedBazarId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 truncate">{b.nameBn || b.name}</p>
                              {b.area && <p className="text-[10px] text-slate-400 truncate">{b.area}</p>}
                            </div>
                            {dist !== null && (
                              <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                                {dist < 1 ? `${Math.round(dist * 1000)}মি` : `${dist.toFixed(1)}কিমি`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Travel cost */}
              <div className="px-4 pb-4">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                  <Car className="w-3 h-3" /> যাতায়াত খরচ (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">৳</span>
                  <input type="number" placeholder="0" value={travelCost}
                    onChange={e => setTravelCost(e.target.value)} min="0"
                    className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/40" />
                </div>
              </div>
            </div>

            {/* Comparison banner — mobile */}
            {selectedCount > 0 && bazarComparisons.length >= 2 && (
              isAlreadyBest && savingVsAvg && savingVsAvg > 0 ? (
                <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-700">সেরা বাজার বেছেছেন!</p>
                    <p className="text-xs text-emerald-600">আশেপাশের চেয়ে <strong>৳{savingVsAvg}</strong> সস্তা</p>
                  </div>
                </div>
              ) : !isAlreadyBest && cheapest && savingIfSwitch && savingIfSwitch > 0 ? (
                <div className="flex items-center gap-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-700">সস্তা বাজার পাওয়া গেছে</p>
                    <p className="text-xs text-amber-600">
                      <strong>{cheapest.bazar.nameBn || cheapest.bazar.name}</strong> — <strong>৳{savingIfSwitch}</strong> কম
                    </p>
                  </div>
                  <button onClick={() => selectBazar(cheapest.bazar._id)}
                    className="shrink-0 text-xs font-bold text-white bg-[#064E3B] px-3 py-1.5 rounded-xl">
                    বদলান
                  </button>
                </div>
              ) : null
            )}

            {/* Product card — mobile */}
            <div className="glass-card overflow-hidden">
              {/* Card header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-sm font-bold text-[#064E3B]">পণ্য নির্বাচন করুন</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedCount > 0 ? 'bg-[#064E3B] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {selectedCount} টি
                </span>
              </div>

              {/* Search */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30 focus:bg-white transition-colors" />
                </div>
              </div>

              {/* Product list */}
              {loadingProducts ? (
                <div className="flex flex-col divide-y divide-slate-100">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0 animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded-full w-3/5 animate-pulse" />
                        <div className="h-3 bg-slate-100 rounded-full w-2/5 animate-pulse" />
                      </div>
                      <div className="w-8 h-8 bg-slate-100 rounded-xl shrink-0 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm">{searchQuery ? 'কোনো পণ্য পাওয়া যায়নি' : 'আজকে কোনো দাম সাবমিট হয়নি'}</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100/80">
                  {filteredProducts.map((product: any) => {
                    const isSelected = !!selectedProducts[product._id];
                    const qty        = selectedProducts[product._id] || 0;
                    const price      = getDisplayPrice(product);
                    const ref        = refPrices[product._id];
                    const cheaper    = ref && ref > price ? Math.round(ref - price) : 0;
                    return (
                      <div key={product._id}
                        className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${isSelected ? 'bg-emerald-50/60' : ''}`}>
                        <div onClick={() => handleToggle(product._id)}
                          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm cursor-pointer shrink-0 border border-slate-100">
                          {product.icon || '🛒'}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isSelected && handleToggle(product._id)}>
                          <p className="font-semibold text-[#064E3B] text-sm leading-tight truncate">{product.nameBn || product.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-400">{product.unit}</span>
                            <span className="text-slate-200 text-xs">·</span>
                            <span className="font-bold text-sm text-[#064E3B]">৳{price}</span>
                            {cheaper > 0 && (
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 rounded-full">
                                ↓৳{cheaper}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-[#064E3B] rounded-xl px-1.5 py-1 shrink-0">
                            <button onClick={e => { e.stopPropagation(); handleQty(product._id, -1); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 text-white active:scale-90 transition-transform">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center font-bold text-sm text-white">{qty}</span>
                            <button onClick={e => { e.stopPropagation(); handleQty(product._id, 1); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 text-white active:scale-90 transition-transform">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleToggle(product._id)}
                            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-transform shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {/* bottom spacer so last item clears the floating button */}
                  <div className="h-4" />
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              DESKTOP LAYOUT  (hidden below lg)
          ══════════════════════════════════════════ */}
          <div className="hidden lg:flex gap-6 items-start">

            {/* Left panel */}
            <div className="glass-card p-6 flex flex-col gap-4 w-72 shrink-0">
              <h2 className="text-lg font-bold text-[#064E3B]">প্রাথমিক তথ্য</h2>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> আপনার বাজার
                  </label>
                  {userLocation && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Navigation className="w-3 h-3" /> কাছের বাজার
                    </span>
                  )}
                </div>
                {/* Bazar autocomplete — desktop */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="বাজার খুঁজুন বা বেছে নিন..."
                      value={bazarSearch}
                      onChange={e => { setBazarSearch(e.target.value); setBazarDropdownOpen(true); if (selectedBazarId) setSelectedBazarId(''); }}
                      onFocus={() => setBazarDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setBazarDropdownOpen(false), 150)}
                      className={`w-full h-12 pl-10 pr-10 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300/30 transition-colors ${selectedBazarId ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white/50 focus:bg-white'}`}
                    />
                    {selectedBazarId ? (
                      <button onMouseDown={clearBazar} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700">
                        <X className="w-4 h-4" />
                      </button>
                    ) : loadingBazars ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    )}
                  </div>
                  {bazarDropdownOpen && bazarOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {bazarOptions.slice(0, 20).map((b: any) => {
                        const dist = userLocation && b.lat && b.lng ? distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng) : null;
                        return (
                          <button key={b._id} onMouseDown={() => selectBazar(b._id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 last:border-0 transition-colors ${b._id === selectedBazarId ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{b.nameBn || b.name}</p>
                              {b.area && <p className="text-xs text-slate-400 truncate">{b.area}</p>}
                            </div>
                            {dist !== null && (
                              <span className="text-xs font-bold text-emerald-600 shrink-0">
                                {dist < 1 ? `${Math.round(dist * 1000)}মি` : `${dist.toFixed(1)}কিমি`}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <Car className="w-3.5 h-3.5" /> যাতায়াত খরচ (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                  <input type="number" placeholder="0" value={travelCost}
                    onChange={e => setTravelCost(e.target.value)} min="0"
                    className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
                </div>
              </div>

              {/* Bazar comparison — desktop */}
              {selectedCount > 0 && bazarComparisons.length >= 2 && (
                isAlreadyBest && savingVsAvg && savingVsAvg > 0 ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-sm font-bold text-emerald-700">সেরা বাজার বেছেছেন!</p>
                    </div>
                    <p className="text-xs text-emerald-600">আশেপাশের গড়ের চেয়ে <strong className="text-emerald-800">৳{savingVsAvg}</strong> সস্তা</p>
                    <div className="flex flex-col gap-1 mt-1">
                      {bazarComparisons.slice(0, 4).map((r, i) => (
                        <div key={r.bazar._id} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 ${r.bazar._id === selectedBazarId ? 'bg-emerald-100 font-bold text-emerald-800' : 'text-slate-500'}`}>
                          <span className="truncate mr-2">{i === 0 && r.bazar._id === selectedBazarId ? '✓ ' : ''}{r.bazar.nameBn || r.bazar.name}</span>
                          <span className="shrink-0">৳{r.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !isAlreadyBest && cheapest && savingIfSwitch && savingIfSwitch > 0 ? (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm font-bold text-amber-700">সস্তা বাজার পাওয়া গেছে</p>
                    </div>
                    <p className="text-xs text-amber-600">
                      <strong>{cheapest.bazar.nameBn || cheapest.bazar.name}</strong> এ <strong className="text-amber-800">৳{savingIfSwitch}</strong> সাশ্রয়
                      {cheapest.dist !== null && ` (${cheapest.dist.toFixed(1)} কিমি)`}
                    </p>
                    <div className="flex flex-col gap-1">
                      {bazarComparisons.slice(0, 4).map((r) => (
                        <div key={r.bazar._id} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 ${r.bazar._id === cheapest.bazar._id ? 'bg-emerald-100 font-bold text-emerald-800' : r.bazar._id === selectedBazarId ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>
                          <span className="truncate mr-2">
                            {r.bazar._id === cheapest.bazar._id ? '✓ ' : r.bazar._id === selectedBazarId ? '→ ' : ''}
                            {r.bazar.nameBn || r.bazar.name}
                          </span>
                          <span className="shrink-0">৳{r.total}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => selectBazar(cheapest.bazar._id)}
                      className="w-full text-xs font-bold text-white bg-[#064E3B] px-3 py-2 rounded-xl hover:bg-[#043d2e] transition">
                      {cheapest.bazar.nameBn || cheapest.bazar.name} এ বদলান
                    </button>
                  </div>
                ) : !selectedBazarId && cheapest ? (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
                    <p className="text-xs font-bold text-blue-700">💡 সাজেস্টেড বাজার</p>
                    <p className="text-sm font-bold text-blue-800">{cheapest.bazar.nameBn || cheapest.bazar.name}</p>
                    <p className="text-xs text-blue-600">মোট: ৳{cheapest.total}{cheapest.dist !== null && ` · ${cheapest.dist.toFixed(1)} কিমি`}</p>
                    <button onClick={() => selectBazar(cheapest.bazar._id)}
                      className="w-full text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl hover:bg-blue-700 transition">
                      এই বাজার বেছে নিন
                    </button>
                  </div>
                ) : null
              )}

              {/* Selected items summary — desktop */}
              {selectedCount > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-500">নির্বাচিত পণ্য ({selectedCount})</p>
                  <div className="flex flex-col max-h-52 overflow-y-auto">
                    {Object.entries(selectedProducts).map(([id, qty]) => {
                      const p = products.find((pr: any) => pr._id === id);
                      if (!p) return null;
                      const price = getDisplayPrice(p);
                      const saving = getSaving(p._id, price, qty);
                      return (
                        <div key={id} className="flex justify-between items-start text-xs text-slate-600 py-1.5 border-b border-slate-100 last:border-0">
                          <span className="truncate mr-2">{p.icon} {p.nameBn || p.name} × {qty}</span>
                          <div className="text-right shrink-0">
                            <span className="font-bold">৳{price * qty}</span>
                            {saving > 0 && <span className="block text-[10px] text-emerald-600">-৳{saving}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Product grid — desktop */}
            <div className="glass-card p-6 flex flex-col gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#064E3B]">পণ্য নির্বাচন করুন</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${selectedCount > 0 ? 'bg-[#064E3B] text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  {selectedCount} টি
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-3xl mb-2">🛒</p>
                  <p className="text-sm">{searchQuery ? 'কোনো পণ্য পাওয়া যায়নি' : 'আজকে কোনো দাম সাবমিট হয়নি'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map((product: any) => {
                    const isSelected = !!selectedProducts[product._id];
                    const qty        = selectedProducts[product._id] || 0;
                    const price      = getDisplayPrice(product);
                    const ref        = refPrices[product._id];
                    const cheaper    = ref && ref > price ? Math.round(ref - price) : 0;
                    return (
                      <div key={product._id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50/30'
                            : 'border-slate-100 bg-white/60 hover:border-slate-200'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div onClick={() => handleToggle(product._id)}
                            className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm cursor-pointer shrink-0 border border-slate-100/80">
                            {product.icon || '🛒'}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isSelected && handleToggle(product._id)}>
                            <p className="font-bold text-[#064E3B] text-sm leading-tight truncate">{product.nameBn || product.name}</p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-400">{product.unit}</span>
                              <span className="text-slate-200 text-xs">·</span>
                              <span className="font-bold text-sm text-[#064E3B]">৳{price}</span>
                              {cheaper > 0 && (
                                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 rounded-full">
                                  ↓৳{cheaper}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-[#064E3B] rounded-xl px-1.5 py-1.5 shrink-0">
                              <button onClick={e => { e.stopPropagation(); handleQty(product._id, -1); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:scale-90 transition-transform">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-6 text-center font-bold text-sm text-white">{qty}</span>
                              <button onClick={e => { e.stopPropagation(); handleQty(product._id, 1); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25 active:scale-90 transition-transform">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleToggle(product._id)}
                              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 active:scale-90 transition-all shrink-0">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Floating Calculate Button ── */}
          {selectedCount > 0 && (
            <div className="fixed bottom-[88px] md:bottom-6 left-0 right-0 md:left-16 lg:left-60 px-4 z-40 flex justify-center pointer-events-none">
              <button onClick={handleCalculate}
                className="pointer-events-auto w-full max-w-sm md:max-w-lg bg-[#064E3B] text-white px-5 py-4 rounded-2xl flex items-center justify-between shadow-[0_8px_28px_rgba(6,78,59,0.35)] hover:bg-[#043d2e] active:scale-[0.98] transition-all">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-emerald-300/80 font-medium uppercase tracking-wide">মোট খরচ</span>
                  <span className="font-black text-xl leading-tight">৳ {totalCost}</span>
                  {displaySaving > 0 && (
                    <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {isAlreadyBest ? `আশেপাশের চেয়ে ৳${displaySaving} সস্তা` : `৳${displaySaving} সাশ্রয়`}
                    </span>
                  )}
                  {!isAlreadyBest && savingIfSwitch && savingIfSwitch > 0 && (
                    <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      ⚠ বদলালে ৳{savingIfSwitch} কম
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-white/15 px-4 py-2.5 rounded-xl">
                  <span className="font-bold text-sm">হিসাব করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
