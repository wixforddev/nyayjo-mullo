import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X } from 'lucide-react';

interface Props {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;border-radius:50% 50% 50% 0;
    background:#064E3B;border:3px solid white;
    transform:rotate(-45deg);
    box-shadow:0 3px 12px rgba(6,78,59,0.5);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export function LocationPicker({ lat, lng, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasCoords = lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng));

  useEffect(() => {
    if (!open) return;

    // small delay so the modal DOM is ready
    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      const initLat = hasCoords ? Number(lat) : 23.8103;
      const initLng = hasCoords ? Number(lng) : 90.4125;

      const map = L.map(containerRef.current, {
        center: [initLat, initLng],
        zoom: hasCoords ? 15 : 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (hasCoords) {
        const m = L.marker([initLat, initLng], { icon: markerIcon, draggable: true });
        m.addTo(map);
        m.on('dragend', () => {
          const p = m.getLatLng();
          onChange(p.lat.toFixed(6), p.lng.toFixed(6));
        });
        markerRef.current = m;
      }

      map.on('click', (e) => {
        const { lat: clat, lng: clng } = e.latlng;
        onChange(clat.toFixed(6), clng.toFixed(6));
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          const m = L.marker(e.latlng, { icon: markerIcon, draggable: true });
          m.addTo(map);
          m.on('dragend', () => {
            const p = m.getLatLng();
            onChange(p.lat.toFixed(6), p.lng.toFixed(6));
          });
          markerRef.current = m;
        }
      });

      mapRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markerRef.current = null;
    };
  }, [open]);

  // Keep marker in sync if lat/lng props change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !hasCoords) return;
    markerRef.current.setLatLng([Number(lat), Number(lng)]);
    mapRef.current.panTo([Number(lat), Number(lng)]);
  }, [lat, lng]);

  const goToMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      mapRef.current?.flyTo([latitude, longitude], 16, { duration: 0.8 });
    });
  };

  return (
    <>
      {/* Preview + trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
      >
        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
        {hasCoords
          ? <span className="font-mono text-xs">{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</span>
          : <span className="text-slate-400">মানচিত্রে লোকেশন পিক করুন</span>
        }
        {hasCoords && <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">সেট</span>}
      </button>

      {/* Map modal */}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ height: '520px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">লোকেশন নির্বাচন</h3>
                <p className="text-xs text-slate-400 mt-0.5">মানচিত্রে ক্লিক করুন বা মার্কার টেনে নিন</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goToMyLocation}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> আমার অবস্থান
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Map */}
            <div ref={containerRef} className="flex-1 w-full" />

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {hasCoords
                  ? <span className="font-mono">Lat: {Number(lat).toFixed(5)}, Lng: {Number(lng).toFixed(5)}</span>
                  : 'কোনো লোকেশন নির্বাচিত হয়নি'
                }
              </span>
              <button type="button" onClick={() => setOpen(false)}
                className="bg-[#064E3B] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-[#043d2e] transition-colors">
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
