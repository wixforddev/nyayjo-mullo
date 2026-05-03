import axios from 'axios';
import { Bazar, BazarCacheCell } from '../models';

// ── Constants ────────────────────────────────────────────────────────────────
const RADIUS_M     = 5000;
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const GRID_STEP    = 0.05;

// Use only the primary server — mirrors have different rate limits and formats.
// If primary is down, fallback mirrors are tried with a longer wait.
const PRIMARY_URL  = 'https://overpass-api.de/api/interpreter';
const FALLBACK_URL = 'https://overpass.kumi.systems/api/interpreter';

// Overpass servers require a proper User-Agent to avoid 406 rejections
const USER_AGENT = 'BazarDor/1.0 (bazardor.com; price-tracking app for Bangladesh)';

// ── Helpers ──────────────────────────────────────────────────────────────────

const toGridCell = (lat: number, lng: number) => {
  const gridLat = Math.round(lat / GRID_STEP) * GRID_STEP;
  const gridLng = Math.round(lng / GRID_STEP) * GRID_STEP;
  return {
    key: `${gridLat.toFixed(2)}_${gridLng.toFixed(2)}`,
    lat: parseFloat(gridLat.toFixed(6)),
    lng: parseFloat(gridLng.toFixed(6)),
  };
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Overpass Query ────────────────────────────────────────────────────────────

const buildQuery = (lat: number, lng: number): string =>
  `[out:json][timeout:55];(node["shop"="marketplace"](around:${RADIUS_M},${lat},${lng});node["amenity"="marketplace"](around:${RADIUS_M},${lat},${lng});node["name"~"বাজার|হাট|Bazar|Bazaar|Haat|Market",i](around:${RADIUS_M},${lat},${lng});way["shop"="marketplace"](around:${RADIUS_M},${lat},${lng});way["name"~"বাজার|হাট|Bazar|Bazaar|Haat|Market",i](around:${RADIUS_M},${lat},${lng}););out center;`;

// ── HTTP call with retry ──────────────────────────────────────────────────────

const callOverpass = async (url: string, query: string): Promise<any[]> => {
  const { data } = await axios.get(url, {
    params:  { data: query },
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    timeout: 65000,
  });
  return data.elements ?? [];
};

/**
 * Fetch from Overpass with retry logic:
 * - Try primary server first (up to MAX_RETRIES times)
 * - On 429: wait RATE_LIMIT_WAIT then retry same server
 * - On persistent failure: try fallback server once
 * - Returns [] if everything fails (non-blocking for caller)
 */
const fetchFromOverpass = async (lat: number, lng: number): Promise<any[]> => {
  const query       = buildQuery(lat, lng);
  const MAX_RETRIES = 3;
  const BASE_WAIT   = 8000;  // 8s base wait on failure
  const RATE_WAIT   = 60000; // 60s wait on 429

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOverpass(PRIMARY_URL, query);
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 429) {
        // Rate limited — wait 60s then retry
        console.warn(`[OSM] Rate limited (429). Waiting 60s before retry ${attempt}/${MAX_RETRIES}...`);
        await sleep(RATE_WAIT);
        continue;
      }

      if (status === 504 || status === 502) {
        // Server overloaded — wait and retry
        const wait = BASE_WAIT * attempt;
        console.warn(`[OSM] Server busy (${status}). Waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }

      // Other error — log and try fallback
      console.warn(`[OSM] Primary failed (${status ?? err.message}). Trying fallback...`);
      break;
    }
  }

  // Try fallback server once
  try {
    await sleep(5000); // give some breathing room before hitting fallback
    return await callOverpass(FALLBACK_URL, query);
  } catch (err: any) {
    console.error(`[OSM] All servers failed for (${lat}, ${lng}): ${err?.response?.status ?? err.message}`);
    return [];
  }
};

// ── Parse OSM element → Bazar fields ─────────────────────────────────────────

const getCoords = (el: any): { lat: number; lng: number } | null => {
  if (el.type === 'node' && el.lat != null) return { lat: el.lat,        lng: el.lon };
  if (el.center?.lat != null)               return { lat: el.center.lat, lng: el.center.lon };
  return null;
};

const parseName = (tags: Record<string, string> = {}) => ({
  nameBn: tags['name:bn'] || tags.name || '',
  name:   tags['name:en'] || tags.name || tags['name:bn'] || '',
});

const parseArea = (tags: Record<string, string> = {}) =>
  tags['addr:street'] || tags['addr:suburb'] || tags['addr:city'] || tags.description || '';

const parseCity = (tags: Record<string, string> = {}) =>
  tags['addr:city'] || tags['addr:district'] || tags['is_in:city'] || 'Bangladesh';

// ── DB Persistence ────────────────────────────────────────────────────────────

const savePlaces = async (elements: any[], gridKey: string): Promise<number> => {
  const seen = new Set<string>();
  let saved  = 0;

  for (const el of elements) {
    const coords = getCoords(el);
    if (!coords) continue;

    const osmId = `osm_${el.type}_${el.id}`;
    if (seen.has(osmId)) continue;
    seen.add(osmId);

    const { name, nameBn } = parseName(el.tags);
    if (!name && !nameBn) continue;

    try {
      await Bazar.findOneAndUpdate(
        { placeId: osmId },
        {
          $setOnInsert: { source: 'osm' },
          $set: {
            name,
            nameBn,
            area:     parseArea(el.tags),
            city:     parseCity(el.tags),
            lat:      coords.lat,
            lng:      coords.lng,
            location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
            placeId:  osmId,
            cachedAt: new Date(),
            gridKey,
            isActive: true,
          },
        },
        { upsert: true, new: true },
      );
      saved++;
    } catch (_) { /* skip duplicates / race conditions */ }
  }

  return saved;
};

// ── Public API ────────────────────────────────────────────────────────────────

const ensureCellCached = async (lat: number, lng: number): Promise<void> => {
  const { key: gridKey, lat: gridLat, lng: gridLng } = toGridCell(lat, lng);
  const ttlCutoff = new Date(Date.now() - CACHE_TTL_MS);

  const cell = await BazarCacheCell.findOne({ gridKey });
  if (cell && cell.fetchedAt > ttlCutoff) return;

  const elements = await fetchFromOverpass(gridLat, gridLng);
  const count    = await savePlaces(elements, gridKey);

  await BazarCacheCell.findOneAndUpdate(
    { gridKey },
    { gridKey, centerLat: gridLat, centerLng: gridLng, fetchedAt: new Date(), bazarCount: count, status: elements.length === 0 ? 'empty' : 'success' },
    { upsert: true },
  );
};

const refreshCell = async (lat: number, lng: number): Promise<{ gridKey: string; count: number }> => {
  const { key: gridKey, lat: gridLat, lng: gridLng } = toGridCell(lat, lng);

  const elements = await fetchFromOverpass(gridLat, gridLng);
  const count    = await savePlaces(elements, gridKey);

  await BazarCacheCell.findOneAndUpdate(
    { gridKey },
    { gridKey, centerLat: gridLat, centerLng: gridLng, fetchedAt: new Date(), bazarCount: count, status: count > 0 ? 'success' : 'empty' },
    { upsert: true },
  );

  return { gridKey, count };
};

const getCellStatus = async (lat: number, lng: number) => {
  const { key: gridKey } = toGridCell(lat, lng);
  return BazarCacheCell.findOne({ gridKey });
};

export { ensureCellCached, refreshCell, getCellStatus, toGridCell, GRID_STEP };
