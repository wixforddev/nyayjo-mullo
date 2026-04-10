'use client';

import React, { useState } from 'react';
import { Navigation } from 'lucide-react';

export function Heatmap() {
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [activeMarker, setActiveMarker] = useState<number | null>(1);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-[#f8f9fa] font-sans">
      {/* 1. Background (The Minimalist Map) */}
      <div className="absolute inset-0 z-0">
        <svg className="w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 0 L 100 0 L 100 100 L 0 100 Z" fill="#e2e8f0" />
          <path d="M 20 0 Q 30 50 10 100 L 0 100 L 0 0 Z" fill="#e0f2fe" />
          <path d="M 80 0 Q 60 40 90 100 L 100 100 L 100 0 Z" fill="#e0f2fe" />
          <path d="M 0 30 Q 50 40 100 20" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M 40 0 Q 50 50 30 100" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M 70 0 Q 60 60 80 100" fill="none" stroke="#ffffff" strokeWidth="1" />
        </svg>

        {/* Marker 1 (Cheapest) */}
        <div
          className="absolute top-[40%] left-[45%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-20"
          onClick={() => setActiveMarker(1)}
        >
          {activeMarker === 1 && (
            <div className="absolute bottom-full mb-3 w-48 bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">📍 কারওয়ান বাজার</h4>
                <p className="text-xs text-slate-500 mt-0.5">০.৮ কিমি দূরে</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="bg-emerald-500 text-white rounded-full px-3 py-1.5 font-bold text-sm shadow-[0_4px_12px_rgba(16,185,129,0.4)] animate-pulse font-num">
            ৳ ১২০
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-emerald-500"></div>
        </div>

        {/* Marker 2 (Expensive) */}
        <div
          className="absolute top-[60%] left-[75%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10"
          onClick={() => setActiveMarker(2)}
        >
          {activeMarker === 2 && (
            <div className="absolute bottom-full mb-3 w-48 bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">📍 গুলশান ডিএনসিসি</h4>
                <p className="text-xs text-slate-500 mt-0.5">৩.৫ কিমি দূরে</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="bg-rose-500 text-white rounded-full px-3 py-1.5 font-bold text-sm shadow-md font-num">
            ৳ ১৫০
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-rose-500"></div>
        </div>

        {/* Marker 3 (Moderate) */}
        <div
          className="absolute top-[25%] left-[60%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10"
          onClick={() => setActiveMarker(3)}
        >
          {activeMarker === 3 && (
            <div className="absolute bottom-full mb-3 w-48 bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">📍 মিরপুর ১</h4>
                <p className="text-xs text-slate-500 mt-0.5">১.২ কিমি দূরে</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="bg-amber-500 text-white rounded-full px-3 py-1.5 font-bold text-sm shadow-md font-num">
            ৳ ১৩৫
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-amber-500"></div>
        </div>
      </div>

      {/* 2. Top Floating Header */}
      <div className="absolute top-4 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm border border-white/40 pointer-events-auto">
          <p className="text-xs font-medium text-slate-600">📍 আপনার লোকেশন: মিরপুর</p>
        </div>

        <button className="mt-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-slate-100 flex items-center gap-2 pointer-events-auto active:scale-95 transition-transform">
          <span className="text-sm font-bold text-slate-900">🧅 পেঁয়াজ (দেশি)</span>
          <span className="text-slate-400 text-xs">▾</span>
        </button>
      </div>

      {/* 3. The Bottom Sheet (Bazar Ranking) */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] w-full transition-transform duration-500 ease-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-[85%]'}`}
      >
        <div
          className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 cursor-pointer"
          onClick={() => setIsSheetOpen(!isSheetOpen)}
        ></div>

        <h2 className="text-lg font-black text-slate-800 mb-5">🏆 আজকের সস্তা বাজার</h2>

        <div className="flex flex-col gap-4">
          <div
            className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-colors ${activeMarker === 1 ? 'border-emerald-300 bg-emerald-50/30' : 'border-emerald-100'}`}
            onClick={() => setActiveMarker(1)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base">১. কারওয়ান বাজার</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">০.৮ কিমি দূরে • 🟢 স্বাভাবিক ভিড়</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-500 tracking-tight font-num">৳১২০<span className="text-sm font-medium text-slate-400">/কেজি</span></span>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-colors ${activeMarker === 3 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-100'}`}
            onClick={() => setActiveMarker(3)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">২. মিরপুর ১</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">১.২ কিমি • 🟡 ভিড় বেশি</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-500 font-num">৳১৩৫<span className="text-xs font-medium text-slate-400">/কেজি</span></span>
              </div>
            </div>
          </div>

          <div
            className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-colors ${activeMarker === 2 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-100'}`}
            onClick={() => setActiveMarker(2)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">৩. গুলশান ডিএনসিসি</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">৩.৫ কিমি</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-rose-500 font-num">৳১৫০<span className="text-xs font-medium text-slate-400">/কেজি</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
