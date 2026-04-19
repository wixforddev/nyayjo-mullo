'use client';
import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  locationRequested,
  locationResolved,
  locationFailed,
} from '../store/slices/locationSlice';

export type { UserLocation } from '../store/slices/locationSlice';

/**
 * Returns the user's current GPS location from the Redux store.
 *
 * - First component to mount triggers the geolocation request.
 * - All subsequent components just read from the store — no duplicate requests.
 * - Call `refresh()` to force a new GPS reading (e.g. after a long session).
 */
export function useUserLocation() {
  const dispatch  = useAppDispatch();
  const location  = useAppSelector(s => s.location.location);
  const loading   = useAppSelector(s => s.location.loading);
  const error     = useAppSelector(s => s.location.error);
  const settled   = useAppSelector(s => s.location.settled);

  const fetchLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      dispatch(locationFailed('এই ব্রাউজারে লোকেশন সাপোর্ট নেই'));
      return;
    }
    dispatch(locationRequested());
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(locationResolved({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
      },
      () => {
        dispatch(locationFailed('লোকেশন অ্যাক্সেস দেওয়া হয়নি'));
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [dispatch]);

  // Auto-fetch only once per session (when not yet settled)
  useEffect(() => {
    if (!settled && !loading) {
      fetchLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { location, loading, error, refresh: fetchLocation };
}
