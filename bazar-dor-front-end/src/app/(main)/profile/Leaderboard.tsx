'use client';

import React from 'react';
import { Trophy, Star, Medal, Award, X } from 'lucide-react';

interface LeaderboardProps {
  onClose?: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const leaders = [
    { rank: 1, name: 'আহমেদ ফয়সাল', area: 'মিরপুর ৬', accuracy: 98, avatar: 'https://i.pravatar.cc/150?u=ahmed' },
    { rank: 2, name: 'করিম হাসান', area: 'উত্তরা', accuracy: 95, avatar: 'https://i.pravatar.cc/150?u=karim' },
    { rank: 3, name: 'সুমি আক্তার', area: 'ধানমন্ডি', accuracy: 92, avatar: 'https://i.pravatar.cc/150?u=sumi' },
    { rank: 4, name: 'জামাল ভূঁইয়া', area: 'গুলশান', accuracy: 89, avatar: 'https://i.pravatar.cc/150?u=jamal' },
    { rank: 5, name: 'আয়েশা সিদ্দিকা', area: 'বনানী', accuracy: 88, avatar: 'https://i.pravatar.cc/150?u=ayesha' },
    { rank: 6, name: 'রফিকুল ইসলাম', area: 'মোহাম্মদপুর', accuracy: 85, avatar: 'https://i.pravatar.cc/150?u=rafiq' },
    { rank: 7, name: 'নাসরিন সুলতানা', area: 'মিরপুর ১০', accuracy: 82, avatar: 'https://i.pravatar.cc/150?u=nasrin' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-black/[0.04] px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#064E3B]">শীর্ষ অবদানকারী তালিকা</h1>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pt-6">
        <div className="grid grid-cols-[1fr_1.2fr_1fr] items-end gap-2 mb-6 px-4">
          {/* Rank 2 */}
          <div className="flex flex-col items-center text-center py-4 px-2 rounded-[16px] bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
            <div className="relative w-[64px] h-[64px] rounded-full mb-3 border-2 border-[#94A3B8] p-[2px]">
              <img src={leaders[1].avatar} alt={leaders[1].name} className="w-full h-full object-cover rounded-full" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-[16px] leading-none flex items-center justify-center w-6 h-6">🥈</div>
            </div>
            <p className="text-[13px] font-bold text-[#0F172A] whitespace-nowrap overflow-hidden text-ellipsis max-w-full w-full px-1">{leaders[1].name}</p>
            <div className="mt-2 bg-[#10B981]/10 text-[#059669] px-3 py-1 rounded-full font-sans font-[800] text-[14px]">{leaders[1].accuracy}%</div>
          </div>

          {/* Rank 1 */}
          <div className="flex flex-col items-center text-center py-4 px-2 rounded-[16px] bg-[#10B981]/5 backdrop-blur-md -translate-y-4 border border-[#10B981]/20 shadow-md">
            <div className="relative w-[76px] h-[76px] rounded-full mb-3 border-[3px] border-[#F59E0B] p-[2px]">
              <img src={leaders[0].avatar} alt={leaders[0].name} className="w-full h-full object-cover rounded-full" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-[16px] leading-none flex items-center justify-center w-6 h-6">👑</div>
            </div>
            <p className="text-[13px] font-bold text-[#0F172A] whitespace-nowrap overflow-hidden text-ellipsis max-w-full w-full px-1">{leaders[0].name}</p>
            <div className="mt-2 bg-[#10B981]/10 text-[#059669] px-3 py-1 rounded-full font-sans font-[800] text-[14px]">{leaders[0].accuracy}%</div>
          </div>

          {/* Rank 3 */}
          <div className="flex flex-col items-center text-center py-4 px-2 rounded-[16px] bg-white/50 backdrop-blur-md border border-white/40 shadow-sm">
            <div className="relative w-[64px] h-[64px] rounded-full mb-3 border-2 border-[#B45309] p-[2px]">
              <img src={leaders[2].avatar} alt={leaders[2].name} className="w-full h-full object-cover rounded-full" />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full p-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-[16px] leading-none flex items-center justify-center w-6 h-6">🥉</div>
            </div>
            <p className="text-[13px] font-bold text-[#0F172A] whitespace-nowrap overflow-hidden text-ellipsis max-w-full w-full px-1">{leaders[2].name}</p>
            <div className="mt-2 bg-[#10B981]/10 text-[#059669] px-3 py-1 rounded-full font-sans font-[800] text-[14px]">{leaders[2].accuracy}%</div>
          </div>
        </div>

        <div className="flex flex-col px-4">
          {leaders.slice(3).map((leader) => (
            <div key={leader.rank} className="flex items-center py-3 px-4 bg-white/70 backdrop-blur-sm rounded-[12px] mb-2 border border-slate-900/[0.04] transition-all hover:shadow-sm hover:bg-white/90">
              <div className="font-sans text-[15px] font-bold text-[#94A3B8] w-[28px] shrink-0">{leader.rank}</div>
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white shadow-sm mr-3">
                <img src={leader.avatar} alt={leader.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#0F172A] truncate leading-tight">{leader.name}</p>
                <p className="text-[12px] text-slate-500 truncate mt-0.5">{leader.area}</p>
              </div>
              <div className="ml-auto font-sans text-[15px] font-[800] text-[#064E3B]">{leader.accuracy}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="glass-card rounded-full flex items-center p-2 pr-4 shadow-lg border-[#10B981]/30 bg-white/95 backdrop-blur-xl">
          <div className="w-10 text-center shrink-0">
            <span className="text-sm font-num font-bold text-slate-400">#৪৫</span>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white shadow-sm mr-3">
            <img src="https://i.pravatar.cc/150?u=ahmed" alt="আপনার নাম" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#064E3B] truncate">আপনার নাম</p>
            <p className="text-[11px] text-slate-500 truncate">মিরপুর ৬</p>
          </div>
          <div className="shrink-0 ml-2">
            <div className="bg-[#ECFDF5] px-3 py-1.5 rounded-full border border-emerald-100/50">
              <span className="text-sm font-num font-bold text-[#064E3B]">৮২%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
