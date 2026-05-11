'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle2, AlertTriangle,
  ThumbsUp, ThumbsDown, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
  CartesianGrid, XAxis, YAxis,
} from 'recharts';
import { useGetProductQuery } from '../../../../store/api/productApi';
import {
  useGetPricesQuery,
  useGetPriceHistoryQuery,
  useVotePriceMutation,
} from '../../../../store/api/priceApi';
import { useAppSelector } from '../../../../store/hooks';
import { useUserLocation } from '../../../../hooks/useUserLocation';
import { distanceKm, formatDistance } from '../../../../lib/distance';

/* ── helpers ─────────────────────────────────────── */
function getBDHour(dateStr: string) {
  return (new Date(dateStr).getUTCHours() + 6) % 24;
}

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  return `${Math.floor(hrs / 24)} দিন আগে`;
}

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : null;
}

/* ── component ────────────────────────────────────── */
export function ProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const { location: userLocation } = useUserLocation();

  const [votedPriceIds, setVotedPriceIds] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('voted_prices') || '[]');
      setVotedPriceIds(new Set(stored));
    } catch {}
  }, []);

  const { data: productRes, isLoading: loadingProduct } = useGetProductQuery(productId);
  const { data: pricesRes,  isLoading: loadingPrices  } = useGetPricesQuery({ productId, limit: 200 });
  const { data: historyRes }                             = useGetPriceHistoryQuery({ productId });
  const [votePrice] = useVotePriceMutation();

  const product: any   = productRes?.data?.attributes;
  const allPrices: any[] = pricesRes?.data?.attributes?.data || [];

  /* today's prices — midnight BD = 18:00 UTC prev day */
  const todayStart = new Date();
  todayStart.setUTCHours(todayStart.getUTCHours() - ((todayStart.getUTCHours() + 6) % 24), 0, 0, 0);
  const todayPrices = allPrices.filter(p => new Date(p.createdAt) >= todayStart);

  /* official price = highest-upvote today price, fallback to latest */
  const officialPrice = [...todayPrices].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))[0]
    ?? allPrices[0];
  const totalVotes   = officialPrice ? (officialPrice.upvotes || 0) + (officialPrice.downvotes || 0) : 0;
  const confidence   = totalVotes >= 5
    ? Math.round((officialPrice.upvotes || 0) / totalVotes * 100)
    : null;

  /* time-slot averages */
  const TIME_SLOTS = [
    { label: 'সকাল', test: (h: number) => h >= 5  && h < 12 },
    { label: 'দুপুর', test: (h: number) => h >= 12 && h < 16 },
    { label: 'বিকেল', test: (h: number) => h >= 16 && h < 20 },
    { label: 'রাত',   test: (h: number) => h >= 20 || h < 5  },
  ];
  const slotData = TIME_SLOTS.map(slot => {
    const ps = todayPrices.filter(p => slot.test(getBDHour(p.createdAt)));
    return { label: slot.label, avg: avg(ps.map(p => p.price)), count: ps.length };
  });

  /* anomaly: spread > 20% with ≥3 submissions */
  const todayVals  = todayPrices.map(p => p.price);
  const minP = todayVals.length ? Math.min(...todayVals) : 0;
  const maxP = todayVals.length ? Math.max(...todayVals) : 0;
  const hasAnomaly = todayVals.length >= 3 && minP > 0 && (maxP - minP) / minP > 0.20;

  const morningAvg = avg(todayPrices.filter(p => {const h = getBDHour(p.createdAt); return h >= 5 && h < 12; }).map(p => p.price));
  const eveningAvg = avg(todayPrices.filter(p => {const h = getBDHour(p.createdAt); return h >= 16 && h < 20;}).map(p => p.price));

  /* per-bazar latest price, sorted cheapest first */
  const bazarMap = new Map<string, any>();
  allPrices.forEach(p => {
    const bid = typeof p.bazarId === 'object' ? p.bazarId._id : p.bazarId;
    if (!bid) return;
    if (!bazarMap.has(bid) || new Date(p.createdAt) > new Date(bazarMap.get(bid).createdAt))
      bazarMap.set(bid, p);
  });
  const bazarPrices = [...bazarMap.values()].sort((a, b) => a.price - b.price);

  /* price history chart data */
  const historyData = (historyRes?.data?.attributes || []).slice(-7).map((h: any) => ({
    value: Math.round(h.avgPrice),
    label: new Date(h.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
  }));

  /* vote handler */
  const handleVote = async (priceId: string, voteType: 'up' | 'down') => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setVoting(priceId);
    try {
      await votePrice({ priceId, voteType }).unwrap();
      setVotedPriceIds(prev => {
        const next = new Set([...prev, priceId]);
        try { localStorage.setItem('voted_prices', JSON.stringify([...next])); } catch {}
        return next;
      });
    } catch {}
    setVoting(null);
  };

  /* loading skeleton */
  if (loadingProduct || loadingPrices) {
    return (
      <div className="max-w-lg mx-auto pb-12 space-y-4 animate-pulse pt-2">
        <div className="h-10 bg-slate-100 rounded-2xl w-2/5" />
        <div className="h-44 bg-slate-100 rounded-3xl" />
        <div className="h-28 bg-slate-100 rounded-3xl" />
        <div className="h-40 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  const name = product?.nameBn || product?.name || 'পণ্য';
  const icon = product?.icon || '🛒';
  const unit = product?.unit || '';

  return (
    <div className="max-w-lg mx-auto pb-20">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 pt-1">
        <button onClick={() => router.back()}
          className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-3xl">{icon}</span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-[#064E3B] truncate">{name}</h1>
          <p className="text-xs text-slate-400">
            {unit}{unit && ' · '}{todayPrices.length}টি আজকের সাবমিশন · {bazarPrices.length}টি বাজার
          </p>
        </div>
      </div>

      {allPrices.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📭</p>
          <p className="text-slate-500 font-medium mb-4">এখনো কোনো দাম সাবমিট হয়নি</p>
          <Link href={`/submit?product_id=${productId}`}
            className="inline-block bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold text-sm">
            দাম যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* ── Official price ── */}
          <div className="bg-gradient-to-br from-[#064E3B] via-[#065f46] to-[#10B981] rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/15">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-emerald-300 text-[11px] font-bold uppercase tracking-widest">আজকের Official দাম</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black tracking-tight">৳{officialPrice?.price ?? '—'}</span>
                  <span className="text-emerald-300 text-sm font-medium">/{unit}</span>
                </div>
              </div>
              <ShieldCheck className="w-8 h-8 text-emerald-300 shrink-0 mt-1" strokeWidth={1.5} />
            </div>
            {confidence !== null && (
              <div className="flex items-center gap-1.5 mt-2 bg-white/10 rounded-xl px-3 py-1.5 w-fit">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-xs text-emerald-200 font-bold">Confidence: {confidence}%</span>
              </div>
            )}
            {officialPrice && (
              <p className="text-[11px] text-emerald-400 mt-2.5">
                {typeof officialPrice.bazarId === 'object'
                  ? (officialPrice.bazarId?.nameBn || officialPrice.bazarId?.name)
                  : ''}{' '}
                · {timeAgo(officialPrice.createdAt)}
              </p>
            )}
          </div>

          {/* ── Anomaly warning ── */}
          {hasAnomaly && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="font-bold text-amber-800 text-sm">দামে পার্থক্য দেখা যাচ্ছে</p>
              </div>
              {morningAvg !== null && eveningAvg !== null && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 text-center bg-white rounded-2xl py-2.5 border border-amber-100">
                    <p className="text-[11px] text-slate-400 mb-0.5">সকাল</p>
                    <p className="text-2xl font-black text-amber-600">৳{morningAvg}</p>
                  </div>
                  <span className="text-amber-400 text-xl font-bold">→</span>
                  <div className="flex-1 text-center bg-white rounded-2xl py-2.5 border border-amber-100">
                    <p className="text-[11px] text-slate-400 mb-0.5">বিকেল</p>
                    <p className="text-2xl font-black text-amber-600">৳{eveningAvg}</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                সম্ভাব্য কারণ: সকাল vs বিকেলের দামের পার্থক্য · দোকান ভেদে দাম আলাদা হতে পারে · একটি পুরনো দাম হতে পারে
              </p>
              <Link href={`/submit?product_id=${productId}`}
                className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-3 rounded-2xl font-bold text-sm transition-colors">
                আবার এই বাজারে আসি, দাম দিতে চাই
              </Link>
            </div>
          )}

          {/* ── Time-based prices ── */}
          {slotData.some(s => s.avg !== null) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="font-bold text-slate-800 text-sm mb-4">সময় অনুযায়ী দাম</p>
              <div className="grid grid-cols-4 gap-2">
                {slotData.map(slot => (
                  <div key={slot.label}
                    className={`text-center rounded-2xl py-3 ${slot.avg !== null ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                    <p className="text-[10px] text-slate-500 font-semibold mb-1">{slot.label}</p>
                    {slot.avg !== null ? (
                      <>
                        <p className="text-base font-black text-[#064E3B]">৳{slot.avg}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{slot.count}টি</p>
                      </>
                    ) : (
                      <p className="text-slate-300 font-bold">—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Today's submissions ── */}
          {todayPrices.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="font-bold text-slate-800 text-sm mb-3">আজকের সব Submissions</p>
              <div className="flex flex-col gap-2">
                {[...todayPrices]
                  .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
                  .map((p: any) => {
                    const hasVoted  = votedPriceIds.has(p._id);
                    const totalV    = (p.upvotes || 0) + (p.downvotes || 0);
                    const isVerified = totalV >= 10 && (p.upvotes || 0) / totalV >= 0.6;
                    const isHidden   = totalV >= 5  && (p.downvotes || 0) / totalV > 0.6;
                    const bazarName  = typeof p.bazarId === 'object'
                      ? (p.bazarId?.nameBn || p.bazarId?.name) : '';
                    return (
                      <div key={p._id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isVerified ? 'bg-emerald-50 border-emerald-100'
                          : isHidden  ? 'bg-slate-50  border-slate-100 opacity-60'
                          : 'bg-white border-slate-100'
                        }`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-lg text-slate-900">৳{p.price}</span>
                            {isVerified && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                            {isHidden && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Hidden
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {bazarName && `🏪 ${bazarName} · `}{timeAgo(p.createdAt)}
                          </p>
                          {p.aiLabel && (
                            <p className="text-[10px] text-amber-500 italic mt-0.5">{p.aiLabel}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => !hasVoted && !voting && handleVote(p._id, 'up')}
                            disabled={hasVoted || !!voting}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              hasVoted ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}>
                            <ThumbsUp className="w-3 h-3" /> {p.upvotes || 0}
                          </button>
                          <button
                            onClick={() => !hasVoted && !voting && handleVote(p._id, 'down')}
                            disabled={hasVoted || !!voting}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              hasVoted ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                            }`}>
                            <ThumbsDown className="w-3 h-3" /> {p.downvotes || 0}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── All bazars ranking ── */}
          {bazarPrices.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="font-bold text-slate-800 text-sm mb-1">
                সব বাজারে দাম
                <span className="ml-2 text-slate-400 font-normal text-xs">{bazarPrices.length}টি বাজার</span>
              </p>
              <p className="text-[11px] text-slate-400 mb-4">সস্তা থেকে দামী ক্রমে সাজানো</p>
              <div className="flex flex-col gap-2.5">
                {bazarPrices.map((p: any, i: number) => {
                  const bazar = typeof p.bazarId === 'object' ? p.bazarId : null;
                  const dist  = userLocation && bazar?.lat && bazar?.lng
                    ? distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)
                    : null;
                  const isCheapest = i === 0;
                  return (
                    <div key={p._id}
                      className={`flex items-center gap-3 p-3 rounded-2xl ${isCheapest ? 'bg-emerald-50 border border-emerald-100' : 'border border-slate-50'}`}>
                      <span className={`text-sm font-black w-5 text-center ${isCheapest ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {bazar?.nameBn || bazar?.name || '—'}
                          {isCheapest && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">সবচেয়ে সস্তা</span>}
                        </p>
                        {dist !== null && (
                          <p className="text-[11px] text-emerald-600 font-semibold">{formatDistance(dist)} দূরে</p>
                        )}
                        <p className="text-[10px] text-slate-400">{timeAgo(p.createdAt)}</p>
                      </div>
                      <span className={`font-black text-base shrink-0 ${isCheapest ? 'text-emerald-700' : 'text-slate-700'}`}>
                        ৳{p.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Price history chart ── */}
          {historyData.length >= 2 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
              <p className="font-bold text-slate-800 text-sm mb-4">দামের History (গত ৭ দিন)</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} width={28} />
                    <Tooltip
                      formatter={(v: any) => [`৳${v}`, 'গড় দাম']}
                      contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 11 }}
                    />
                    <Line
                      type="monotone" dataKey="value"
                      stroke="#10B981" strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Add price CTA ── */}
          <Link
            href={`/submit?product_id=${productId}`}
            className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm active:scale-[0.98] transition-transform">
            + এই পণ্যের নতুন দাম যোগ করুন
          </Link>

        </div>
      )}
    </div>
  );
}
