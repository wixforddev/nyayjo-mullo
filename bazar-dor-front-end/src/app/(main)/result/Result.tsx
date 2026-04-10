'use client';

import { MapPin, TrendingDown, Share2, ArrowLeft, CheckCircle2, AlertTriangle, Car } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlannerState {
  totalCost: number;
  savings: number;
  selectedArea: string;
  itemCount: number;
  travelCost?: number;
}

export function Result() {
  const router = useRouter();
  const [state, setState] = useState<PlannerState | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('plannerResult');
    if (stored) {
      setState(JSON.parse(stored));
    } else {
      router.replace('/planner');
    }
  }, [router]);

  if (!state) return null;

  const { totalCost, savings, selectedArea, travelCost = 0 } = state;

  const areaName = selectedArea === 'mirpur' ? 'Mirpur 6' :
                   selectedArea === 'dhanmondi' ? 'Dhanmondi' :
                   selectedArea === 'gulshan' ? 'Gulshan 1' : selectedArea;

  const grandTotal = totalCost + travelCost;

  const handleShare = async () => {
    const shareData = {
      title: 'বাজার দর - Smart Shopping',
      text: `আমি এই সপ্তাহে বাজার দর অ্যাপ ব্যবহার করে ${Math.round(savings).toLocaleString()} টাকা সেভ করেছি! আপনিও ট্রাই করুন।`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Link href="/planner" className="p-2 glass-pill hover:bg-white/50 transition-colors text-slate-600">
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        </Link>
        <h1 className="text-xl font-bold text-[#064E3B]">আপনার বাজার প্ল্যান</h1>
        <div className="w-9"></div>
      </div>

      {/* Top Highlight Card */}
      <div className="glass-card p-8 bg-gradient-to-br from-[#064E3B] to-[#10B981] text-white text-center relative overflow-hidden shadow-[0_24px_48px_rgba(16,185,129,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium mb-6 border border-white/20 shadow-sm">
            <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
            নির্বাচিত বাজার: {areaName}
          </div>

          <p className="text-emerald-100 text-sm mb-1 font-medium uppercase tracking-wider">আপনার মোট খরচ হবে</p>
          <div className="text-6xl font-num font-black tracking-tight mb-2 drop-shadow-sm">৳ {grandTotal.toLocaleString()}</div>

          {travelCost > 0 && (
            <div className="text-white/80 text-xs mb-6 flex items-center gap-1.5 font-medium bg-black/10 px-3 py-1 rounded-full font-num">
              (বাজার ৳{totalCost.toLocaleString()} + যাতায়াত ৳{travelCost.toLocaleString()})
            </div>
          )}
          {!travelCost && <div className="mb-6"></div>}

          <div className="inline-flex items-center gap-2 bg-white text-[#064E3B] px-6 py-3 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform cursor-default">
            <TrendingDown className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
            আপনি সেভ করছেন: <span className="font-num">৳ {Math.round(savings).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Split Buying Optimization */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 flex flex-col justify-center items-center text-center">
          <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Best Single Market</h3>
          <div className="text-xl font-bold text-[#064E3B] mb-1 leading-tight">{areaName}</div>
          <div className="text-[#10B981] font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full font-num">Save ৳ {Math.round(savings).toLocaleString()}</div>
        </div>

        <div className="relative glass-card p-5 border border-[#10B981]/30 flex flex-col justify-center items-center text-center bg-emerald-50/30">
          <div className="absolute -top-2.5 bg-[#10B981] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Recommended</div>
          <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-wider text-[10px]">Best Split Option</h3>
          <div className="text-lg font-bold text-[#064E3B] mb-1 leading-tight">{areaName} + Nearby</div>
          <div className="text-[#10B981] font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full font-num">Save ৳ {Math.round(savings + 50).toLocaleString()}</div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-100/50">
          <h2 className="text-lg font-bold text-[#064E3B]">বাজার তুলনা</h2>
          <p className="text-slate-500 text-xs mt-0.5">আপনার এলাকার অন্যান্য বাজারের সাথে তুলনা</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-wider font-medium">
                <th className="p-4 font-medium">বাজারের নাম</th>
                <th className="p-4 text-right font-medium">মোট খরচ</th>
                <th className="p-4 text-center font-medium">বিশ্বাসযোগ্যতা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              <tr className="bg-emerald-50/30">
                <td className="p-4 font-bold text-[#064E3B] flex items-center gap-2 text-sm">
                  {areaName}
                  <span className="bg-[#10B981] text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">Selected</span>
                </td>
                <td className="p-4 font-num font-bold text-[#10B981] text-right text-base">৳ {grandTotal.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <div className="inline-flex items-center gap-1 text-[#10B981] font-bold text-xs bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100 font-num">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    92%
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-medium text-slate-600 text-sm">Other Market Avg</td>
                <td className="p-4 font-num font-bold text-slate-600 text-right text-base">৳ {(grandTotal + savings).toLocaleString()}</td>
                <td className="p-4 text-center">
                  <div className="inline-flex items-center gap-1 text-slate-500 font-bold text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 font-num">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    85%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Projection */}
      <div className="glass-card p-8 text-center relative overflow-hidden bg-gradient-to-b from-white/40 to-emerald-50/40">
        <div className="relative z-10">
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">মাসিক হিসাব</h3>
          <p className="text-[#064E3B] text-base mb-4 font-medium leading-snug">
            এইভাবে প্রতি সপ্তাহে বাজার করলে আপনার বছরে সেভ হবে
          </p>
          <div className="text-4xl font-num font-black text-[#10B981] tracking-tight">
            ৳ {(Math.round(savings) * 52).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Share Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#064E3B] font-medium px-6 py-3 glass-pill hover:bg-white/80 transition-all"
        >
          <Share2 className="w-4 h-4" strokeWidth={2} />
          বন্ধুদের সাথে শেয়ার করুন
        </button>
      </div>
    </div>
  );
}
