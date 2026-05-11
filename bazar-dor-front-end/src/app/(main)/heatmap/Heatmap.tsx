'use client';

import React, { useState } from 'react';
import { Navigation, MapPin, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useGetBazarsQuery, useGetNearbyBazarsQuery } from '../../../store/api/bazarApi';
import { useGetHeatmapQuery } from '../../../store/api/priceApi';
import { useGetProductsQuery } from '../../../store/api/productApi';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { distanceKm, formatDistance, googleMapsDirectionsUrl } from '../../../lib/distance';

const HeatmapMap = dynamic(() => import('../../../components/HeatmapMap'), { ssr: false });

type Tier = 'emerald' | 'amber' | 'rose' | 'slate';

const TIER_COLOR: Record<Tier, { ring: string; text: string; bg: string; label: string }> = {
  emerald: { ring: 'ring-emerald-300', text: 'text-emerald-700', bg: 'bg-emerald-50',  label: 'সস্তা'    },
  amber:   { ring: 'ring-amber-300',   text: 'text-amber-700',   bg: 'bg-amber-50',    label: 'মাঝারি'  },
  rose:    { ring: 'ring-rose-300',    text: 'text-rose-700',    bg: 'bg-rose-50',     label: 'দামি'     },
  slate:   { ring: 'ring-slate-200',   text: 'text-slate-400',   bg: 'bg-slate-50',    label: 'ডেটা নেই' },
};

const DOT_COLOR: Record<Tier, string> = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  slate:   'bg-slate-400',
};

export function Heatmap() {
  const [selectedBazarId, setSelectedBazarId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { location: userLocation, refresh: refreshLocation, loading: locLoading } = useUserLocation();

  // When location available: fetch nearby bazars (25km) — covers all bazars the user can realistically visit
  // When no location: server-side text search so any bazar name can be found regardless of DB size
  const { data: bazarsRes, isLoading: loadingBazars1 } = useGetBazarsQuery(
    { search: searchQuery || undefined, limit: 100 },
    { skip: !!userLocation },
  );
  const { data: nearbyBazarsRes, isLoading: loadingBazars2 } = useGetNearbyBazarsQuery(
    { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 25, limit: 200 },
    { skip: !userLocation },
  );
  const loadingBazars = loadingBazars1 || loadingBazars2;
  const { data: productsRes }                              = useGetProductsQuery({ limit: 50 });
  const { data: heatmapRes, isFetching: fetchingHeatmap } = useGetHeatmapQuery(
    selectedProductId,
    { skip: !selectedProductId }
  );

  const rawBazars: any[] = userLocation
    ? (nearbyBazarsRes?.data?.attributes   || [])
    : (bazarsRes?.data?.attributes?.data   || []);
  const products: any[]  = productsRes?.data?.attributes?.data || [];
  const heatmapData: any[] = heatmapRes?.data?.attributes      || [];

  // ─── Helpers ────────────────────────────────────────────────
  const getBazarHeatRow = (bazarId: string) =>
    heatmapData.find((h: any) =>
      (typeof h.bazarId === 'string' ? h.bazarId : h.bazarId?._id) === bazarId
    );

  const getTier = (bazarId: string): Tier => {
    const row = getBazarHeatRow(bazarId);
    if (!row) return 'slate';
    const prices = heatmapData.map((h: any) => h.avgPrice).filter(Boolean);
    if (!prices.length) return 'slate';
    const ratio = (row.avgPrice - Math.min(...prices)) / (Math.max(...prices) - Math.min(...prices) || 1);
    if (ratio < 0.4) return 'emerald';
    if (ratio < 0.7) return 'amber';
    return 'rose';
  };

  const getAvgPrice = (bazarId: string): number | null => {
    const row = getBazarHeatRow(bazarId);
    return row ? Math.round(row.avgPrice) : null;
  };

  // ─── Sort & filter ──────────────────────────────────────────
  // Sort by: 1) price tier (cheap → expensive → no data) 2) distance
  const sortedBazars = [...rawBazars].sort((a: any, b: any) => {
    const pa = getBazarHeatRow(a._id)?.avgPrice ?? 999999;
    const pb = getBazarHeatRow(b._id)?.avgPrice ?? 999999;
    if (pa !== pb) return pa - pb;
    if (userLocation) {
      return distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
             distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
    }
    return 0;
  });

  const filteredBazars = searchQuery
    ? sortedBazars.filter((b: any) =>
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.nameBn?.includes(searchQuery) ||
        b.area?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedBazars;

  const selectedBazar = rawBazars.find((b: any) => b._id === selectedBazarId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-96px)] lg:min-h-[600px]">

      {/* ── Left: Map ───────────────────────────────────────── */}
      <div className="relative h-[58vh] lg:h-auto lg:flex-1 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-100">

        {/* Product filter (floating) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-2
                        bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 min-w-[260px]">
          <span className="text-sm text-slate-400 font-medium shrink-0">পণ্য:</span>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="">সব বাজার দেখুন</option>
            {products.map((p: any) => (
              <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name}</option>
            ))}
          </select>
          {fetchingHeatmap && <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />}
        </div>

        {/* Location button (floating, bottom-left) */}
        <button
          onClick={refreshLocation}
          disabled={locLoading}
          className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 bg-white/95 backdrop-blur-md
                     px-3.5 py-2.5 rounded-xl shadow-lg border border-white/60 text-sm font-semibold
                     text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-60"
        >
          <Navigation className={`w-4 h-4 ${locLoading ? 'animate-pulse' : ''}`} />
          {userLocation ? 'অবস্থান আপডেট' : 'আমার অবস্থান'}
        </button>

        {/* Legend (floating, bottom-right) */}
        <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl
                        px-3 py-2 shadow-lg border border-white/60 flex gap-3">
          {(['emerald', 'amber', 'rose'] as Tier[]).map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${DOT_COLOR[t]}`} />
              <span className="text-[11px] font-semibold text-slate-500">{TIER_COLOR[t].label}</span>
            </div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loadingBazars && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-slate-100 animate-pulse rounded-2xl">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-sm font-medium">বাজার লোড হচ্ছে...</p>
            </div>
          </div>
        )}

        {/* Real Leaflet Map */}
        <HeatmapMap
          bazars={rawBazars}
          heatmapData={heatmapData}
          userLocation={userLocation}
          selectedBazarId={selectedBazarId}
          onBazarSelect={(b: any) => setSelectedBazarId(b._id === selectedBazarId ? '' : b._id)}
          height="100%"
        />
      </div>

      {/* ── Right: Rankings panel ────────────────────────────── */}
      <div className="lg:w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white/80 backdrop-blur-xl
                      rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden
                      max-h-[70vh] lg:max-h-none">

        {/* Panel header */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-slate-800">বাজার র‍্যাংকিং</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedProductId
                  ? `${products.find((p: any) => p._id === selectedProductId)?.nameBn || 'পণ্য'} অনুযায়ী`
                  : 'পণ্য বেছে নিলে দাম দেখাবে'
                }
              </p>
            </div>
            {userLocation && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <Navigation className="w-3 h-3" /> লোকেশন সক্রিয়
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="বাজার খুঁজুন..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-400 transition-colors"
            />
          </div>
        </div>

        {/* Bazar list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredBazars.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">কোনো বাজার পাওয়া যায়নি</p>
          )}
          {filteredBazars.map((bazar: any, i: number) => {
            const tier      = getTier(bazar._id);
            const price     = getAvgPrice(bazar._id);
            const c         = TIER_COLOR[tier];
            const isSelected = bazar._id === selectedBazarId;
            const dist      = userLocation && bazar.lat && bazar.lng
              ? distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)
              : null;

            return (
              <button
                key={bazar._id}
                onClick={() => setSelectedBazarId(bazar._id === selectedBazarId ? '' : bazar._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? `${c.bg} ${c.ring} ring-2 shadow-sm`
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                {/* Rank */}
                <span className="text-sm font-black text-slate-300 w-5 text-center shrink-0">{i + 1}</span>

                {/* Colored dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_COLOR[tier]}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isSelected ? c.text : 'text-slate-700'}`}>
                    {bazar.nameBn || bazar.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400 truncate">{bazar.area}</span>
                    {dist !== null && (
                      <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                        {formatDistance(dist)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price + route */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {price !== null ? (
                    <span className={`font-black text-sm ${c.text}`}>৳{price}</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                  {userLocation && bazar.lat && bazar.lng && (
                    <a
                      href={googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[10px] font-semibold text-blue-500 hover:text-blue-700"
                    >
                      🗺️ রুট
                    </a>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected bazar detail strip */}
        {selectedBazar && (
          <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/60">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">{selectedBazar.nameBn || selectedBazar.name}</p>
                  <p className="text-xs text-slate-400">{selectedBazar.area}</p>
                  {getAvgPrice(selectedBazar._id) && (
                    <p className={`text-sm font-black mt-1 ${TIER_COLOR[getTier(selectedBazar._id)].text}`}>
                      গড় দাম: ৳{getAvgPrice(selectedBazar._id)}
                    </p>
                  )}
                </div>
              </div>
              {userLocation && selectedBazar.lat && selectedBazar.lng && (
                <a
                  href={googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, selectedBazar.lat, selectedBazar.lng)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-[#064E3B] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#043d2e] transition-colors shrink-0"
                >
                  🗺️ রুট দেখুন
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
