import Price from '../models/price.model';
import DailySnapshot from '../models/dailySnapshot.model';

const ESSENTIALS = [
  { key: 'chicken', regex: /মুরগি|chicken/i },
  { key: 'beef',    regex: /গরু|beef/i },
  { key: 'oil',     regex: /তেল|oil/i },
  { key: 'potato',  regex: /আলু|potato/i },
  { key: 'onion',   regex: /পেঁয়াজ|onion/i },
] as const;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export async function buildSnapshot(date: Date): Promise<void> {
  const dateStr = toDateStr(date);
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay   = new Date(dateStr + 'T23:59:59.999Z');

  const prices = await Price.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    isStockOut: false,
  }).populate('productId', 'name nameBn');

  const result: Record<string, { sum: number; count: number }> = {
    chicken: { sum: 0, count: 0 },
    beef:    { sum: 0, count: 0 },
    oil:     { sum: 0, count: 0 },
    potato:  { sum: 0, count: 0 },
    onion:   { sum: 0, count: 0 },
  };

  for (const p of prices) {
    const product = p.productId as any;
    const name = product?.nameBn || product?.name || '';
    for (const e of ESSENTIALS) {
      if (e.regex.test(name)) {
        result[e.key].sum   += p.price;
        result[e.key].count += 1;
        break;
      }
    }
  }

  const snapData: Record<string, any> = { date: dateStr };
  let basketTotal = 0;
  for (const e of ESSENTIALS) {
    const { sum, count } = result[e.key];
    const avg = count > 0 ? Math.round(sum / count) : null;
    snapData[e.key] = { avg, count };
    if (avg) basketTotal += avg;
  }
  snapData.basketTotal = basketTotal;

  await DailySnapshot.findOneAndUpdate(
    { date: dateStr },
    snapData,
    { upsert: true, new: true },
  );
}

export async function getSnapshots(startDate?: string, endDate?: string) {
  const filter: any = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate)   filter.date.$lte = endDate;
  }
  return DailySnapshot.find(filter).sort({ date: 1 });
}

export async function getSnapshotByDate(date: string) {
  return DailySnapshot.findOne({ date });
}

export async function triggerTodaySnapshot() {
  await buildSnapshot(new Date());
}
