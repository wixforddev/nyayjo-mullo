'use client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserLocation {
  lat: number;
  lng: number;
}

interface LocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  /** true once the first fetch attempt has finished (success or fail) */
  settled: boolean;
}

const loadCached = (): UserLocation | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userLocation');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const initialState: LocationState = {
  location: loadCached(),
  loading: false,
  error: null,
  settled: !!loadCached(),
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    locationRequested(state) {
      state.loading = true;
      state.error = null;
    },
    locationResolved(state, action: PayloadAction<UserLocation>) {
      state.location = action.payload;
      state.loading = false;
      state.settled = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('userLocation', JSON.stringify(action.payload));
      }
    },
    locationFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.settled = true;
    },
    locationCleared(state) {
      state.location = null;
      state.settled = false;
      state.error = null;
    },
  },
});

export const { locationRequested, locationResolved, locationFailed, locationCleared } =
  locationSlice.actions;
export default locationSlice.reducer;
