'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { distanceKm, formatDistance, googleMapsDirectionsUrl } from '../lib/distance';

export interface BazarMapBazar {
  _id: string;
  name: string;
  nameBn: string;
  area: string;
  lat: number;
  lng: number;
  isActive?: boolean;
}

export interface BazarMapProps {
  bazars: BazarMapBazar[];
  userLocation: { lat: number; lng: number } | null;
  selectedBazarId?: string;
  onBazarSelect?: (bazar: BazarMapBazar) => void;
  height?: string;
}

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

const userIcon = () => L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:rgba(59,130,246,0.9);
    border:3px solid white;
    box-shadow:0 0 0 6px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.3);
    animation:user-pulse 2s infinite;
  "></div>
  <style>
    @keyframes user-pulse {
      0%,100%{box-shadow:0 0 0 6px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.3)}
      50%{box-shadow:0 0 0 12px rgba(59,130,246,0.08),0 2px 8px rgba(0,0,0,0.3)}
    }
  </style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const bazarIcon = (selected: boolean, label: string) => L.divIcon({
  className: '',
  html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
    <div style="
      width:${selected ? 44 : 36}px;height:${selected ? 44 : 36}px;
      border-radius:50%;
      background:${selected ? '#064E3B' : '#10B981'};
      border:3px solid white;
      box-shadow:0 3px 12px rgba(6,78,59,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:${selected ? 22 : 18}px;
      transition:all 0.2s;
    ">🏪</div>
    <div style="
      background:${selected ? '#064E3B' : 'white'};
      color:${selected ? 'white' : '#0F172A'};
      font-size:10px;font-weight:700;
      padding:2px 6px;border-radius:8px;
      white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.15);
      max-width:90px;overflow:hidden;text-overflow:ellipsis;
    ">${label}</div>
  </div>`,
  iconSize: [90, 60],
  iconAnchor: [45, selected ? 44 : 36],
  popupAnchor: [0, -(selected ? 50 : 42)],
});

export default function BazarMapInner({
  bazars,
  userLocation,
  selectedBazarId,
  onBazarSelect,
  height = '420px',
}: BazarMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const markersRef    = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef  = useRef<L.Polyline | null>(null);

  // Initialize map
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
      delete (window as any).__bazarMapRoute;
    };
  }, []);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (!userLocation) return;
    const m = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon() });
    m.addTo(map).bindPopup('<b>📍 আপনার অবস্থান</b>');
    userMarkerRef.current = m;
    map.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation]);

  // Bazar markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    bazars.forEach(bazar => {
      if (!bazar.lat || !bazar.lng) return;
      const selected = bazar._id === selectedBazarId;
      const label    = bazar.nameBn || bazar.name;
      const dist     = userLocation
        ? formatDistance(distanceKm(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng))
        : '';
      const dirUrl = userLocation
        ? googleMapsDirectionsUrl(userLocation.lat, userLocation.lng, bazar.lat, bazar.lng)
        : `https://www.google.com/maps/?q=${bazar.lat},${bazar.lng}`;

      const marker = L.marker([bazar.lat, bazar.lng], {
        icon: bazarIcon(selected, label),
        zIndexOffset: selected ? 1000 : 0,
      });

      marker.bindPopup(L.popup({ maxWidth: 230, className: 'bazar-popup' }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0">
          <div style="font-size:15px;font-weight:800;color:#064E3B;margin-bottom:4px">${label}</div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px">${bazar.area || ''}</div>
          ${dist ? `<div style="font-size:12px;font-weight:700;color:#10B981;margin-bottom:8px">📍 ${dist} দূরে</div>` : ''}
          <div style="display:flex;gap:6px">
            <a href="${dirUrl}" target="_blank" rel="noopener"
              style="flex:1;display:inline-flex;align-items:center;gap:4px;background:#064E3B;color:white;
                     padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;
                     text-decoration:none;justify-content:center;box-sizing:border-box">
              🗺️ Google Maps
            </a>
            ${userLocation ? `<button onclick="window.__bazarMapRoute && window.__bazarMapRoute('${bazar._id}')"
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
    (window as any).__bazarMapRoute = (bazarId: string) => {
      const b = bazars.find(x => x._id === bazarId);
      if (b) onBazarSelect?.(b);
    };
  }, [bazars, userLocation, selectedBazarId, onBazarSelect]);

  // Pan to selected bazar
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
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: '20px', overflow: 'hidden', zIndex: 0 }}
    />
  );
}
