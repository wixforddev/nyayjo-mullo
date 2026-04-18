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

interface Props {
  bazars: BazarMapBazar[];
  userLocation: { lat: number; lng: number } | null;
  selectedBazarId?: string;
  onBazarSelect?: (bazar: BazarMapBazar) => void;
  height?: string;
}

// Custom icons (no image files needed)
const userIcon = (lat: number, lng: number) => L.divIcon({
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
  html: `<div style="
    display:flex;flex-direction:column;align-items:center;gap:4px;
  ">
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
}: Props) {
  const mapRef     = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngTuple = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [23.8103, 90.4125]; // Dhaka default

    const map = L.map(containerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon(userLocation.lat, userLocation.lng) });
    marker.addTo(map).bindPopup('<b>📍 আপনার অবস্থান</b>');
    return () => { marker.remove(); };
  }, [userLocation]);

  // Bazar markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    bazars.forEach(bazar => {
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

      const popup = L.popup({ maxWidth: 220, className: 'bazar-popup' }).setContent(`
        <div style="font-family:system-ui,sans-serif;padding:4px 0">
          <div style="font-size:15px;font-weight:800;color:#064E3B;margin-bottom:4px">${label}</div>
          <div style="font-size:11px;color:#64748B;margin-bottom:6px">${bazar.area || ''}</div>
          ${dist ? `<div style="font-size:12px;font-weight:700;color:#10B981;margin-bottom:8px">📍 ${dist} দূরে</div>` : ''}
          <a href="${dirUrl}" target="_blank" rel="noopener"
            style="display:inline-flex;align-items:center;gap:4px;background:#064E3B;color:white;
                   padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;
                   text-decoration:none;width:100%;justify-content:center;box-sizing:border-box">
            🗺️ রুট দেখুন
          </a>
        </div>
      `);

      marker.bindPopup(popup);
      marker.on('click', () => {
        onBazarSelect?.(bazar);
      });

      marker.addTo(map);
      markersRef.current[bazar._id] = marker;
    });
  }, [bazars, userLocation, selectedBazarId, onBazarSelect]);

  // Pan to selected bazar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedBazarId) return;
    const marker = markersRef.current[selectedBazarId];
    if (marker) {
      map.flyTo(marker.getLatLng(), 15, { duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedBazarId]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%', borderRadius: '20px', overflow: 'hidden', zIndex: 0 }}
    />
  );
}
