import { useState } from 'react';
import { Trash2, Search, Loader2, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { useGetPricesQuery, useDeletePriceMutation } from '../store/api/priceApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import toast from 'react-hot-toast';

export function Prices() {
  const [search, setSearch]     = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<'all' | 'verified' | 'unverified'>('all');

  const params: any = { limit: 100 };
  if (filter === 'verified')   params.isVerified = true;
  if (filter === 'unverified') params.isVerified = false;

  const { data: res, isLoading } = useGetPricesQuery(params);
  const [deletePrice, { isLoading: deleting }] = useDeletePriceMutation();

  const items: any[] = res?.data?.attributes?.data || [];
  const total = res?.data?.attributes?.totalResults || 0;
  const filtered = items.filter(p =>
    p.productId?.nameBn?.includes(search) ||
    p.productId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.bazarId?.nameBn?.includes(search)
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePrice(deleteId).unwrap();
      toast.success('মুছে গেছে');
      setDeleteId(null);
    } catch { toast.error('সমস্যা হয়েছে'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">দাম</h1>
          <p className="text-slate-500 text-sm mt-1">মোট {total} টি রেকর্ড</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'verified', 'unverified'] as const).map(v => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === v ? 'bg-[#064E3B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {v === 'all' ? 'সব' : v === 'verified' ? '✅ ভেরিফাইড' : '⚠️ অযাচাইকৃত'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা বাজার খুঁজুন..." className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">পণ্য</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">বাজার</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">দাম</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">কনফিডেন্স</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">ভোট</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">অবস্থা</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">তারিখ</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">কোনো দাম পাওয়া যায়নি</td></tr>
            ) : filtered.map(item => (
              <tr key={item._id} className="table-row">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.productId?.icon || '🛒'}</span>
                    <span className="font-medium text-slate-800">{item.productId?.nameBn || item.productId?.name || '—'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{item.bazarId?.nameBn || item.bazarId?.name || '—'}</td>
                <td className="px-5 py-3.5 font-bold text-emerald-700">৳{item.price}</td>
                <td className="px-5 py-3.5">
                  <span className={`badge ${item.confidenceScore >= 70 ? 'bg-emerald-50 text-emerald-700' : item.confidenceScore >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {item.confidenceScore}%
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><ThumbsUp className="w-3 h-3" />{item.upvotes || 0}</span>
                    <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><ThumbsDown className="w-3 h-3" />{item.downvotes || 0}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {item.isVerified && <span className="badge bg-emerald-50 text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />ভেরিফাইড</span>}
                    {item.isStockOut && <span className="badge bg-red-50 text-red-700">স্টক আউট</span>}
                    {!item.isVerified && !item.isStockOut && <span className="badge bg-slate-100 text-slate-500">অপেক্ষমান</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(item.createdAt).toLocaleDateString('bn-BD')}</td>
                <td className="px-5 py-3.5">
                  <button onClick={() => setDeleteId(item._id)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmDialog message="এই দামটি স্থায়ীভাবে মুছে যাবে।" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
      )}
    </div>
  );
}
