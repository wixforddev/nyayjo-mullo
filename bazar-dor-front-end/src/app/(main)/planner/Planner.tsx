'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapPin, Minus, Plus, ChevronRight, Search, Car, ArrowRight, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FoodRescue } from '@/components/FoodRescue';
import { useGetBazarsQuery } from '../../../store/api/bazarApi';
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
  const [selectedBazarId, setSelectedBazarId]   = useState('');
  const [travelCost, setTravelCost]             = useState('');

  const { location: userLocation }                                              = useUserLocation();
  const { data: bazarsRes,      isLoading: loadingBazars }                      = useGetBazarsQuery({ limit: 30 });
  const { data: allPricesRes,   isFetching: loadingAllPrices }                  = useGetPricesQuery({ limit: 200 });
  const { data: bazarPricesRes, isFetching: loadingBazarPrices }                = useGetPricesQuery(
    { bazarId: selectedBazarId, limit: 200 },
    { skip: !selectedBazarId }
  );

  const bazars = bazarsRes?.data?.attributes?.data || [];

  useEffect(() => {
    const saved = localStorage.getItem('defaultBazarId');
    if (saved) setSelectedBazarId(saved);
  }, []);

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

  // Median reference price per product (all bazars, all recent prices)
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

  // Per-bazar → per-product latest price mapping (for bazar comparison)
  const bazarProductPriceMap = useMemo(() => {
    const bpp: Record<string, Record<string, number>> = {};
    allPrices.forEach((p: any) => {
      const bid = typeof p.bazarId === 'object' ? p.bazarId?._id : p.bazarId;
      const pid = typeof p.productId === 'object' ? p.productId?._id : p.productId;
      if (!bid || !pid) return;
      if (!bpp[bid]) bpp[bid] = {};
      // keep the entry (later duplicates may overwrite, but order is fine for our purpose)
      if (bpp[bid][pid] === undefined) bpp[bid][pid] = p.price;
    });
    return bpp;
  }, [allPrices]);

  // Today-only products, deduplicated by productId
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
  const getDisplayPrice  = (product: any) => product.currentPrice ?? product.defaultPrice ?? 0;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p: any) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameBn?.includes(searchQuery)
    );
  }, [searchQuery, products]);

  // ── Bazar comparison (core new feature) ───────────────────────
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
        return {
          bazar: b,
          total: Math.round(total),
          matched,
          coverage,
          dist,
        };
      })
      .filter(r => r.coverage >= 0.5 && r.total > 0)
      .sort((a, b) => a.total - b.total);
  }, [selectedProducts, bazarProductPriceMap, bazars, userLocation]);

  const selectedComp    = bazarComparisons.find(r => r.bazar._id === selectedBazarId);
  const cheapest        = bazarComparisons[0];
  const isAlreadyBest   = cheapest?.bazar._id === selectedBazarId;

  // If cheapest → saving vs avg of others
  const savingVsAvg = useMemo(() => {
    if (!isAlreadyBest || !selectedComp || bazarComparisons.length < 2) return null;
    const others = bazarComparisons.filter(r => r.bazar._id !== selectedBazarId);
    const avg = others.reduce((s, r) => s + r.total, 0) / others.length;
    return Math.round(avg - selectedComp.total);
  }, [isAlreadyBest, selectedComp, bazarComparisons, selectedBazarId]);

  // If not cheapest → how much cheaper is the cheapest
  const savingIfSwitch = !isAlreadyBest && selectedComp && cheapest
    ? Math.round(selectedComp.total - cheapest.total)
    : null;

  // ── Cost & saving totals ───────────────────────────────────────
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

  const productCost  = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find((pr: any) => pr._id === id);
    return sum + (getDisplayPrice(p || {}) * qty);
  }, 0);
  const travel       = parseFloat(travelCost) || 0;
  const totalCost    = productCost + travel;
  const grossSaving  = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find((pr: any) => pr._id === id);
    return sum + (p ? getSaving(p._id, getDisplayPrice(p), qty) : 0);
  }, 0);
  // Use bazar-comparison saving when available, otherwise median-based
  const displaySaving = isAlreadyBest && savingVsAvg && savingVsAvg > 0
    ? Math.max(0, savingVsAvg - travel)
    : Math.max(0, grossSaving - travel);

  const selectBazar = (bid: string) => {
    setSelectedBazarId(bid);
    localStorage.setItem('defaultBazarId', bid);
  };

  const handleCalculate = () => {
    const items = Object.entries(selectedProducts).map(([id, qty]) => {
      const p = products.find((pr: any) => pr._id === id);
      const price = getDisplayPrice(p || {});
      return {
        productId: id,
        name: p?.nameBn || p?.name,
        qty,
        price,
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

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header & Tabs */}
      <div className="glass-card p-6 text-center flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#064E3B] mb-2">স্মার্ট প্ল্যানার</h1>
          <p className="text-sm text-slate-500">আপনার বাজার ও রান্না সহজ করুন</p>
        </div>
        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex items-center border border-slate-200/50">
          {['planner', 'rescue'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-white text-[#064E3B] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab === 'planner' ? 'বাজার প্ল্যানার' : 'ফুড রেসকিউ'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'rescue' ? <FoodRescue /> : (
        <>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left Panel ── */}
            <div className="glass-card p-6 flex flex-col gap-4 lg:w-72 lg:shrink-0">
              <h2 className="text-lg font-bold text-[#064E3B] mb-2">প্রাথমিক তথ্য</h2>

              {/* Bazar selector */}
              <div>
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> আপনার বাজার
                </label>
                <div className="relative">
                  {loadingBazars ? (
                    <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <>
                      <select value={selectedBazarId} onChange={e => selectBazar(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300/30 appearance-none text-sm">
                        <option value="">বাজার বেছে নিন</option>
                        {bazars.map((b: any) => (
                          <option key={b._id} value={b._id}>{b.nameBn || b.name}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </>
                  )}
                </div>
              </div>

              {/* Travel cost */}
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

              {/* ── Bazar comparison banner ── */}
              {Object.keys(selectedProducts).length > 0 && bazarComparisons.length >= 2 && (

                // Case A: Selected bazar IS the cheapest
                isAlreadyBest && savingVsAvg && savingVsAvg > 0 ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-sm font-bold text-emerald-700">সেরা বাজার বেছেছেন!</p>
                    </div>
                    <p className="text-xs text-emerald-600 leading-relaxed">
                      আশেপাশের বাজারের গড়ের চেয়ে
                      <strong className="text-emerald-800"> ৳{savingVsAvg} </strong>
                      সস্তায় কিনছেন
                    </p>
                    {/* Mini comparison list */}
                    <div className="mt-2 flex flex-col gap-1">
                      {bazarComparisons.slice(0, 4).map((r, i) => (
                        <div key={r.bazar._id} className={`flex items-center justify-between text-xs rounded-lg px-2 py-1 ${r.bazar._id === selectedBazarId ? 'bg-emerald-100 font-bold text-emerald-800' : 'text-slate-500'}`}>
                          <span className="truncate mr-2">{i === 0 && r.bazar._id === selectedBazarId ? '✓ ' : ''}{r.bazar.nameBn || r.bazar.name}</span>
                          <span className="shrink-0">৳{r.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                // Case B: A cheaper nearby bazar exists
                ) : !isAlreadyBest && cheapest && savingIfSwitch && savingIfSwitch > 0 ? (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm font-bold text-amber-700">সস্তা বাজার পাওয়া গেছে</p>
                    </div>
                    <p className="text-xs text-amber-600">
                      <strong>{cheapest.bazar.nameBn || cheapest.bazar.name}</strong> এ গেলে
                      <strong className="text-amber-800"> ৳{savingIfSwitch} </strong>
                      সাশ্রয় হবে
                      {cheapest.dist !== null && ` (${cheapest.dist.toFixed(1)} কিমি)`}
                    </p>
                    {/* Mini comparison list */}
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

                // Case C: No bazar selected — suggest cheapest
                ) : !selectedBazarId && cheapest ? (
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col gap-2">
                    <p className="text-xs font-bold text-blue-700">💡 সাজেস্টেড বাজার</p>
                    <p className="text-sm font-bold text-blue-800">{cheapest.bazar.nameBn || cheapest.bazar.name}</p>
                    <p className="text-xs text-blue-600">
                      নির্বাচিত পণ্যের মোট: ৳{cheapest.total}
                      {cheapest.dist !== null && ` · ${cheapest.dist.toFixed(1)} কিমি`}
                    </p>
                    <button onClick={() => selectBazar(cheapest.bazar._id)}
                      className="w-full text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-xl hover:bg-blue-700 transition">
                      এই বাজার বেছে নিন
                    </button>
                  </div>
                ) : null
              )}

              {/* Selected items summary */}
              {Object.keys(selectedProducts).length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-500">নির্বাচিত পণ্য ({Object.keys(selectedProducts).length})</p>
                  {Object.entries(selectedProducts).map(([id, qty]) => {
                    const p = products.find((pr: any) => pr._id === id);
                    if (!p) return null;
                    const price = getDisplayPrice(p);
                    const saving = getSaving(p._id, price, qty);
                    return (
                      <div key={id} className="flex justify-between text-xs text-slate-600 py-1 border-b border-slate-100 last:border-0">
                        <span>{p.icon} {p.nameBn || p.name} × {qty}</span>
                        <div className="text-right">
                          <span className="font-bold">৳{price * qty}</span>
                          {saving > 0 && <span className="block text-[10px] text-emerald-600">-৳{saving}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Product Grid ── */}
            <div className="glass-card p-6 flex flex-col gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#064E3B]">পণ্য নির্বাচন করুন</h2>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {Object.keys(selectedProducts).length} টি
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map((product: any) => {
                    const isSelected = !!selectedProducts[product._id];
                    const qty        = selectedProducts[product._id] || 0;
                    const price      = getDisplayPrice(product);
                    const ref        = refPrices[product._id];
                    const cheaper    = ref && ref > price ? Math.round(ref - price) : 0;
                    return (
                      <div key={product._id}
                        className={`p-3 rounded-xl border transition-all ${isSelected ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-100 bg-white/40 hover:border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <div onClick={() => handleToggle(product._id)}
                            className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm cursor-pointer shrink-0">
                            {product.icon || '🛒'}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isSelected && handleToggle(product._id)}>
                            <h3 className="font-bold text-[#064E3B] text-sm truncate">{product.nameBn || product.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-slate-500">{product.unit}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="font-bold text-sm text-[#064E3B]">৳{price}</span>
                              {cheaper > 0 && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                  মেডিয়ানের ↓৳{cheaper}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-100 shrink-0">
                              <button onClick={e => { e.stopPropagation(); handleQty(product._id, -1); }}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-bold text-sm text-[#064E3B]">{qty}</span>
                              <button onClick={e => { e.stopPropagation(); handleQty(product._id, 1); }}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleToggle(product._id)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-400 transition-colors shrink-0">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && !loadingProducts && (
                    <div className="col-span-3 text-center py-8 text-slate-400">
                      <p className="text-3xl mb-2">🛒</p>
                      <p className="text-sm">{searchQuery ? 'কোনো পণ্য পাওয়া যায়নি' : 'আজকে এখনো কোনো দাম সাবমিট হয়নি'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Floating Calculate Button */}
          {Object.keys(selectedProducts).length > 0 && (
            <div className="fixed bottom-24 left-0 right-0 px-4 z-40 flex justify-center pointer-events-none">
              <button onClick={handleCalculate}
                className="pointer-events-auto max-w-md w-full glass-pill !rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#043d2e] text-white p-4 flex items-center justify-between shadow-[0_12px_32px_rgba(6,78,59,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-emerald-200/80 uppercase tracking-wider font-medium">মোট খরচ</span>
                  <span className="font-bold text-xl">৳ {totalCost}</span>
                  {displaySaving > 0 && (
                    <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {isAlreadyBest ? `আশেপাশের চেয়ে ৳${displaySaving} সস্তা` : `৳${displaySaving} সাশ্রয়`}
                    </span>
                  )}
                  {!isAlreadyBest && savingIfSwitch && savingIfSwitch > 0 && (
                    <span className="text-[10px] text-amber-300 font-semibold mt-0.5">
                      ⚠ বাজার বদলালে আরো ৳{savingIfSwitch} কম
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <span className="font-medium text-sm">হিসাব করুন</span>
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
