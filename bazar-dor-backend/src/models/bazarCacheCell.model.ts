import mongoose from 'mongoose';

/**
 * Tracks which ~5km grid cells have already been seeded from Google Places.
 * Before calling Google API, we check this collection.
 * If the cell exists and fetchedAt is within TTL, we skip the API call.
 */
interface BazarCacheCellDocument extends mongoose.Document {
  gridKey: string;    // e.g. "23.80_90.40"
  centerLat: number;
  centerLng: number;
  fetchedAt: Date;
  bazarCount: number; // how many bazars were found in this cell
  status: 'success' | 'empty' | 'error';
}

const bazarCacheCellSchema = new mongoose.Schema<BazarCacheCellDocument>(
  {
    gridKey:    { type: String, required: true, unique: true },
    centerLat:  { type: Number, required: true },
    centerLng:  { type: Number, required: true },
    fetchedAt:  { type: Date,   required: true },
    bazarCount: { type: Number, default: 0 },
    status:     { type: String, enum: ['success', 'empty', 'error'], default: 'success' },
  },
  { timestamps: true },
);

const BazarCacheCell = mongoose.model<BazarCacheCellDocument>('BazarCacheCell', bazarCacheCellSchema);

export default BazarCacheCell;
export { BazarCacheCellDocument };
