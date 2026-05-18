'use client';

import { Bell } from 'lucide-react';
import { useGetAlertsQuery } from '../../../store/api/alertApi';
import { useSocket } from '../../../hooks/useSocket';
import { baseApi } from '../../../store/baseApi';
import { useDispatch } from 'react-redux';

const TYPE_ICON: Record<string, string> = {
  price_spike:   '📈',
  stock_out:     '🚫',
  market_closed: '🔒',
  general:       '📢',
};

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-400',
  medium:   'bg-amber-400',
  low:      'bg-blue-400',
};

function timeAgo(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1)   return 'এইমাত্র';
  if (mins < 60)  return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} ঘণ্টা আগে`;
  return `${Math.floor(hrs / 24)} দিন আগে`;
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export function Alerts() {
  const dispatch = useDispatch();

  const { data: res, isLoading } = useGetAlertsQuery({ limit: 50 });
  const alerts: any[] = res?.data?.attributes?.data || [];

  useSocket('alert:new', () => {
    dispatch(baseApi.util.invalidateTags(['Alert']));
  });

  const todayAlerts   = alerts.filter(a => isToday(a.createdAt));
  const earlierAlerts = alerts.filter(a => !isToday(a.createdAt));

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-1">

      {/* Header */}
      <div className="flex items-center gap-3 py-4 px-1 mb-2">
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">নোটিফিকেশন</h1>
          {alerts.length > 0 && (
            <p className="text-xs text-slate-400">{alerts.length}টি আপডেট</p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2 px-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && alerts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-500">কোনো নোটিফিকেশন নেই</p>
          <p className="text-sm text-slate-400 mt-1">বাজার স্বাভাবিক আছে</p>
        </div>
      )}

      {/* Today */}
      {todayAlerts.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pb-2">আজকে</p>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {todayAlerts.map(alert => (
              <NotifItem key={alert._id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Earlier */}
      {earlierAlerts.length > 0 && (
        <div className="pt-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 pb-2">আগের</p>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
            {earlierAlerts.map(alert => (
              <NotifItem key={alert._id} alert={alert} muted />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ alert, muted = false }: { alert: any; muted?: boolean }) {
  const icon   = TYPE_ICON[alert.type] || '📢';
  const dotCls = SEV_DOT[alert.severity] || SEV_DOT.medium;
  const bazar  = alert.bazarId?.nameBn   || alert.bazarId?.name   || null;
  const product = alert.productId?.nameBn || alert.productId?.name || null;

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/60 ${muted ? 'opacity-70' : ''}`}>
      {/* Icon circle */}
      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-lg shrink-0 border border-slate-100 relative mt-0.5">
        {icon}
        {/* Severity dot */}
        <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${dotCls}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${muted ? 'text-slate-500' : 'text-slate-800'}`}>
          {alert.messageBn || alert.message}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {bazar && (
            <span className="text-[11px] text-slate-400 font-medium">🏪 {bazar}</span>
          )}
          {product && (
            <span className="text-[11px] text-slate-400 font-medium">📦 {product}</span>
          )}
          <span className="text-[11px] text-slate-400">{timeAgo(alert.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
