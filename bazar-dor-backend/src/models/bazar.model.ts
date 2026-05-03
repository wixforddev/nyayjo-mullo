import mongoose from 'mongoose';
import { paginate } from './plugins';
import { PaginateResult } from './plugins/paginate.plugin';

interface BazarDocument extends mongoose.Document {
  name: string;
  nameBn: string;
  area: string;
  city: string;
  lat: number;
  lng: number;
  isActive: boolean;
  source: 'admin' | 'google' | 'osm';
  placeId: string | null;
  cachedAt: Date | null;
  gridKey: string | null;
  location: { type: string; coordinates: [number, number] };
}

interface BazarModel extends mongoose.Model<BazarDocument> {
  paginate(filter: any, options: any): Promise<PaginateResult<BazarDocument>>;
}

const bazarSchema = new mongoose.Schema<BazarDocument, BazarModel>(
  {
    name:    { type: String, required: false, trim: true, default: '' },
    nameBn:  { type: String, required: false, trim: true, default: '' },
    area:    { type: String, required: false, trim: true, default: '' },
    city:    { type: String, default: 'Dhaka', trim: true },
    lat:     { type: Number, default: 23.8103 },
    lng:     { type: Number, default: 90.4125 },
    isActive: { type: Boolean, default: true },

    // ── Google Places caching fields ──────────────────────────
    source:   { type: String, enum: ['admin', 'google', 'osm'], default: 'admin' },
    placeId:  { type: String, default: null },   // Google Place ID
    cachedAt: { type: Date,   default: null },   // when fetched from Google
    gridKey:  { type: String, default: null },   // "23.80_90.40" cache cell key

    // GeoJSON Point — auto-synced from lat/lng via pre-save hook
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [90.4125, 23.8103] }, // [lng, lat]
    },
  },
  { timestamps: true },
);

// Efficient radius search
bazarSchema.index({ location: '2dsphere' });
// Sparse unique: admin bazars have null placeId — sparse skips null in uniqueness check
bazarSchema.index({ placeId: 1 }, { unique: true, sparse: true });

// Keep GeoJSON location in sync with lat/lng on every save
bazarSchema.pre('save', function (next) {
  this.location = { type: 'Point', coordinates: [this.lng, this.lat] };
  next();
});

bazarSchema.plugin(paginate);

const Bazar = mongoose.model<BazarDocument, BazarModel>('Bazar', bazarSchema);

export default Bazar;
export { BazarDocument };
