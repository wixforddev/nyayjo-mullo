'use client';

import React from 'react';

export function PromoBanner() {
  return (
    <div className="bg-white/65 backdrop-blur-[24px] border border-slate-900/[0.04] rounded-[20px] p-[12px] flex flex-col gap-[12px] shadow-[0px_8px_24px_rgba(15,23,42,0.03)] group cursor-pointer">
      <div className="flex items-center gap-[6px] pl-[4px]">
        <span className="text-[14px]">💡</span>
        <span className="font-sans text-[13px] font-[600] text-slate-500 uppercase tracking-[0.5px]">
          ক্রেতা সচেতনতা
        </span>
      </div>

      <div className="w-full aspect-[16/7] rounded-[12px] overflow-hidden border border-slate-900/[0.05]">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop"
          alt="বাজারের টিপস"
          className="w-full h-full object-cover transition-transform duration-400 ease-out group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
