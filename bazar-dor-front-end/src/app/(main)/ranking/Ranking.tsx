'use client';

import React from 'react';

export function Ranking() {
  const markets = [
    { rank: 1, name: 'Mirpur 6', stability: 'high', savings: 150 },
    { rank: 2, name: 'Dhanmondi', stability: 'medium', savings: 120 },
    { rank: 3, name: 'Gulshan 1', stability: 'low', savings: 90 },
    { rank: 4, name: 'Mohammadpur', stability: 'high', savings: 85 },
    { rank: 5, name: 'Uttara', stability: 'medium', savings: 70 },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8 pb-24">
      <div className="text-center mb-10">
        <h1 className="text-hero text-text-primary mb-3">Bazaar Ranking Board</h1>
        <p className="text-text-secondary text-lg">বাজারের স্থিতিশীলতা ও সাশ্রয়</p>
      </div>

      <section className="surface-1 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-text-secondary text-xs uppercase tracking-wider font-bold">
              <th className="p-5 text-center w-16">Rank</th>
              <th className="p-5">Market</th>
              <th className="p-5 text-center">Stability</th>
              <th className="p-5 text-right">Avg Saving</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {markets.map((market) => (
              <tr key={market.rank} className="hover:bg-gray-50 transition-colors group">
                <td className="p-5 font-bold text-center text-text-secondary group-hover:text-primary transition-colors">#{market.rank}</td>
                <td className="p-5 font-bold text-text-primary text-base">{market.name}</td>
                <td className="p-5 text-center">
                  <div className={`inline-flex items-center justify-center w-3 h-3 rounded-full shadow-sm ${
                    market.stability === 'high' ? 'bg-status-verified shadow-[0_0_8px_rgba(5,150,105,0.4)]' :
                    market.stability === 'medium' ? 'bg-status-suspicious shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-status-error shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`} title={market.stability} />
                </td>
                <td className="p-5 font-black text-primary text-right tracking-tight">৳ {market.savings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
