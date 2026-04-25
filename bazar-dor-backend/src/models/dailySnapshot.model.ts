import mongoose from 'mongoose';

interface ProductSnapshot {
  avg: number | null;
  count: number;
}

interface DailySnapshotDocument extends mongoose.Document {
  date: string; // "YYYY-MM-DD"
  chicken: ProductSnapshot;
  beef: ProductSnapshot;
  oil: ProductSnapshot;
  potato: ProductSnapshot;
  onion: ProductSnapshot;
  basketTotal: number;
}

const productSnapshotSchema = new mongoose.Schema<ProductSnapshot>(
  {
    avg:   { type: Number, default: null },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const dailySnapshotSchema = new mongoose.Schema<DailySnapshotDocument>(
  {
    date:        { type: String, required: true, unique: true, index: true },
    chicken:     { type: productSnapshotSchema, default: () => ({ avg: null, count: 0 }) },
    beef:        { type: productSnapshotSchema, default: () => ({ avg: null, count: 0 }) },
    oil:         { type: productSnapshotSchema, default: () => ({ avg: null, count: 0 }) },
    potato:      { type: productSnapshotSchema, default: () => ({ avg: null, count: 0 }) },
    onion:       { type: productSnapshotSchema, default: () => ({ avg: null, count: 0 }) },
    basketTotal: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const DailySnapshot = mongoose.model<DailySnapshotDocument>('DailySnapshot', dailySnapshotSchema);

export default DailySnapshot;
export { DailySnapshotDocument };
