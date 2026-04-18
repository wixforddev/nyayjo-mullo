import { useState } from 'react';
import { Search, Loader2, ShieldCheck, User } from 'lucide-react';
import { useGetUsersQuery, useUpdateUserRoleMutation } from '../store/api/userApi';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'user',   label: 'ইউজার',    color: 'bg-slate-100 text-slate-600' },
  { value: 'vendor', label: 'ভেন্ডর',   color: 'bg-blue-50 text-blue-600' },
  { value: 'admin',  label: 'অ্যাডমিন', color: 'bg-violet-50 text-violet-700' },
];

export function Users() {
  const [search, setSearch]       = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole]   = useState('user');

  const { data: res, isLoading } = useGetUsersQuery({ limit: 100 });
  const [updateUserRole, { isLoading: updating }] = useUpdateUserRoleMutation();

  // paginate plugin returns `results`
  const items: any[] = res?.data?.attributes?.results || [];
  const filtered = items.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (u: any) => { setEditingId(u._id); setEditRole(u.role || 'user'); };

  const handleRoleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateUserRole({ id: editingId, role: editRole }).unwrap();
      toast.success('রোল আপডেট হয়েছে');
      setEditingId(null);
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ব্যবহারকারী</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} জন ব্যবহারকারী</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..." className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ব্যবহারকারী</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">রোল</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">স্ট্যাটাস</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">যোগদান</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-slate-400">কোনো ব্যবহারকারী পাওয়া যায়নি</td></tr>
            ) : filtered.map((u: any) => {
              const roleInfo = ROLES.find(r => r.value === u.role) || ROLES[0];
              return (
                <tr key={u._id} className="table-row">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {u.image?.url && !u.image.url.includes('user.png')
                          ? <img src={u.image.url} alt="" className="w-9 h-9 object-cover" />
                          : <User className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{u.fullName || '—'}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {editingId === u._id ? (
                      <div className="flex items-center gap-2">
                        <select value={editRole} onChange={e => setEditRole(e.target.value)} className="select h-9 text-xs w-32">
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <button onClick={handleRoleUpdate} disabled={updating} className="btn-primary py-1.5 px-3 text-xs">
                          {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'সেভ'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary py-1.5 px-3 text-xs">বাতিল</button>
                      </div>
                    ) : (
                      <button onClick={() => openEdit(u)} className={`badge cursor-pointer hover:opacity-80 transition-opacity ${roleInfo.color}`}>
                        {roleInfo.label}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {u.isEmailVerified
                        ? <span className="badge bg-emerald-50 text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />যাচাইকৃত</span>
                        : <span className="badge bg-amber-50 text-amber-700">অযাচাইকৃত</span>}
                      {u.isDeleted && <span className="badge bg-red-50 text-red-600">মুছে ফেলা</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('bn-BD') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
