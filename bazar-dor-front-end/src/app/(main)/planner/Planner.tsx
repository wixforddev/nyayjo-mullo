'use client';

import { useState, useMemo, useEffect } from 'react';
import { Users, MapPin, Check, Minus, Plus, ChevronRight, Search, Car, ArrowRight } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PRODUCTS, AREAS } from '@/constants';
import { FoodRescue } from '@/components/FoodRescue';

export function Planner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'rescue' ? 'rescue' : 'planner');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('mirpur');
  const [travelCost, setTravelCost] = useState<string>('');

  const getProductPrice = (productId: string) => {
    return PRODUCTS.find(p => p.id === productId)?.defaultPrice || 0;
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return PRODUCTS;
    return PRODUCTS.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleToggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setSelectedProducts(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const nextState = { ...prev };
        delete nextState[id];
        return nextState;
      }
      return { ...prev, [id]: next };
    });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    router.replace(`/planner?${params.toString()}`);
  }, [activeTab, router]);

  const handleCalculate = () => {
    const totalCost = Object.entries(selectedProducts).reduce((sum: number, [id, qty]) => {
      return sum + (getProductPrice(id) * (qty as number));
    }, 0);

    const travelCostNum = parseFloat(travelCost) || 0;

    // Store in sessionStorage for the result page
    sessionStorage.setItem('plannerResult', JSON.stringify({
      totalCost,
      savings: totalCost * 0.15,
      selectedArea,
      itemCount: Object.keys(selectedProducts).length,
      travelCost: travelCostNum
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

        {/* Segmented Control */}
        <div className="bg-slate-100/50 p-1.5 rounded-2xl flex items-center border border-slate-200/50">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'planner'
                ? 'bg-white text-[#064E3B] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            বাজার প্ল্যানার
          </button>
          <button
            onClick={() => setActiveTab('rescue')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'rescue'
                ? 'bg-white text-[#064E3B] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ফুড রেসকিউ
          </button>
        </div>
      </div>

      {activeTab === 'rescue' ? (
        <FoodRescue />
      ) : (
        <>
          {/* Basic Info */}
          <div className="glass-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#064E3B] mb-2">প্রাথমিক তথ্য</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              আপনার এলাকা
            </label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 appearance-none"
              >
                {AREAS.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
              <Car className="w-3.5 h-3.5" />
              যাতায়াত খরচ (ঐচ্ছিক)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-num">৳</span>
              <input
                type="number"
                placeholder="0"
                value={travelCost}
                onChange={(e) => setTravelCost(e.target.value)}
                min="0"
                className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 font-num"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="glass-card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-[#064E3B]">পণ্য নির্বাচন করুন</h2>
          <span className="text-xs font-medium text-[#10B981] bg-emerald-50 px-2 py-1 rounded-md font-num">
            {Object.keys(selectedProducts).length} items
          </span>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map(product => {
            const isSelected = !!selectedProducts[product.id];
            const quantity = selectedProducts[product.id] || 0;

            return (
              <div
                key={product.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#10B981] bg-emerald-50/30'
                    : 'border-slate-100 bg-white/40 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => handleToggleProduct(product.id)}
                    className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl shadow-sm cursor-pointer shrink-0"
                  >
                    {product.icon}
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isSelected && handleToggleProduct(product.id)}>
                    <h3 className="font-bold text-[#064E3B] text-sm truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{product.unit}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="font-num font-bold text-sm text-[#064E3B]">৳ {product.defaultPrice}</span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-100 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(product.id, -1); }}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-num font-bold text-sm text-[#064E3B]">{quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(product.id, 1); }}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggleProduct(product.id)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#10B981] hover:border-[#10B981] transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      {activeTab === 'planner' && Object.keys(selectedProducts).length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 z-40 flex justify-center pointer-events-none">
          <button
            onClick={handleCalculate}
            className="pointer-events-auto max-w-md w-full glass-pill !rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#043d2e] text-white p-4 flex items-center justify-between shadow-[0_12px_32px_rgba(6,78,59,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-emerald-200/80 uppercase tracking-wider font-medium">মোট খরচ</span>
              <span className="font-num font-bold text-xl">
                ৳ {Object.entries(selectedProducts).reduce((sum, [id, qty]) => sum + (getProductPrice(id) * qty), 0) + (parseFloat(travelCost) || 0)}
              </span>
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
