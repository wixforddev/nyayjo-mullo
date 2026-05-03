/**
 * One-time script: fetch ALL bazars across Bangladesh in a SINGLE Overpass query.
 * Much faster than the grid approach — completes in 2-10 minutes.
 *
 * Usage:
 *   npx ts-node src/scripts/seedBangladeshBazars.ts
 *
 * What it does:
 *   1. Sends ONE bbox query covering all of Bangladesh to Overpass API
 *   2. Saves all results to MongoDB (upsert by OSM ID)
 *   3. Marks the entire country as cached in BazarCacheCell
 *   Done. No grid loop, no hours of waiting.
 *
 * Attribution (required by ODbL):
 *   Add "© OpenStreetMap contributors" somewhere visible in your app.
 */

import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import path     from 'path';
import axiosLib from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Bangladesh bounding box ───────────────────────────────────────────────────
// Format for Overpass bbox: (south, west, north, east)
const BD_SOUTH = 20.74;
const BD_WEST  = 88.01;
const BD_NORTH = 26.63;
const BD_EAST  = 92.68;

const USER_AGENT    = 'BazarDor/1.0 (bazardor.com; price-tracking app for Bangladesh)';
const OVERPASS_URL  = 'https://overpass-api.de/api/interpreter';
const FALLBACK_URL  = 'https://overpass.kumi.systems/api/interpreter';

// ── Build the single full-country query ──────────────────────────────────────
const buildBangladeshQuery = (): string =>
  `[out:json][timeout:300];(node["shop"="marketplace"](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST});node["amenity"="marketplace"](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST});node["name"~"বাজার|হাট|Bazar|Bazaar|Haat|Market",i](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST});way["shop"="marketplace"](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST});way["amenity"="marketplace"](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST});way["name"~"বাজার|হাট|Bazar|Bazaar|Haat|Market",i](${BD_SOUTH},${BD_WEST},${BD_NORTH},${BD_EAST}););out center;`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

// Grid key helper (same as osmPlaces.service.ts)
const GRID_STEP = 0.05;
const toGridKey = (lat: number, lng: number): string => {
  const gLat = Math.round(lat / GRID_STEP) * GRID_STEP;
  const gLng = Math.round(lng / GRID_STEP) * GRID_STEP;
  return `${gLat.toFixed(2)}_${gLng.toFixed(2)}`;
};

// ── Fetch from Overpass ───────────────────────────────────────────────────────
const fetchAllBazars = async (): Promise<any[]> => {
  const query = buildBangladeshQuery();

  const tryFetch = async (url: string): Promise<any[]> => {
    console.log(`\n🌐  Fetching from: ${url}`);
    console.log('⏳  This may take 1-5 minutes (server-side processing)...\n');
    const { data } = await axiosLib.get(url, {
      params:  { data: query },
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      timeout: 360000, // 6 minutes
    });
    return data.elements ?? [];
  };

  // Try primary, then fallback
  try {
    return await tryFetch(OVERPASS_URL);
  } catch (err: any) {
    const status = err?.response?.status;
    console.warn(`\n⚠️   Primary server failed (${status ?? err.message}). Trying fallback in 10s...`);
    await sleep(10000);
    return await tryFetch(FALLBACK_URL);
  }
};

// ── Save to MongoDB ───────────────────────────────────────────────────────────
const saveAllToDb = async (elements: any[], Bazar: any, BazarCacheCell: any): Promise<number> => {
  const seen    = new Set<string>();
  let   saved   = 0;
  let   skipped = 0;
  const gridCellCounts: Record<string, number> = {};

  console.log(`\n💾  Saving ${elements.length} elements to MongoDB...\n`);

  for (let i = 0; i < elements.length; i++) {
    const el     = elements[i];
    const coords = getCoords(el);
    if (!coords) { skipped++; continue; }

    const osmId = `osm_${el.type}_${el.id}`;
    if (seen.has(osmId)) { skipped++; continue; }
    seen.add(osmId);

    const { name, nameBn } = parseName(el.tags);
    if (!name && !nameBn) { skipped++; continue; }

    const gridKey = toGridKey(coords.lat, coords.lng);
    gridCellCounts[gridKey] = (gridCellCounts[gridKey] || 0) + 1;

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
    } catch (_) { skipped++; }

    // Progress every 100 items
    if ((i + 1) % 100 === 0 || i === elements.length - 1) {
      const pct = (((i + 1) / elements.length) * 100).toFixed(1);
      process.stdout.write(`\r   DB write: ${pct}%  (${saved} saved, ${skipped} skipped)   `);
    }
  }

  // Mark all covered grid cells as cached
  console.log(`\n\n📦  Marking ${Object.keys(gridCellCounts).length} grid cells as cached...`);
  const now = new Date();
  for (const [gridKey, count] of Object.entries(gridCellCounts)) {
    const [latStr, lngStr] = gridKey.split('_');
    await BazarCacheCell.findOneAndUpdate(
      { gridKey },
      { gridKey, centerLat: parseFloat(latStr), centerLng: parseFloat(lngStr), fetchedAt: now, bazarCount: count, status: 'success' },
      { upsert: true },
    );
  }

  return saved;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const main = async () => {
  const MONGODB_URL = process.env.MONGODB_URL;
  if (!MONGODB_URL) { console.error('❌  MONGODB_URL not set in .env'); process.exit(1); }

  console.log('\n🗺️   বাজার দর — OpenStreetMap Bangladesh Seeder (Full-Country Mode)');
  console.log('━'.repeat(60));
  console.log('📍  Coverage : Entire Bangladesh (single bbox query)');
  console.log('⚡  Method   : ONE Overpass API call (not grid loop)');
  console.log('⏱️   ETA      : 2–10 minutes total');
  console.log('💰  Cost     : FREE (OpenStreetMap ODbL license)');
  console.log('━'.repeat(60));

  await mongoose.connect(MONGODB_URL);
  console.log('\n✅  MongoDB connected');

  const { default: Bazar }         = await import('../models/bazar.model');
  const { default: BazarCacheCell } = await import('../models/bazarCacheCell.model');

  const startTime = Date.now();

  // Fetch
  let elements: any[] = [];
  try {
    elements = await fetchAllBazars();
  } catch (err: any) {
    console.error(`\n❌  Fetch failed: ${err.message}`);
    console.log('\n💡  Tip: Check your internet connection and try again.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✅  Fetched ${elements.length} OSM elements from Overpass`);

  // Save
  const saved = await saveAllToDb(elements, Bazar, BazarCacheCell);

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins    = Math.floor(elapsed / 60);
  const secs    = elapsed % 60;

  console.log('\n' + '━'.repeat(60));
  console.log('🎉  Seeding complete!');
  console.log(`   OSM elements fetched : ${elements.length}`);
  console.log(`   Bazars saved to DB   : ${saved}`);
  console.log(`   Time taken           : ${mins}m ${secs}s`);
  console.log('━'.repeat(60));
  console.log('\n📝  Attribution reminder:');
  console.log('   Add "© OpenStreetMap contributors" to your app footer.\n');

  await mongoose.disconnect();
  process.exit(0);
};

main().catch(err => {
  console.error('\n❌  Fatal:', err?.message ?? err);
  process.exit(1);
});
