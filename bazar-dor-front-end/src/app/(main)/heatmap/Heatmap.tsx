'use client';

import React, { useState } from 'react';
import { Navigation } from 'lucide-react';

export function Heatmap() {
  const [activeMarker, setActiveMarker] = useState<number | null>(1);

  const markets = [
    { id: 1, name: 'কারওয়ান বাজার', distance: '০.৮ কিমি দূরে', crowd: '🟢 স্বাভাবিক ভিড়', price: '৳১২০', color: 'emerald', top: '40%', left: '45%' },
    { id: 3, name: 'মিরপুর ১', distance: '১.২ কিমি দূরে', crowd: '🟡 ভিড় বেশি', price: '৳১৩৫', color: 'amber', top: '25%', left: '60%' },
    { id: 2, name: 'গুলশান ডিএনসিসি', distance: '৩.৫ কিমি দূরে', crowd: '', price: '৳১৫০', color: 'rose', top: '60%', left: '75%' },
  ];

  const colorMap: Record<string, { bg: string; shadow: string; border: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', shadow: 'shadow-[0_4px_12px_rgba(16,185,129,0.4)]', border: 'border-emerald-300 bg-emerald-50/30', text: 'text-emerald-500' },
    amber: { bg: 'bg-amber-500', shadow: 'shadow-md', border: 'border-amber-300 bg-amber-50/30', text: 'text-amber-500' },
    rose: { bg: 'bg-rose-500', shadow: 'shadow-md', border: 'border-rose-300 bg-rose-50/30', text: 'text-rose-500' },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 h-[calc(100vh-88px)]">

      {/* ── Map Area ── */}
      <div className="relative flex-1 min-h-[55vw] lg:min-h-0 overflow-hidden bg-[#f8f9fa] rounded-2xl">
        {/* Minimal SVG Map Background */}
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill="#e2e8f0" />
            <path d="M 20 0 Q 30 50 10 100 L 0 100 L 0 0 Z" fill="#e0f2fe" />
            <path d="M 80 0 Q 60 40 90 100 L 100 100 L 100 0 Z" fill="#e0f2fe" />
            <path d="M 0 30 Q 50 40 100 20" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M 40 0 Q 50 50 30 100" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M 70 0 Q 60 60 80 100" fill="none" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>

        {/* Map Markers */}
        {markets.map((market) => {
          const c = colorMap[market.color];
          return (
            <div
              key={market.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-20"
              style={{ top: market.top, left: market.left }}
              onClick={() => setActiveMarker(market.id)}
            >
              {activeMarker === market.id && (
                <div className="absolute bottom-full mb-3 w-48 bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">📍 {market.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{market.distance}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className={`${c.bg} text-white rounded-full px-3 py-1.5 font-bold text-sm ${c.shadow} font-num ${market.id === 1 ? 'animate-pulse' : ''}`}>
                {market.price}
              </div>
              <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${market.id === 1 ? 'border-t-emerald-500' : market.id === 3 ? 'border-t-amber-500' : 'border-t-rose-500'}`}></div>
            </div>
          );
        })}

        {/* Top floating header */}
        <div className="absolute top-4 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/40 pointer-events-auto">
            <p className="text-xs font-medium text-slate-600">📍 আপনার লোকেশন: মিরপুর</p>
          </div>
          <button className="mt-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-slate-100 flex items-center gap-2 pointer-events-auto active:scale-95 transition-transform">
            <span className="text-sm font-bold text-slate-900">🧅 পেঁয়াজ (দেশি)</span>
            <span className="text-slate-400 text-xs">▾</span>
          </button>
        </div>
      </div>

      {/* ── Rankings Panel ── */}
      {/* Mobile: bottom sheet style | Desktop: right sidebar */}
      <div className="lg:w-80 xl:w-96 shrink-0 bg-white/95 backdrop-blur-xl rounded-t-[32px] lg:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] lg:shadow-sm p-6 overflow-y-auto">
        <h2 className="text-lg font-black text-slate-800 mb-5">🏆 আজকের সস্তা বাজার</h2>
        <div className="flex flex-col gap-4">
          {markets.map((market, i) => {
            const c = colorMap[market.color];
            return (
              <div
                key={market.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-colors ${activeMarker === market.id ? c.border : 'border-slate-100'}`}
                onClick={() => setActiveMarker(market.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{i + 1}. {market.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{market.distance}{market.crowd ? ` • ${market.crowd}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black tracking-tight font-num ${c.text}`}>
                      {market.price}<span className="text-sm font-medium text-slate-400">/কেজি</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
