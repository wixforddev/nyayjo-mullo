'use client';

import { useState } from 'react';
import { ShieldCheck, User, Edit2, X, Check } from 'lucide-react';
import { useGetUsersQuery, useUpdateProfileMutation } from '../../../../store/api/userApi';

const ROLES = [
  { value: 'user',   label: '👤 ইউজার' },
  { value: 'vendor', label: '🏪 ভেন্ডর' },
  { value: 'admin',  label: '🛡️ অ্যাডমিন' },
];

const roleStyle: Record<string, string> = {
  admin:  'bg-violet-50 text-violet-700',
  vendor: 'bg-blue-50 text-blue-700',
  user:   'bg-slate-100 text-slate-600',
};

export function AdminUsers() {
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editRole, setEditRole]     = useState<string>('user');
  const [page, setPage]             = useState(1);
  const limit = 20;

  const { data: res, isLoading } = useGetUsersQuery({ limit, page });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

  // userService uses the paginate plugin which returns `results` (not `data`)
  const users: any[]  = res?.data?.attributes?.results || [];
  const totalPages    = res?.data?.attributes?.totalPages || 1;
  const total         = res?.data?.attributes?.totalResults || 0;

  const openEdit = (u: any) => {
    setEditingId(u._id);
    setEditRole(u.role || 'user');
  };

  const handleRoleUpdate = async () => {
    if (!editingId) return;
    await updateProfile({ id: editingId, role: editRole }).unwrap();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-[#064E3B]">ইউজার ম্যানেজমেন্ট</h1>
        <p className="text-sm text-slate-500 mt-1">
          মোট <span className="font-num font-semibold">{total}</span> জন ইউজার
        </p>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">কোনো ইউজার নেই</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {users.map((u: any) => (
              <div key={u._id} className="glass-card p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {u.image?.url ? (
                    <img src={u.image.url} alt="" className="w-10 h-10 object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {u.fullName || 'নাম নেই'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleStyle[u.role] || roleStyle.user}`}>
                      {ROLES.find(r => r.value === u.role)?.label || u.role}
                    </span>
                    {u.isEmailVerified && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700">
                        <ShieldCheck className="w-3 h-3" /> যাচাইকৃত
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit role */}
                {editingId === u._id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}
                      className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300/30">
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button onClick={handleRoleUpdate} disabled={updating}
                      className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openEdit(u)}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
    </div>
  );
}
