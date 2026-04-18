import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, Bell } from 'lucide-react';
import {
  useGetAlertsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
} from '../store/api/alertApi';
import { useGetProductsQuery } from '../store/api/productApi';
import { useGetBazarsQuery } from '../store/api/bazarApi';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

const empty = { type: 'general', severity: 'medium', message: '', messageBn: '', productId: '', bazarId: '' };

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-blue-100 text-blue-700',
};
const typeIcon: Record<string, string> = {
  price_spike: '📈', stock_out: '🚫', market_closed: '🔒', general: '📢',
};

export function Alerts() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm]         = useState({ ...empty });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: alertsRes, isLoading }  = useGetAlertsQuery({ limit: 100 });
  const { data: productsRes }           = useGetProductsQuery({ limit: 200 });
  const { data: bazarsRes }             = useGetBazarsQuery({ limit: 100 });

  const [createAlert, { isLoading: creating }] = useCreateAlertMutation();
  const [updateAlert, { isLoading: updating }] = useUpdateAlertMutation();
  const [deleteAlert, { isLoading: deleting }] = useDeleteAlertMutation();

  const items: any[]    = alertsRes?.data?.attributes?.data    || [];
  const products: any[] = productsRes?.data?.attributes?.data  || [];
  const bazars: any[]   = bazarsRes?.data?.attributes?.data    || [];

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm({ ...empty }); };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ type: item.type, severity: item.severity, message: item.message || '', messageBn: item.messageBn || '', productId: item.productId?._id || '', bazarId: item.bazarId?._id || '' });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const body: any = { type: form.type, severity: form.severity, message: form.message, messageBn: form.messageBn };
    if (form.productId) body.productId = form.productId;
    if (form.bazarId)   body.bazarId   = form.bazarId;
    try {
      if (editItem) {
        await updateAlert({ id: editItem._id, ...body }).unwrap();
        toast.success('আপডেট হয়েছে');
      } else {
        await createAlert(body).unwrap();
        toast.success('এলার্ট তৈরি হয়েছে');
      }
      closeForm();
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAlert(deleteId).unwrap();
      toast.success('মুছে গেছে');
      setDeleteId(null);
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">এলার্ট</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} টি সক্রিয় এলার্ট</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> নতুন এলার্ট
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">কোনো সক্রিয় এলার্ট নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item._id} className="card p-5 flex items-start gap-4">
              <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                {typeIcon[item.type] || '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`badge ${severityColor[item.severity] || 'bg-slate-100 text-slate-600'}`}>{item.severity}</span>
                  <span className="badge bg-slate-100 text-slate-600">{item.type}</span>
                </div>
                <p className="font-semibold text-slate-800 text-sm leading-snug">{item.messageBn || item.message}</p>
                {item.messageBn && item.message && <p className="text-xs text-slate-400 mt-0.5">{item.message}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {item.productId && <span>📦 {item.productId.nameBn || item.productId.name}</span>}
                  {item.bazarId   && <span>🏪 {item.bazarId.nameBn   || item.bazarId.name}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(item._id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? 'এলার্ট সম্পাদনা' : 'নতুন এলার্ট'} onClose={closeForm}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ধরন</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="select">
                  <option value="general">📢 সাধারণ</option>
                  <option value="price_spike">📈 মূল্য বৃদ্ধি</option>
                  <option value="stock_out">🚫 স্টক আউট</option>
                  <option value="market_closed">🔒 বাজার বন্ধ</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">গুরুত্ব</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="select">
                  <option value="low">কম</option>
                  <option value="medium">মাঝারি</option>
                  <option value="high">উচ্চ</option>
                  <option value="critical">ক্রিটিকাল</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">বাংলা বার্তা</label>
              <textarea value={form.messageBn} onChange={e => setForm(f => ({ ...f, messageBn: e.target.value }))}
                placeholder="বাংলায় বার্তা লিখুন..." rows={3} className="input h-auto py-2.5 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">English Message</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write message in English..." rows={2} className="input h-auto py-2.5 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">পণ্য (ঐচ্ছিক)</label>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} className="select">
                  <option value="">-- কোনো পণ্য নয় --</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">বাজার (ঐচ্ছিক)</label>
                <select value={form.bazarId} onChange={e => setForm(f => ({ ...f, bazarId: e.target.value }))} className="select">
                  <option value="">-- কোনো বাজার নয় --</option>
                  {bazars.map(b => <option key={b._id} value={b._id}>{b.nameBn || b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeForm} className="btn-secondary flex-1 justify-center">বাতিল</button>
              <button onClick={handleSubmit} disabled={creating || updating || (!form.messageBn && !form.message)} className="btn-primary flex-1 justify-center">
                {(creating || updating) ? <Loader2 className="w-4 h-4 animate-spin" /> : editItem ? 'আপডেট' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog message="এই এলার্টটি স্থায়ীভাবে মুছে যাবে।" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
    </div>
  );
}
