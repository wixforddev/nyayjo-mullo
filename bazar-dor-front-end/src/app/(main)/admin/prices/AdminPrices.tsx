'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, Image, TrendingUp } from 'lucide-react';
import { useGetPricesQuery, useDeletePriceMutation } from '../../../../store/api/priceApi';

export function AdminPrices() {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage]                       = useState(1);
  const [filterVerified, setFilterVerified]   = useState<string>('all');
  const limit = 20;

  const queryParams: any = { limit, page };
  if (filterVerified === 'verified')   queryParams.isVerified = true;
  if (filterVerified === 'unverified') queryParams.isVerified = false;

  const { data: res, isLoading } = useGetPricesQuery(queryParams);
  const [deletePrice, { isLoading: deleting }] = useDeletePriceMutation();

  const prices: any[]  = res?.data?.attributes?.data || [];
  const totalPages     = Math.ceil((res?.data?.attributes?.totalResults || 0) / limit);
  const total          = res?.data?.attributes?.totalResults || 0;

  const handleDelete = async (id: string) => {
    await deletePrice(id).unwrap();
    setDeleteConfirmId(null);
  };

  const confidenceColor = (score: number) => {
    if (score >= 70) return 'text-emerald-700 bg-emerald-50';
    if (score >= 40) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="glass-card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#064E3B]">দামের তালিকা</h1>
          <p className="text-sm text-slate-500 mt-1">
            মোট <span className="font-num font-semibold">{total}</span> টি দাম এন্ট্রি
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'verified', 'unverified'] as const).map((v) => (
            <button key={v} onClick={() => { setFilterVerified(v); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterVerified === v
                  ? 'bg-[#064E3B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {v === 'all' ? 'সব' : v === 'verified' ? '✅ যাচাইকৃত' : '⚠️ অযাচাইকৃত'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : prices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-bold text-slate-600">কোনো এন্ট্রি নেই</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {prices.map((p: any) => (
              <div key={p._id} className="glass-card p-4 flex items-start gap-4">
                {/* Product icon */}
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <span className="text-xl">{p.productId?.icon || '🛒'}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 text-sm">
                      {p.productId?.nameBn || p.productId?.name || '—'}
                    </p>
                    {p.bazarId && (
                      <span className="text-xs text-slate-400">@ {p.bazarId?.nameBn || p.bazarId?.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-emerald-700 font-num">৳{p.price}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${confidenceColor(p.confidenceScore)}`}>
                      {p.confidenceScore}%
                    </span>
                    {p.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> যাচাইকৃত
                      </span>
                    )}
                    {p.isStockOut && (
                      <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                        স্টক আউট
                      </span>
                    )}
                    {p.photoUrl && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Image className="w-3 h-3" /> ছবি আছে
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-xs text-slate-400">
                      👤 {p.userId?.fullName || p.userId?.email || 'Anonymous'}
                    </span>
                    <span className="text-xs text-slate-400 font-num">
                      👍 {p.upvotes} / 👎 {p.downvotes}
                    </span>
                    <span className="text-xs text-slate-400 font-num">
                      {new Date(p.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button onClick={() => setDeleteConfirmId(p._id)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-red-100 text-red-500 transition-colors shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">এন্ট্রি মুছবেন?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">এই দামের এন্ট্রিটি স্থায়ীভাবে মুছে যাবে।</p>
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
