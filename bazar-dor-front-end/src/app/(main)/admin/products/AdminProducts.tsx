'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../../../../store/api/productApi';

const CATEGORIES = [
  { value: 'vegetable', label: '🥦 সবজি' },
  { value: 'fish',      label: '🐟 মাছ' },
  { value: 'meat',      label: '🥩 মাংস' },
  { value: 'dairy',     label: '🥛 দুগ্ধজাত' },
  { value: 'grain',     label: '🌾 শস্য' },
  { value: 'pulse',     label: '🫘 ডাল' },
  { value: 'oil',       label: '🫙 তেল' },
  { value: 'spice',     label: '🌶️ মসলা' },
  { value: 'fruit',     label: '🍎 ফল' },
  { value: 'bakery',    label: '🍞 বেকারি' },
  { value: 'protein',   label: '🥚 প্রোটিন' },
  { value: 'beverage',  label: '🥤 পানীয়' },
  { value: 'frozen',    label: '🧊 ফ্রোজেন' },
  { value: 'dry_food',  label: '🌰 শুকনো খাবার' },
  { value: 'other',     label: '🛒 অন্যান্য' },
];

const emptyForm = {
  name: '',
  nameBn: '',
  unit: 'kg',
  icon: '🛒',
  category: 'other',
  defaultPrice: 0,
  isActive: true,
};

export function AdminProducts() {
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [form, setForm]                     = useState({ ...emptyForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage]                     = useState(1);
  const limit = 15;

  const { data: res, isLoading } = useGetProductsQuery({ limit, page });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteProductMutation();

  const products: any[]  = res?.data?.attributes?.data || [];
  const totalPages: number = Math.ceil((res?.data?.attributes?.totalResults || 0) / limit);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name || '',
      nameBn: p.nameBn || '',
      unit: p.unit || 'kg',
      icon: p.icon || '🛒',
      category: p.category || 'other',
      defaultPrice: p.defaultPrice || 0,
      isActive: p.isActive ?? true,
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateProduct({ id: editingId, ...form }).unwrap();
    } else {
      await createProduct(form).unwrap();
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id).unwrap();
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#064E3B]">পণ্য ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-500 mt-1">পণ্য যোগ, সম্পাদনা ও মুছুন</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[#043d2e] transition-colors">
          <Plus className="w-4 h-4" /> নতুন পণ্য
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 flex flex-col gap-4 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#064E3B]">{editingId ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য'}</h2>
            <button onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">পণ্যের নাম (বাংলা)</label>
              <input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))}
                placeholder="যেমন: পেঁয়াজ"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Product Name (English)</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Onion"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">আইকন (Emoji)</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🛒"
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">একক (Unit)</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                <option value="kg">কেজি (kg)</option>
                <option value="g">গ্রাম (g)</option>
                <option value="piece">পিস</option>
                <option value="dozen">ডজন</option>
                <option value="liter">লিটার</option>
                <option value="ml">মিলি</option>
                <option value="packet">প্যাকেট</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">ক্যাটাগরি</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">ডিফল্ট দাম (৳)</label>
              <input type="number" value={form.defaultPrice} onChange={e => setForm(f => ({ ...f, defaultPrice: +e.target.value }))}
                min={0}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/30" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
              {form.isActive
                ? <ToggleRight className="w-8 h-8 text-emerald-600" />
                : <ToggleLeft  className="w-8 h-8 text-slate-400" />}
            </button>
            <span className="text-sm font-medium text-slate-600">
              {form.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            </span>
          </div>

          <button onClick={handleSubmit} disabled={creating || updating || !form.nameBn}
            className="flex items-center justify-center gap-2 bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#043d2e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Check className="w-4 h-4" />
            {creating || updating ? 'সংরক্ষণ হচ্ছে...' : editingId ? 'আপডেট করুন' : 'পণ্য তৈরি করুন'}
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">কোনো পণ্য নেই</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p: any) => (
              <div key={p._id} className="glass-card p-4 flex items-center gap-3">
                <span className="text-3xl">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{p.nameBn || p.name}</p>
                  <p className="text-xs text-slate-400">{p.unit} • {CATEGORIES.find(c => c.value === p.category)?.label?.replace(/.*\s/, '') || p.category}</p>
                  <p className="text-xs font-num font-semibold text-emerald-700 mt-0.5">৳{p.defaultPrice}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(p._id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium disabled:opacity-40 hover:bg-slate-200 transition-colors">
                ← আগে
              </button>
              <span className="text-sm text-slate-500 font-num">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium disabled:opacity-40 hover:bg-slate-200 transition-colors">
                পরে →
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-4xl text-center mb-3">🗑️</p>
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">পণ্য মুছবেন?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">এই পণ্যটি স্থায়ীভাবে মুছে যাবে।</p>
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
