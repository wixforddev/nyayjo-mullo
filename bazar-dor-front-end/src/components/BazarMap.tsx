'use client';
import dynamic from 'next/dynamic';
import type { BazarMapBazar, BazarMapProps } from './BazarMapInner';

// Dynamic import — Leaflet cannot run on the server
const BazarMapInner = dynamic(() => import('./BazarMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '420px', borderRadius: '20px', overflow: 'hidden' }}
      className="bg-slate-100 animate-pulse flex items-center justify-center">
      <div className="text-center text-slate-400">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm font-medium">মানচিত্র লোড হচ্ছে...</p>
      </div>
    </div>
  ),
});

export type { BazarMapBazar };

export default function BazarMap(props: BazarMapProps) {
  return <BazarMapInner {...props} />;
}
