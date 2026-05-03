import axios, { AxiosError } from 'axios';
import config from '../config/config';
import { Bazar, BazarCacheCell } from '../models';

// ── Constants ────────────────────────────────────────────────────────────────
const PLACES_URL    = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const RADIUS_M      = 5000;          // 5 km search radius
const CACHE_TTL_MS  = 90 * 24 * 60 * 60 * 1000;  // 90 days
const GRID_STEP     = 0.05;          // ~5.5 km grid resolution
const PAGE_DELAY_MS = 2200;          // Google requires ≥2s between paginated calls
const KEYWORDS      = ['বাজার', 'হাট']; // search terms for markets

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Round lat/lng to the nearest grid cell center */
const toGridCell = (lat: number, lng: number): { key: string; lat: number; lng: number } => {
  const gridLat = Math.round(lat / GRID_STEP) * GRID_STEP;
  const gridLng = Math.round(lng / GRID_STEP) * GRID_STEP;
  return {
    key: `${gridLat.toFixed(2)}_${gridLng.toFixed(2)}`,
    lat: parseFloat(gridLat.toFixed(6)),
    lng: parseFloat(gridLng.toFixed(6)),
  };
};

/** Extract the last meaningful part of a vicinity string as city */
const extractCity = (vicinity: string): string => {
  const parts = vicinity.split(',').map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Bangladesh';
};

/** Sleep helper */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ── Google API calls ─────────────────────────────────────────────────────────

interface PlacePage {
  results: any[];
  nextPageToken?: string;
}

const fetchPage = async (
  lat: number,
  lng: number,
  keyword: string,
  pageToken?: string,
): Promise<PlacePage> => {
  const params: Record<string, any> = {
    location: `${lat},${lng}`,
    radius:   RADIUS_M,
    keyword,
    language: 'bn',
    key:      config.googlePlacesApiKey,
  };
  if (pageToken) params.pagetoken = pageToken;

  const { data } = await axios.get(PLACES_URL, { params, timeout: 12000 });

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places: ${data.status} — ${data.error_message ?? ''}`);
  }

  return { results: data.results ?? [], nextPageToken: data.next_page_token };
};

/** Fetch up to 3 pages (max 60 results) for one keyword + location */
const fetchAllPages = async (lat: number, lng: number, keyword: string): Promise<any[]> => {
  const all: any[] = [];
  try {
    const p1 = await fetchPage(lat, lng, keyword);
    all.push(...p1.results);

    if (p1.nextPageToken) {
      await sleep(PAGE_DELAY_MS);
      const p2 = await fetchPage(lat, lng, keyword, p1.nextPageToken);
      all.push(...p2.results);

      if (p2.nextPageToken) {
        await sleep(PAGE_DELAY_MS);
        const p3 = await fetchPage(lat, lng, keyword, p2.nextPageToken);
        all.push(...p3.results);
      }
    }
  } catch (err) {
    const msg = err instanceof AxiosError ? err.message : String(err);
    console.error(`[GooglePlaces] fetchAllPages error (${keyword} @ ${lat},${lng}): ${msg}`);
  }
  return all;
};

// ── DB persistence ────────────────────────────────────────────────────────────

/** Upsert a single Google Place into the Bazar collection */
const upsertPlace = async (place: any, gridKey: string): Promise<void> => {
  if (!place.geometry?.location) return;

  const { lat, lng } = place.geometry.location;

  await Bazar.findOneAndUpdate(
    { placeId: place.place_id },
    {
      $setOnInsert: { source: 'google' },
      $set: {
        name:     place.name,
        nameBn:   place.name,
        area:     place.vicinity ?? '',
        city:     extractCity(place.vicinity ?? ''),
        lat,
        lng,
        location: { type: 'Point', coordinates: [lng, lat] },
        placeId:  place.place_id,
        cachedAt: new Date(),
        gridKey,
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );
};

/** Deduplicate by place_id and persist all places for a grid cell */
const savePlaces = async (places: any[], gridKey: string): Promise<number> => {
  const seen = new Set<string>();
  let saved = 0;

  for (const place of places) {
    if (!place.place_id || seen.has(place.place_id)) continue;
    seen.add(place.place_id);
    try {
      await upsertPlace(place, gridKey);
      saved++;
    } catch (_) { /* skip individual failures */ }
  }
  return saved;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Ensure the ~5km grid cell containing (lat, lng) is populated in the DB.
 * If the cell is already cached and within TTL, this is a no-op.
 * Called automatically on every /bazars/nearby request.
 */
const ensureCellCached = async (lat: number, lng: number): Promise<void> => {
  if (!config.googlePlacesApiKey) return; // gracefully skip if no key

  const { key: gridKey, lat: gridLat, lng: gridLng } = toGridCell(lat, lng);
  const ttlCutoff = new Date(Date.now() - CACHE_TTL_MS);

  const cell = await BazarCacheCell.findOne({ gridKey });
  if (cell && cell.fetchedAt > ttlCutoff) return; // still fresh

  // Fetch all keywords in parallel to minimise latency
  const [bazarResults, hatResults] = await Promise.all([
    fetchAllPages(gridLat, gridLng, KEYWORDS[0]),
    fetchAllPages(gridLat, gridLng, KEYWORDS[1]),
  ]);

  const allPlaces = [...bazarResults, ...hatResults];
  const count     = await savePlaces(allPlaces, gridKey);
  const status    = allPlaces.length === 0 ? 'empty' : 'success';

  await BazarCacheCell.findOneAndUpdate(
    { gridKey },
    { gridKey, centerLat: gridLat, centerLng: gridLng, fetchedAt: new Date(), bazarCount: count, status },
    { upsert: true },
  );
};

/**
 * Force-refresh a single grid cell, ignoring TTL.
 * Useful for admin-triggered manual refresh.
 */
const refreshCell = async (lat: number, lng: number): Promise<{ gridKey: string; count: number }> => {
  if (!config.googlePlacesApiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const { key: gridKey, lat: gridLat, lng: gridLng } = toGridCell(lat, lng);

  const [bazarResults, hatResults] = await Promise.all([
    fetchAllPages(gridLat, gridLng, KEYWORDS[0]),
    fetchAllPages(gridLat, gridLng, KEYWORDS[1]),
  ]);

  const allPlaces = [...bazarResults, ...hatResults];
  const count     = await savePlaces(allPlaces, gridKey);

  await BazarCacheCell.findOneAndUpdate(
    { gridKey },
    { gridKey, centerLat: gridLat, centerLng: gridLng, fetchedAt: new Date(), bazarCount: count, status: count > 0 ? 'success' : 'empty' },
    { upsert: true },
  );

  return { gridKey, count };
};

/**
 * Returns the grid key and cache status for a given location.
 * Used by the admin dashboard to inspect cache coverage.
 */
const getCellStatus = async (lat: number, lng: number) => {
  const { key: gridKey } = toGridCell(lat, lng);
  return BazarCacheCell.findOne({ gridKey });
};

export { ensureCellCached, refreshCell, getCellStatus, toGridCell, GRID_STEP };
