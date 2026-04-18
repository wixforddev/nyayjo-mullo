'use client';
import { useState, useEffect, useCallback } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
}

const STORAGE_KEY = 'userLocation';

function loadCached(): UserLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(loc: UserLocation) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

/**
 * Returns the user's current GPS location.
 * Loads from localStorage cache immediately, then refreshes from the browser
 * Geolocation API and saves the new value.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(loadCached);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setError('এই ব্রাউজারে লোকেশন সাপোর্ট নেই');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(loc);
        saveCache(loc);
        setLoading(false);
      },
      (err) => {
        setError('লোকেশন অ্যাক্সেস দেওয়া হয়নি');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Auto-refresh once on mount
  useEffect(() => { refresh(); }, []);

  return { location, loading, error, refresh };
}
