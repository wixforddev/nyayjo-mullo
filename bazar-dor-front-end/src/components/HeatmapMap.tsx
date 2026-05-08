'use client';
import dynamic from 'next/dynamic';
import type { HeatmapBazar, HeatmapPoint, HeatmapMapProps } from './HeatmapMapInner';

const HeatmapMapInner = dynamic(() => import('./HeatmapMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm font-medium">মানচিত্র লোড হচ্ছে...</p>
      </div>
    </div>
  ),
});

export type { HeatmapBazar, HeatmapPoint };

export default function HeatmapMap(props: HeatmapMapProps) {
  return <HeatmapMapInner {...props} />;
}
