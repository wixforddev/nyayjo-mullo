'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { distanceKm, formatDistance, googleMapsDirectionsUrl } from '../lib/distance';

async function fetchOsrmRoute(
  from: { lat: number; lng: number },
  to:   { lat: number; lng: number },
): Promise<L.LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.[0]) return null;
    const coords: [number, number][] = json.routes[0].geometry.coordinates;
    return coords.map(([lng, lat]) => L.latLng(lat, lng));
  } catch { return null; }
}

export interface HeatmapBazar {
  _id: string;
  name: string;
  nameBn: string;
  area: string;
  lat: number;
  lng: number;
}

export interface HeatmapPoint {
  bazarId: string | { _id: string };
  avgPrice: number;
}

type Tier = 'emerald' | 'amber' | 'rose' | 'slate';

const TIER_COLOR: Record<Tier, string> = {
  emerald: '#10B981',
  amber:   '#F59E0B',
  rose:    '#F43F5E',
  slate:   '#94A3B8',
};

const TIER_LABEL: Record<Tier, string> = {
  emerald: 'সস্তা',
  amber:   'মাঝারি',
  rose:    'দামি',
  slate:   'ডেটা নেই',
};

function getTier(bazarId: string, data: HeatmapPoint[]): Tier {
  const row = data.find(h =>
    (typeof h.bazarId === 'string' ? h.bazarId : h.bazarId._id) === bazarId
  );
  if (!row) return 'slate';
  const prices = data.map(h => h.avgPrice).filter(Boolean);
  if (!prices.length) return 'slate';
  const min = Math.min(...prices), max = Math.max(...prices);
  const ratio = (row.avgPrice - min) / (max - min || 1);
  if (ratio < 0.4) return 'emerald';
  if (ratio < 0.7) return 'amber';
  return 'rose';
}

function getAvgPrice(bazarId: string, data: HeatmapPoint[]): number | null {
  const row = data.find(h =>
    (typeof h.bazarId === 'string' ? h.bazarId : h.bazarId._id) === bazarId
  );
  return row ? Math.round(row.avgPrice) : null;
}

// User location dot with pulse ring
const userMarkerIcon = () => L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:rgba(59,130,246,0.95);
    border:3px solid white;
    box-shadow:0 0 0 8px rgba(59,130,246,0.2),0 2px 8px rgba(0,0,0,0.3);
    animation:upulse 2s infinite;
  "></div>
  <style>
    @keyframes upulse{
      0%,100%{box-shadow:0 0 0 8px rgba(59,130,246,0.2),0 2px 8px rgba(0,0,0,0.3)}
      50%{box-shadow:0 0 0 16px rgba(59,130,246,0.05),0 2px 8px rgba(0,0,0,0.3)}
    }
  </style>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Colored bazar circle marker
const bazarMarkerIcon = (tier: Tier, price: number | null, selected: boolean) => {
  const color = TIER_COLOR[tier];
  const size = selected ? 52 : 42;
  const label = price ? `৳${price}` : '—';
  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;flex-direction:column;align-items:center;gap:3px;
    ">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};
        border:${selected ? '4px' : '3px'} solid white;
        box-shadow:0 4px 14px ${color}88;
        display:flex;align-items:center;justify-content:center;
        font-size:${selected ? 20 : 16}px;
        transition:all 0.2s;
      ">🏪</div>
      <div style="
        background:${selected ? color : 'white'};
        color:${selected ? 'white' : '#0F172A'};
        font-size:11px;font-weight:800;
        padding:2px 7px;border-radius:8px;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.12);
        border:1px solid ${selected ? color : '#E2E8F0'};
      ">${label}</div>
    </div>`,
    iconSize: [80, selected ? 56 : 50],
    iconAnchor: [40, selected ? 52 : 42],
    popupAnchor: [0, -(selected ? 58 : 48)],
  });
};

interface Props {
  bazars: HeatmapBazar[];
  heatmapData: HeatmapPoint[];
  userLocation: { lat: number; lng: number } | null;
  selectedBazarId?: string;
  onBazarSelect?: (bazar: HeatmapBazar) => void;
  height?: string;
}

export default function HeatmapMapInner({
  bazars, heatmapData, userLocation, selectedBazarId, onBazarSelect, height = '100%',
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef  = useRef<L.Polyline | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: L.LatLngTuple = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [23.8103, 90.4125];

    const map = L.map(containerRef.current, { center, zoom: 13, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      delete (window as any).__showMapRoute;
    };
  }, []);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (!userLocation) return;
    const m = L.marker([userLocation.lat, userLocation.lng], { icon: userMarkerIcon() });
    m.addTo(map).bindPopup('<b>📍 আপনার অবস্থান</b>');
    userMarkerRef.current = m;
    map.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation]);

  // Bazar markers — rebuild on data/selection change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    bazars.forEach(bazar => {
      if (!bazar.lat || !bazar.lng) return;
      const tier     = getTier(bazar._id, heatmapData);
      const price    = getAvgPrice(bazar._id, heatmapData);
      const selected = bazar._id === selectedBazarId;
      const dist     = userLocation
        ? formatDistance(distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng))
        : '';
      const dirUrl = userLocation
        ? googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)
        : `https://www.google.com/maps/?q=${bazar.lat},${bazar.lng}`;

      const marker = L.marker([bazar.lat, bazar.lng], {
        icon: bazarMarkerIcon(tier, price, selected),
        zIndexOffset: selected ? 1000 : 0,
      });

      marker.bindPopup(L.popup({ maxWidth: 230, className: 'heatmap-popup' }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0">
          <div style="font-size:15px;font-weight:800;color:#064E3B;margin-bottom:3px">
            ${bazar.nameBn || bazar.name}
          </div>
          <div style="font-size:11px;color:#64748B;margin-bottom:5px">${bazar.area || ''}</div>
          ${price
            ? `<div style="font-size:16px;font-weight:900;color:${TIER_COLOR[tier]};margin-bottom:2px">৳${price}</div>
               <div style="font-size:10px;color:#94A3B8;margin-bottom:8px">${TIER_LABEL[tier]}</div>`
            : `<div style="font-size:12px;color:#94A3B8;margin-bottom:8px">দাম নেই</div>`
          }
          ${dist ? `<div style="font-size:12px;font-weight:700;color:#10B981;margin-bottom:8px">📍 ${dist} দূরে</div>` : ''}
          <div style="display:flex;gap:6px">
            <a href="${dirUrl}" target="_blank" rel="noopener"
              style="flex:1;display:inline-flex;align-items:center;gap:4px;background:#064E3B;color:white;
                     padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;
                     text-decoration:none;justify-content:center;box-sizing:border-box">
              🗺️ Google Maps
            </a>
            ${userLocation ? `<button onclick="window.__showMapRoute && window.__showMapRoute('${bazar._id}')"
              style="flex:1;display:inline-flex;align-items:center;gap:4px;background:#10B981;color:white;
                     padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;
                     border:none;cursor:pointer;justify-content:center;box-sizing:border-box">
              📍 ম্যাপে রুট
            </button>` : ''}
          </div>
        </div>
      `));

      marker.on('click', () => onBazarSelect?.(bazar));
      marker.addTo(map);
      markersRef.current[bazar._id] = marker;
    });

    // Global handler for popup "ম্যাপে রুট" button
    (window as any).__showMapRoute = (bazarId: string) => {
      const b = bazars.find(x => x._id === bazarId);
      if (b) onBazarSelect?.(b);
    };
  }, [bazars, heatmapData, userLocation, selectedBazarId, onBazarSelect]);

  // Pan + open popup for selected bazar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBazarId) return;
    const marker = markersRef.current[selectedBazarId];
    if (marker) {
      map.flyTo(marker.getLatLng(), 15, { duration: 0.8 });
      setTimeout(() => marker.openPopup(), 900);
    }
  }, [selectedBazarId]);

  // Draw OSRM route when bazar selected + user location available
  useEffect(() => {
    const map = mapRef.current;
    // Remove old route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    if (!map || !selectedBazarId || !userLocation) return;

    const bazar = bazars.find(b => b._id === selectedBazarId);
    if (!bazar?.lat || !bazar?.lng) return;

    fetchOsrmRoute(userLocation, { lat: bazar.lat, lng: bazar.lng }).then(points => {
      if (!points || !mapRef.current) return;
      const line = L.polyline(points, {
        color: '#064E3B',
        weight: 5,
        opacity: 0.75,
        dashArray: '10, 6',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
      routeLineRef.current = line;
    });
  }, [selectedBazarId, userLocation, bazars]);

  return (
    <div ref={containerRef} style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden', zIndex: 0 }} />
  );
}
