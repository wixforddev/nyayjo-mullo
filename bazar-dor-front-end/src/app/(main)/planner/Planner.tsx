'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapPin, Minus, Plus, ChevronRight, Search, Car, ArrowRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FoodRescue } from '@/components/FoodRescue';
import { useGetBazarsQuery } from '../../../store/api/bazarApi';
import { useGetPricesQuery } from '../../../store/api/priceApi';

export function Planner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'rescue' ? 'rescue' : 'planner');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBazarId, setSelectedBazarId] = useState('');
  const [travelCost, setTravelCost] = useState('');

  const { data: bazarsRes, isLoading: loadingBazars } = useGetBazarsQuery({ limit: 30 });
  const { data: allPricesRes, isFetching: loadingAllPrices } = useGetPricesQuery({ limit: 200 });
  const { data: bazarPricesRes, isFetching: loadingBazarPrices } = useGetPricesQuery(
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

  // Only today's price submissions, deduplicated by productId (most recent wins)
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

  const totalCost = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find((pr: any) => pr._id === id);
    return sum + (getDisplayPrice(p || {}) * qty);
  }, 0) + (parseFloat(travelCost) || 0);

  const handleCalculate = () => {
    const items = Object.entries(selectedProducts).map(([id, qty]) => {
      const p = products.find((pr: any) => pr._id === id);
      return { productId: id, name: p?.nameBn || p?.name, qty, price: getDisplayPrice(p || {}), icon: p?.icon };
    });
    sessionStorage.setItem('plannerResult', JSON.stringify({
      totalCost,
      savings: totalCost * 0.15,
      bazarId: selectedBazarId,
      bazarName: bazars.find((b: any) => b._id === selectedBazarId)?.nameBn || '',
      itemCount: Object.keys(selectedProducts).length,
      travelCost: parseFloat(travelCost) || 0,
      items,
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

      {activeTab === 'rescue' ? (
        <FoodRescue />
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* Basic Info Panel */}
            <div className="glass-card p-6 flex flex-col gap-4 lg:w-72 lg:shrink-0">
              <h2 className="text-lg font-bold text-[#064E3B] mb-2">প্রাথমিক তথ্য</h2>

              <div>
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" /> আপনার বাজার
                </label>
                <div className="relative">
                  {loadingBazars ? (
                    <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                  ) : (
                    <>
                      <select value={selectedBazarId} onChange={(e) => { setSelectedBazarId(e.target.value); localStorage.setItem('defaultBazarId', e.target.value); }}
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

              <div>
                <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                  <Car className="w-3.5 h-3.5" /> যাতায়াত খরচ (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-num">৳</span>
                  <input type="number" placeholder="0" value={travelCost} onChange={(e) => setTravelCost(e.target.value)} min="0"
                    className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300/30 font-num" />
                </div>
              </div>

              {/* Selected summary */}
              {Object.keys(selectedProducts).length > 0 && (
                <div className="mt-2 bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 mb-2">নির্বাচিত পণ্য ({Object.keys(selectedProducts).length})</p>
                  {Object.entries(selectedProducts).map(([id, qty]) => {
                    const p = products.find((pr: any) => pr._id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex justify-between text-xs text-slate-600 py-1 border-b border-emerald-100 last:border-0">
                        <span>{p.icon} {p.nameBn || p.name} × {qty}</span>
                        <span className="font-bold">৳{getDisplayPrice(p) * qty}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Grid */}
            <div className="glass-card p-6 flex flex-col gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[#064E3B]">পণ্য নির্বাচন করুন</h2>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {Object.keys(selectedProducts).length} টি
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="পণ্য খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredProducts.map((product: any) => {
                    const isSelected = !!selectedProducts[product._id];
                    const qty = selectedProducts[product._id] || 0;
                    const displayPrice = getDisplayPrice(product);
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{product.unit}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="font-num font-bold text-sm text-[#064E3B]">৳{displayPrice}</span>
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-100 shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); handleQty(product._id, -1); }}
                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-num font-bold text-sm text-[#064E3B]">{qty}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleQty(product._id, 1); }}
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
                  <span className="font-num font-bold text-xl">৳ {totalCost}</span>
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
