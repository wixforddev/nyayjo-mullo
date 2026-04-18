'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import {
  useGetAlertsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
} from '../../../../store/api/alertApi';
import { useGetProductsQuery } from '../../../../store/api/productApi';
import { useGetBazarsQuery } from '../../../../store/api/bazarApi';

const emptyForm = {
  type: 'general',
  severity: 'medium',
  message: '',
  messageBn: '',
  productId: '',
  bazarId: '',
};

export function AdminAlerts() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: res, isLoading } = useGetAlertsQuery({ limit: 50 });
  const { data: productsRes } = useGetProductsQuery({ limit: 100 });
  const { data: bazarsRes } = useGetBazarsQuery({ limit: 50 });

  const [createAlert, { isLoading: creating }] = useCreateAlertMutation();
  const [updateAlert, { isLoading: updating }] = useUpdateAlertMutation();
  const [deleteAlert, { isLoading: deleting }] = useDeleteAlertMutation();

  const alerts: any[] = res?.data?.attributes?.data || [];
  const products: any[] = productsRes?.data?.attributes?.data || [];
  const bazars: any[] = bazarsRes?.data?.attributes?.data || [];

  const handleSubmit = async () => {
    const payload: any = {
      type: form.type,
      severity: form.severity,
      message: form.message,
      messageBn: form.messageBn,
    };
    if (form.productId) payload.productId = form.productId;
    if (form.bazarId) payload.bazarId = form.bazarId;

    if (editingId) {
      await updateAlert({ id: editingId, ...payload }).unwrap();
    } else {
      await createAlert(payload).unwrap();
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleEdit = (alert: any) => {
    setForm({
      type: alert.type || 'general',
      severity: alert.severity || 'medium',
      message: alert.message || '',
      messageBn: alert.messageBn || '',
      productId: alert.productId?._id || '',
      bazarId: alert.bazarId?._id || '',
    });
    setEditingId(alert._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteAlert(id).unwrap();
    setDeleteConfirmId(null);
  };

  const severityColor: Record<string, string> = {
    critical: 'text-red-700 bg-red-50 border-red-200',
    high: 'text-orange-700 bg-orange-50 border-orange-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-blue-700 bg-blue-50 border-blue-200',
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#064E3B]">এলার্ট ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-500 mt-1">এলার্ট তৈরি, সম্পাদনা ও মুছুন</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
          className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[#043d2e] transition-colors">
          <Plus className="w-4 h-4" /> নতুন এলার্ট
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 flex flex-col gap-4 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#064E3B]">{editingId ? 'এলার্ট সম্পাদনা' : 'নতুন এলার্ট'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">ধরন</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                <option value="general">📢 সাধারণ</option>
                <option value="price_spike">📈 মূল্য বৃদ্ধি</option>
                <option value="stock_out">🚫 স্টক আউট</option>
                <option value="market_closed">🔒 বাজার বন্ধ</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">গুরুত্ব</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                <option value="low">কম</option>
                <option value="medium">মাঝারি</option>
                <option value="high">উচ্চ</option>
                <option value="critical">ক্রিটিকাল</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">বাংলা বার্তা</label>
              <input value={form.messageBn} onChange={e => setForm(f => ({ ...f, messageBn: e.target.value }))}
                placeholder="বাংলায় বার্তা লিখুন..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">English Message</label>
              <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write message in English..."
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">পণ্য (ঐচ্ছিক)</label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                <option value="">-- কোনো পণ্য নয় --</option>
                {products.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">বাজার (ঐচ্ছিক)</label>
              <select value={form.bazarId} onChange={e => setForm(f => ({ ...f, bazarId: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                <option value="">-- কোনো বাজার নয় --</option>
                {bazars.map((b: any) => (
                  <option key={b._id} value={b._id}>{b.nameBn || b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={creating || updating || (!form.messageBn && !form.message)}
            className="flex items-center justify-center gap-2 bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#043d2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Check className="w-4 h-4" />
            {creating || updating ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'এলার্ট তৈরি করুন'}
          </button>
        </div>
      )}

      {/* Alerts list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">কোনো এলার্ট নেই</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert: any) => (
            <div key={alert._id}
              className={`rounded-2xl p-4 border flex items-start gap-3 ${severityColor[alert.severity] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold uppercase">{alert.type}</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs font-medium">{alert.severity}</span>
                  {alert.productId && <span className="text-xs">• {alert.productId.nameBn}</span>}
                  {alert.bazarId && <span className="text-xs">• {alert.bazarId.nameBn}</span>}
                </div>
                <p className="text-sm font-bold">{alert.messageBn || alert.message}</p>
                {alert.messageBn && alert.message && (
                  <p className="text-xs opacity-70 mt-0.5">{alert.message}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(alert)}
                  className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center hover:bg-white transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirmId(alert._id)}
                  className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-4xl text-center mb-3">🗑️</p>
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">এলার্ট মুছবেন?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">এই এলার্টটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                বাতিল
              </button>
              <button onClick={() => handleDelete(deleteConfirmId)} disabled={deleting}
                className="flex-1 py-3 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? '...' : 'মুছুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
