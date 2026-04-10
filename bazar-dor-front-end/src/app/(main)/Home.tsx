'use client';

import { useState, useEffect } from 'react';
import { MapPin, TrendingDown, Clock, ChevronRight, Search, ArrowRight, Store, X } from 'lucide-react';
import Link from 'next/link';
import { PRODUCTS, AREAS } from '@/constants';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PromoBanner } from '@/components/PromoBanner';

// Mock data for sparkline
const sparklineData = [
  { value: 450 }, { value: 430 }, { value: 460 }, { value: 420 }, { value: 400 }, { value: 390 }, { value: 385 }
];

// Mock data for 30 days trend index
const indexChartData = [
  { date: '১ মার্চ', value: 1150 },
  { date: '৫ মার্চ', value: 1180 },
  { date: '১০ মার্চ', value: 1120 },
  { date: '১৫ মার্চ', value: 1250 },
  { date: '২০ মার্চ', value: 1210 },
  { date: '২৫ মার্চ', value: 1260 },
  { date: '৩০ মার্চ', value: 1280 },
];

export function Home() {
  const [basketTotal, setBasketTotal] = useState(0);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isPriceConfirmed, setIsPriceConfirmed] = useState(false);
  const [isStockOutReported, setIsStockOutReported] = useState(false);
  const [isIndexSheetOpen, setIsIndexSheetOpen] = useState(false);

  useEffect(() => {
    // Load saved area from localStorage
    const savedArea = localStorage.getItem('defaultMarketArea');
    if (savedArea) {
      setSelectedArea(savedArea);
    } else if (AREAS.length > 0) {
      setSelectedArea(AREAS[0].id);
    }

    // Calculate basket total
    const total = PRODUCTS.slice(0, 5).reduce((sum, p) => sum + p.defaultPrice, 0);
    setBasketTotal(total);
  }, []);

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newArea = e.target.value;
    setSelectedArea(newArea);
    localStorage.setItem('defaultMarketArea', newArea);
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsPriceConfirmed(false);
    setIsStockOutReported(false);
  };

  // Get the selected area name for display
  const currentAreaName = AREAS.find(a => a.id === selectedArea)?.name || 'আপনার এলাকা';

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Dynamic Emergency Alert Banner */}
      <div className="bg-rose-50/80 backdrop-blur-md border border-rose-100 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-500 cursor-pointer hover:bg-rose-100/80 transition-colors relative overflow-hidden">
        <div className="absolute inset-0 border-2 border-rose-200/50 rounded-2xl animate-pulse pointer-events-none"></div>
        <div className="shrink-0 mt-0.5">
          <span className="text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-rose-800 leading-tight">
            জরুরী এলার্ট: বাজারে কাঁচা মরিচের চরম সংকট ও দাম ঊর্ধ্বমুখী।
          </h3>
          <p className="text-xs text-rose-600 mt-0.5">
            গত ২৪ ঘণ্টায় দাম ৪০% বৃদ্ধি পেয়েছে।
          </p>
        </div>
        <div className="shrink-0 flex items-center justify-center h-full mt-2">
          <span className="text-rose-400 text-lg">→</span>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-2 gap-4">

        {/* Hero Section - Full Width (2 cols) */}
        <div className="col-span-2 glass-card p-6 relative overflow-hidden group cursor-pointer">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full blur-2xl opacity-60 group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/80 shadow-sm mb-4 relative">
                <MapPin className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={2} />
                <select
                  value={selectedArea}
                  onChange={handleAreaChange}
                  className="text-xs font-medium text-slate-600 bg-transparent border-none focus:outline-none appearance-none pr-4 cursor-pointer"
                >
                  <option value="" disabled>আপনার এলাকা নির্বাচন করুন</option>
                  {AREAS.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-[#064E3B] leading-tight mb-2">
                আশেপাশের<br/>সঠিক দাম জানুন
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#10B981]" />
                {currentAreaName} এর বাজার দর
              </p>
            </div>

            <Link href="/heatmap" className="inline-flex items-center justify-between bg-[#064E3B] text-white px-5 py-3.5 rounded-2xl font-medium shadow-[0_8px_16px_rgba(6,78,59,0.2)] hover:bg-[#043d2e] transition-colors active:scale-[0.98]">
              <span>আশেপাশের দাম দেখুন</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </div>
            </Link>
          </div>
        </div>

        {/* Daily Basket Index - Full Width (2 cols) */}
        <div
          className="col-span-2 glass-card p-6 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsIndexSheetOpen(true)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-medium text-slate-500 mb-1">দৈনিক বাজার সূচক</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-num font-bold text-[#064E3B] tracking-tight">৳ {basketTotal}</span>
                <div className="flex items-center gap-1 text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md">
                  <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
                  <span className="font-num text-xs font-bold">৩.২%</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <Clock className="w-3 h-3" strokeWidth={1.5} />
                <span>২০ মিনিট আগে</span>
              </div>
            </div>
          </div>

          <div className="h-12 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Promotional Banner */}
        <div className="col-span-2">
          <PromoBanner />
        </div>

        {/* Search / Filter - Full Width */}
        <div className="col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 glass-card focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 text-base transition-shadow"
          />
        </div>

        {/* Product Feed - Compact 2-Column Grid */}
        <div className="col-span-2 flex items-center justify-between mt-2">
          <h3 className="text-lg font-bold text-[#064E3B]">{searchQuery ? 'অনুসন্ধানের ফলাফল' : 'জনপ্রিয় পণ্য'}</h3>
          {!searchQuery && <button className="text-sm font-medium text-[#10B981]">সব দেখুন</button>}
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-[12px]">
          {(searchQuery
            ? PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : PRODUCTS.slice(0, 6)
          ).map((product) => {
            const isWarning = product.id === '3'; // Make one a warning for demo

            return (
              <div
                key={product.id}
                className={`backdrop-blur-md border rounded-[16px] p-[12px] flex flex-col justify-between min-h-[110px] relative cursor-pointer transition-transform hover:-translate-y-1 ${isWarning ? 'border-[rgba(239,68,68,0.3)] bg-[rgba(254,242,242,0.5)]' : 'border-[rgba(15,23,42,0.05)] bg-[rgba(255,255,255,0.85)]'}`}
                onClick={() => handleProductClick(product)}
              >
                {/* Card Header (Name & Unit) */}
                <div className="flex justify-between items-start">
                  <div className="pr-1">
                    <h4 className="text-[14px] font-bold text-[#0F172A] m-0 leading-[1.2]">{product.name}</h4>
                    <p className="text-[11px] text-[#64748B] mt-[2px]">{product.unit}</p>
                  </div>
                  {/* Thumbnail inside card */}
                  <div className="w-[40px] h-[40px] bg-[#F1F5F9] rounded-[8px] flex items-center justify-center text-2xl shrink-0">
                    {product.icon}
                  </div>
                </div>

                {/* Price Area */}
                <div className="mt-auto flex items-baseline gap-[4px] pt-2">
                  <span className={`text-[18px] font-[800] tracking-[-0.5px] font-num ${isWarning ? 'text-[#EF4444]' : 'text-[#064E3B]'}`}>
                    ৳ {product.defaultPrice}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart Food Rescue Entry - Full Width (2 cols) */}
        <div className="col-span-2 glass-card p-6 relative overflow-hidden group cursor-pointer mt-2">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-[22px] font-bold text-[#064E3B] mb-1 leading-tight">
                অতিরিক্ত খাবার নষ্ট করবেন না
              </h2>
              <p className="text-[15px] font-medium text-slate-500 mb-4">
                যা আছে, তা দিয়েই রান্না করুন
              </p>
              <Link href="/planner?tab=rescue" className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-5 py-2.5 rounded-full font-medium text-sm shadow-md hover:bg-[#043d2e] transition-colors">
                রেসিপি দেখুন
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="w-28 h-28 relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=400&auto=format&fit=crop"
                alt="Fresh Vegetables"
                className="w-full h-full object-cover rounded-full shadow-lg border-4 border-white/50"
                style={{ filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.1))' }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Bottom Sheet */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setSelectedProduct(null)}></div>

          <div className="w-full h-[85vh] bg-[#FAFCFC] rounded-t-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-32 flex flex-col gap-4">
              {/* 1. Hero Data Card (Product & Price) */}
              <div className="bg-white rounded-[32px] p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-4 mt-2">
                {/* Product Identity */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full text-2xl mb-3">
                  {selectedProduct.icon || '🥚'}
                </div>
                <h2 className="text-sm font-bold text-slate-500 mb-2">{selectedProduct.name}</h2>

                {/* Price & Badge */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">৳ {selectedProduct.defaultPrice}</h1>
                    <span className="bg-emerald-100/80 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-200/50 flex items-center gap-1">
                      ✓ ভেরিফায়েড
                    </span>
                  </div>
                  <span className="text-base font-semibold text-slate-600">প্রতি {selectedProduct.unit}</span>
                </div>

                {/* Quantity Condition */}
                <div className="mt-5 inline-block bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    💡 ২ {selectedProduct.unit} বা বেশি নিলে <span className="font-bold text-slate-700">৳{Math.round(selectedProduct.defaultPrice * 0.95)}</span>
                  </p>
                </div>
              </div>

              {/* 2. Voting & Action Card */}
              <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-50 mb-4">
                <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider text-center">আপনার মতামত দিন</h3>

                {/* Primary Actions (Side by Side) */}
                <div className="flex gap-3 mb-4">
                  {!isPriceConfirmed ? (
                    <button
                      onClick={() => setIsPriceConfirmed(true)}
                      className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-emerald-100/50 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✓</span> সঠিক (২৪)
                    </button>
                  ) : (
                    <div className="flex-1 bg-emerald-50/80 text-emerald-700 font-bold py-3.5 rounded-2xl border border-emerald-200/60 flex items-center justify-center gap-2">
                      <span className="text-sm">✨ ভোট যুক্ত হয়েছে</span>
                    </div>
                  )}

                  <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200/60 flex items-center justify-center gap-2">
                    <span className="text-lg">✕</span> আপডেট করুন
                  </button>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-slate-100 my-2"></div>

                {/* Secondary Action (Emergency) */}
                {!isStockOutReported ? (
                  <button
                    onClick={() => setIsStockOutReported(true)}
                    className="w-full flex items-center justify-center gap-2 text-rose-500 text-sm font-semibold py-2 mt-1 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <span className="text-base">🚫</span> পণ্যটি বাজারে পাননি? (স্টক আউট)
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 text-rose-700 text-sm font-semibold py-2 mt-1 rounded-xl bg-rose-50 border border-rose-200/60 animate-in fade-in zoom-in-95">
                    ✅ স্টক আউট রিপোর্ট গ্রহণ করা হয়েছে
                  </div>
                )}
              </div>

              {/* 3. AI Insights Grid (Best Time & Trend) */}
              <div className="grid grid-cols-2 gap-4 mb-4">

                {/* Left: Best Time */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-slate-400 mb-3">কেনার সেরা সময়</h3>
                  <div>
                    <div className="bg-emerald-50 text-emerald-700 font-black text-lg px-3 py-2 rounded-xl inline-block border border-emerald-100">
                      সকাল ৮টা - ১০টা
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">এই সময়ে ভিড় ও দাম কম থাকে</p>
                  </div>
                </div>

                {/* Right: 7 Days Trend */}
                <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-slate-400 mb-3">গত ৭ দিনের দাম</h3>
                  <div className="flex-1 flex items-end">
                    {/* Elegant SVG Sparkline */}
                    <svg viewBox="0 0 100 40" className="w-full h-12 overflow-visible">
                      <path
                        d="M0,30 C20,30 30,10 50,20 C70,30 80,5 100,15"
                        fill="none"
                        stroke="#064E3B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      />
                      <circle cx="100" cy="15" r="3" fill="#064E3B" />
                    </svg>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
      {/* Market Index Details Bottom Sheet */}
      {isIndexSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setIsIndexSheetOpen(false)}></div>

          <div className="w-full h-[85vh] bg-[#FAFCFC] rounded-t-[32px] shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-4">
              {/* 1. Header Area (Transparent) */}
              <div className="flex flex-col items-center mt-2 mb-2">
                <p className="text-slate-500 text-sm font-medium mb-1">ঢাকা এসেনশিয়াল বাস্কেট</p>
                <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-3">৳ ১,২৮০</h2>
                <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <span>📈</span> গতকালের চেয়ে ৳২০ বেশি
                </div>
              </div>

              {/* 2. Interactive Chart Bento Box */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-sm p-5 flex flex-col w-full">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">গত ৩০ দিনের ট্রেন্ড</h3>
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={indexChartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="5 5"
                        vertical={false}
                        stroke="rgba(15, 23, 42, 0.04)"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'Noto Sans Bengali' }}
                        minTickGap={30}
                      />
                      <YAxis
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600, fontFamily: 'Inter' }}
                        domain={[1100, 1400]}
                        tickFormatter={(value) => `৳${value}`}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                        labelStyle={{ color: '#64748B', fontSize: '12px', marginBottom: '4px', fontFamily: 'Noto Sans Bengali' }}
                        itemStyle={{ color: '#064E3B', fontWeight: '800', fontSize: '16px', fontFamily: 'Inter' }}
                        formatter={(value: any) => [`৳${value}`, 'সূচক']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#064E3B"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: '#064E3B', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. The AI Insight Bento Box */}
              <div className="bg-amber-50/50 backdrop-blur-xl border border-amber-100/50 rounded-3xl shadow-sm p-5 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <p className="text-slate-700 font-medium leading-relaxed text-sm">
                  পেঁয়াজ এবং মুরগির দাম কেজিতে ৳১০ বাড়ায় আজকের সূচক ঊর্ধ্বমুখী।
                </p>
              </div>

              {/* 4. The Breakdown Bento Box */}
              <div className="bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-sm p-5 flex flex-col">
                <h3 className="text-slate-800 font-bold mb-4">বাস্কেটের উপাদান</h3>
                <div className="flex flex-col">
                  {/* Row 1 */}
                  <div className="flex justify-between items-center py-3 border-b border-slate-200/60 border-dashed">
                    <span className="text-slate-700 font-medium">চাল <span className="text-slate-400 text-sm font-normal">(৫ কেজি)</span></span>
                    <span className="text-slate-900 font-bold">৳৩৪০</span>
                  </div>
                  {/* Row 2 */}
                  <div className="flex justify-between items-center py-3 border-b border-slate-200/60 border-dashed">
                    <span className="text-slate-700 font-medium">সয়াবিন তেল <span className="text-slate-400 text-sm font-normal">(১ লিটার)</span></span>
                    <span className="text-slate-900 font-bold">৳১৬০</span>
                  </div>
                  {/* Row 3 */}
                  <div className="flex justify-between items-center py-3 border-b border-slate-200/60 border-dashed">
                    <span className="text-slate-700 font-medium">মুরগি <span className="text-slate-400 text-sm font-normal">(১ কেজি)</span></span>
                    <span className="text-slate-900 font-bold">৳১৫০</span>
                  </div>
                  {/* Row 4 */}
                  <div className="flex justify-between items-center py-3 border-b border-slate-200/60 border-dashed">
                    <span className="text-slate-700 font-medium">পেঁয়াজ <span className="text-slate-400 text-sm font-normal">(১ কেজি)</span></span>
                    <span className="text-slate-900 font-bold">৳১২0</span>
                  </div>
                  {/* Row 5 */}
                  <div className="flex justify-between items-center py-3 pt-3">
                    <span className="text-slate-700 font-medium">আলু <span className="text-slate-400 text-sm font-normal">(২ কেজি)</span></span>
                    <span className="text-slate-900 font-bold">৳১১০</span>
                  </div>
                </div>
              </div>

              {/* 5. Share Button */}
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] py-4 font-bold text-base transition-colors shadow-md mt-2 flex items-center justify-center gap-2">
                <span>🔗</span> আজকের সূচক শেয়ার করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
