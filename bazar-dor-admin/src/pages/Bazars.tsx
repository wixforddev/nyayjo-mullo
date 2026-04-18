import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, MapPin } from 'lucide-react';
import {
  useGetBazarsQuery,
  useCreateBazarMutation,
  useUpdateBazarMutation,
  useDeleteBazarMutation,
} from '../store/api/bazarApi';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LocationPicker } from '../components/LocationPicker';
import toast from 'react-hot-toast';

const empty = { name: '', nameBn: '', area: '', city: 'Dhaka', lat: '', lng: '' };

export function Bazars() {
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm]         = useState({ ...empty });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: res, isLoading } = useGetBazarsQuery({ limit: 100 });
  const [createBazar, { isLoading: creating }] = useCreateBazarMutation();
  const [updateBazar, { isLoading: updating }] = useUpdateBazarMutation();
  const [deleteBazar, { isLoading: deleting }] = useDeleteBazarMutation();

  const items: any[] = res?.data?.attributes?.data || [];
  const filtered = items.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) || b.nameBn?.includes(search)
  );

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm({ ...empty }); };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name || '', nameBn: item.nameBn || '', area: item.area || '', city: item.city || 'Dhaka', lat: item.lat ?? '', lng: item.lng ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const body: any = { name: form.name, nameBn: form.nameBn, area: form.area, city: form.city };
    if (form.lat) body.lat = Number(form.lat);
    if (form.lng) body.lng = Number(form.lng);
    try {
      if (editItem) {
        await updateBazar({ id: editItem._id, ...body }).unwrap();
        toast.success('আপডেট হয়েছে');
      } else {
        await createBazar(body).unwrap();
        toast.success('বাজার তৈরি হয়েছে');
      }
      closeForm();
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBazar(deleteId).unwrap();
      toast.success('মুছে গেছে');
      setDeleteId(null);
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  const f = (key: keyof typeof empty, label: string, type = 'text', ph = '') => (
    <div key={key}>
      <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={ph} className="input" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">বাজার</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} টি বাজার</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> নতুন বাজার
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="বাজার খুঁজুন..." className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">বাজার</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">এলাকা</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">শহর</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">লোকেশন</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">স্ট্যাটাস</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">কোনো বাজার পাওয়া যায়নি</td></tr>
            ) : filtered.map(item => (
              <tr key={item._id} className="table-row">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.nameBn || item.name}</p>
                      <p className="text-xs text-slate-400">{item.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{item.area || '—'}</td>
                <td className="px-5 py-3.5 text-slate-600">{item.city || '—'}</td>
                <td className="px-5 py-3.5">
                  {item.lat ? (
                    <span className="badge bg-emerald-50 text-emerald-700">{Number(item.lat).toFixed(3)}, {Number(item.lng).toFixed(3)}</span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {item.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(item._id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editItem ? 'বাজার সম্পাদনা' : 'নতুন বাজার'} onClose={closeForm}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {f('nameBn', 'নাম (বাংলা)', 'text', 'যেমন: কারওয়ান বাজার')}
              {f('name',   'Name (English)', 'text', 'e.g. Karwan Bazar')}
              {f('area',   'এলাকা', 'text', 'যেমন: তেজগাঁও')}
              {f('city',   'শহর',   'text', 'Dhaka')}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">লোকেশন (Lat, Lng)</label>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => setForm(prev => ({ ...prev, lat, lng }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {f('lat', 'Latitude',  'number', '23.7749')}
              {f('lng', 'Longitude', 'number', '90.3895')}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeForm} className="btn-secondary flex-1 justify-center">বাতিল</button>
              <button onClick={handleSubmit} disabled={creating || updating || !form.nameBn} className="btn-primary flex-1 justify-center">
                {(creating || updating) ? <Loader2 className="w-4 h-4 animate-spin" /> : editItem ? 'আপডেট' : 'তৈরি করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog message="এই বাজারটি স্থায়ীভাবে মুছে যাবে।" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
    </div>
  );
}
