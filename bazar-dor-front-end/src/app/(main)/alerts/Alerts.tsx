'use client';

import { useState } from 'react';
import { Bell, AlertTriangle, Info, Package, Store, Clock } from 'lucide-react';
import { useGetAlertsQuery } from '../../../store/api/alertApi';
import { useSocket } from '../../../hooks/useSocket';
import { baseApi } from '../../../store/baseApi';
import { useDispatch } from 'react-redux';

const severityConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'ক্রিটিকাল', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  high:     { label: 'উচ্চ',      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  medium:   { label: 'মাঝারি',    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  low:      { label: 'কম',        color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const typeConfig: Record<string, { label: string; icon: string }> = {
  price_spike:   { label: 'মূল্য বৃদ্ধি', icon: '📈' },
  stock_out:     { label: 'স্টক আউট',    icon: '🚫' },
  market_closed: { label: 'বাজার বন্ধ',  icon: '🔒' },
  general:       { label: 'সাধারণ',      icon: '📢' },
};

export function Alerts() {
  const [filter, setFilter] = useState<string>('all');
  const dispatch = useDispatch();

  const { data: res, isLoading, refetch } = useGetAlertsQuery(
    filter === 'all' ? { limit: 50 } : { limit: 50, type: filter }
  );

  const alerts: any[] = res?.data?.attributes?.data || [];

  // Real-time: refetch when new alert arrives
  useSocket('alert:new', () => {
    dispatch(baseApi.util.invalidateTags(['Alert']));
  });

  const filters = [
    { key: 'all', label: 'সব' },
    { key: 'price_spike', label: '📈 মূল্য' },
    { key: 'stock_out', label: '🚫 স্টক' },
    { key: 'market_closed', label: '🔒 বাজার' },
    { key: 'general', label: '📢 সাধারণ' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 text-center">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Bell className="w-7 h-7 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#064E3B] mb-1">এলার্ট</h1>
        <p className="text-sm text-slate-500">বাজারের সর্বশেষ সতর্কতা ও আপডেট</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-[#064E3B] text-white shadow-sm'
                : 'bg-white/60 text-slate-500 border border-slate-200 hover:border-slate-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-bold text-slate-600">কোনো সক্রিয় এলার্ট নেই</p>
          <p className="text-sm text-slate-400 mt-1">বাজার স্বাভাবিক আছে</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert: any) => {
            const sev = severityConfig[alert.severity] || severityConfig.medium;
            const typ = typeConfig[alert.type] || typeConfig.general;
            return (
              <div key={alert._id}
                className={`rounded-2xl p-4 border ${sev.bg} ${sev.border} flex items-start gap-3`}>
                <span className="text-2xl shrink-0 mt-0.5">{typ.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 ${sev.color}`}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-slate-500">{typ.label}</span>
                    {alert.productId && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Package className="w-3 h-3" /> {alert.productId.nameBn || alert.productId.name}
                      </span>
                    )}
                    {alert.bazarId && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Store className="w-3 h-3" /> {alert.bazarId.nameBn || alert.bazarId.name}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-bold leading-snug ${sev.color}`}>{alert.messageBn || alert.message}</p>
                  {alert.messageBn && alert.message && (
                    <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
