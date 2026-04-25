import { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useGetSnapshotsQuery, useTriggerSnapshotMutation } from '../store/api/snapshotApi';

const MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const PRODUCTS = [
  { key: 'chicken', label: 'মুরগি',       color: '#f59e0b' },
  { key: 'beef',    label: 'গরুর মাংস',   color: '#ef4444' },
  { key: 'oil',     label: 'তেল',          color: '#8b5cf6' },
  { key: 'potato',  label: 'আলু',          color: '#10b981' },
  { key: 'onion',   label: 'পেঁয়াজ',     color: '#3b82f6' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function groupByMonth(snapshots: any[], year: number) {
  const months: Record<number, any[]> = {};
  for (let m = 1; m <= 12; m++) months[m] = [];

  for (const s of snapshots) {
    const [y, m] = s.date.split('-').map(Number);
    if (y === year && months[m]) months[m].push(s);
  }

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const rows = months[m];
    const avg = (key: string) => {
      const vals = rows.map((r: any) => r[key]?.avg).filter((v: any) => v != null);
      return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : null;
    };
    const basket = rows.length
      ? Math.round(rows.reduce((s: number, r: any) => s + (r.basketTotal || 0), 0) / rows.length)
      : null;
    return {
      month: MONTHS[i],
      monthNum: m,
      basket,
      chicken: avg('chicken'),
      beef:    avg('beef'),
      oil:     avg('oil'),
      potato:  avg('potato'),
      onion:   avg('onion'),
      days:    rows.length,
    };
  });
}

export function MarketIndex() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set(['basket']));

  const startDate = `${selectedYear}-01-01`;
  const endDate   = `${selectedYear}-12-31`;

  const { data, isLoading, refetch } = useGetSnapshotsQuery({ startDate, endDate });
  const [triggerSnapshot, { isLoading: triggering }] = useTriggerSnapshotMutation();

  const snapshots: any[] = Array.isArray(data?.data) ? data.data : [];
  const monthlyData = groupByMonth(snapshots, selectedYear);

  const handleTrigger = async () => {
    try {
      await triggerSnapshot().unwrap();
      toast.success('আজকের স্ন্যাপশট সংরক্ষিত হয়েছে');
      refetch();
    } catch {
      toast.error('স্ন্যাপশট সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const toggleLine = (key: string) => {
    setVisibleLines(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Summary row: full year stats
  const totalDays = snapshots.length;
  const yearAvgBasket = totalDays
    ? Math.round(snapshots.reduce((s: number, r: any) => s + (r.basketTotal || 0), 0) / totalDays)
    : null;

  const trend = (key: string) => {
    const vals = monthlyData.filter(m => m[key] != null);
    if (vals.length < 2) return 0;
    return (vals[vals.length - 1][key] || 0) - (vals[0][key] || 0);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">বাজার সূচক</h1>
          <p className="text-slate-500 text-sm mt-1">দৈনিক স্ন্যাপশট থেকে মাসিক গড় বিশ্লেষণ</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300/40 text-sm">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#043d2e] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
            আজকের ডেটা সংরক্ষণ
          </button>
        </div>
      </div>

      {/* Year summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400 font-medium mb-1">মোট দিন</p>
          <p className="text-2xl font-black text-slate-800">{isLoading ? '—' : totalDays}</p>
          <p className="text-xs text-emerald-600 mt-1">{selectedYear} সালে</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 font-medium mb-1">বার্ষিক গড় ঝুড়ি</p>
          <p className="text-2xl font-black text-slate-800">{yearAvgBasket ? `৳${yearAvgBasket}` : '—'}</p>
        </div>
        {PRODUCTS.map(p => {
          const t = trend(p.key);
          return (
            <div key={p.key} className="card p-4">
              <p className="text-xs text-slate-400 font-medium mb-1">{p.label}</p>
              <p className="text-xl font-black text-slate-800">
                {monthlyData.find(m => m[p.key] != null)?.[p.key] != null
                  ? `৳${monthlyData.filter(m => m[p.key] != null).slice(-1)[0]?.[p.key]}`
                  : '—'}
              </p>
              {t !== 0 && (
                <p className={`text-xs font-bold flex items-center gap-0.5 mt-1 ${t > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {t > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {t > 0 ? '+' : ''}{t} টাকা
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Line Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-bold text-slate-700">মাসিক গড় দাম ({selectedYear})</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleLine('basket')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${visibleLines.has('basket') ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}>
              ঝুড়ি মোট
            </button>
            {PRODUCTS.map(p => (
              <button key={p.key}
                onClick={() => toggleLine(p.key)}
                style={visibleLines.has(p.key) ? { background: p.color, borderColor: p.color, color: 'white' } : {}}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${!visibleLines.has(p.key) ? 'bg-white text-slate-400 border-slate-200' : ''}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">লোড হচ্ছে...</div>
        ) : totalDays === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Minus className="w-8 h-8" />
            <p className="text-sm">{selectedYear} সালের কোনো ডেটা নেই</p>
            <p className="text-xs">প্রতিদিন রাতে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(val: any, name: any) => [`৳${val}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
              {visibleLines.has('basket') && (
                <Line type="monotone" dataKey="basket" name="ঝুড়ি মোট" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              )}
              {PRODUCTS.map(p => visibleLines.has(p.key) && (
                <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={p.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly table */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-700 mb-4">মাসিক বিস্তারিত ({selectedYear})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs text-slate-400 font-semibold py-2 pr-4">মাস</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">মুরগি</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">গরু</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">তেল</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">আলু</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">পেঁয়াজ</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 px-3">ঝুড়ি</th>
                <th className="text-right text-xs text-slate-400 font-semibold py-2 pl-3">দিন</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m, i) => (
                <tr key={i} className={`border-b border-slate-50 ${m.days === 0 ? 'opacity-40' : ''}`}>
                  <td className="py-2.5 pr-4 font-semibold text-slate-700">{m.month}</td>
                  {(['chicken', 'beef', 'oil', 'potato', 'onion'] as const).map(k => (
                    <td key={k} className="py-2.5 px-3 text-right text-slate-600">
                      {m[k] != null ? `৳${m[k]}` : '—'}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-bold text-[#064E3B]">
                    {m.basket != null ? `৳${m.basket}` : '—'}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-slate-400">{m.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
