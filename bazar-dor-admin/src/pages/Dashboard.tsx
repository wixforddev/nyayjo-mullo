import { Link } from 'react-router-dom';
import { Package, Store, Tag, Bell, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useGetProductsQuery } from '../store/api/productApi';
import { useGetBazarsQuery } from '../store/api/bazarApi';
import { useGetPricesQuery } from '../store/api/priceApi';
import { useGetAlertsQuery } from '../store/api/alertApi';
import { useGetUsersQuery } from '../store/api/userApi';

const priceChartData = [
  { date: '১০ এপ্রিল', avg: 45 }, { date: '১১ এপ্রিল', avg: 48 }, { date: '১২ এপ্রিল', avg: 43 },
  { date: '১৩ এপ্রিল', avg: 52 }, { date: '১৪ এপ্রিল', avg: 49 }, { date: '১৫ এপ্রিল', avg: 55 },
  { date: '১৬ এপ্রিল', avg: 51 },
];

export function Dashboard() {
  const { data: productsRes } = useGetProductsQuery({ limit: 1 });
  const { data: bazarsRes }   = useGetBazarsQuery({ limit: 1 });
  const { data: pricesRes }   = useGetPricesQuery({ limit: 1 });
  const { data: alertsRes }   = useGetAlertsQuery({ limit: 1 });
  const { data: usersRes }    = useGetUsersQuery({ limit: 1 });

  const stats = [
    { label: 'মোট পণ্য',       value: productsRes?.data?.attributes?.totalResults ?? '—', icon: Package, color: 'bg-blue-50 text-blue-600',    link: '/products' },
    { label: 'মোট বাজার',      value: bazarsRes?.data?.attributes?.totalResults   ?? '—', icon: Store,   color: 'bg-purple-50 text-purple-600', link: '/bazars' },
    { label: 'দাম এন্ট্রি',    value: pricesRes?.data?.attributes?.totalResults   ?? '—', icon: Tag,     color: 'bg-emerald-50 text-emerald-600',link: '/prices' },
    { label: 'সক্রিয় এলার্ট', value: alertsRes?.data?.attributes?.totalResults   ?? '—', icon: Bell,    color: 'bg-rose-50 text-rose-600',     link: '/alerts' },
    { label: 'ব্যবহারকারী',    value: usersRes?.data?.attributes?.totalResults    ?? '—', icon: Users,   color: 'bg-amber-50 text-amber-600',   link: '/users' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ড্যাশবোর্ড</h1>
        <p className="text-slate-500 text-sm mt-1">বাজার দর অ্যাডমিন প্যানেলে স্বাগতম</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-black text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-700">গত ৭ দিনের গড় দাম</h3>
            <span className="badge bg-emerald-50 text-emerald-700">লাইভ</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={priceChartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="avg" stroke="#064E3B" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#064E3B' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-700">দৈনিক দাম সাবমিশন</h3>
            <span className="badge bg-blue-50 text-blue-700">এই সপ্তাহ</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priceChartData}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="avg" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-700 mb-4">দ্রুত অ্যাকশন</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'নতুন পণ্য',     icon: Package, to: '/products', color: 'bg-blue-50 text-blue-600' },
            { label: 'নতুন বাজার',    icon: Store,   to: '/bazars',   color: 'bg-purple-50 text-purple-600' },
            { label: 'এলার্ট দিন',    icon: Bell,    to: '/alerts',   color: 'bg-rose-50 text-rose-600' },
            { label: 'ব্যবহারকারী',   icon: Users,   to: '/users',    color: 'bg-amber-50 text-amber-600' },
          ].map(q => (
            <Link key={q.to} to={q.to}
              className={`flex items-center gap-3 p-4 rounded-xl ${q.color} hover:opacity-80 transition-opacity`}>
              <q.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
