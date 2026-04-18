import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLoginMutation } from '../store/api/authApi';
import { setCredentials } from '../store/slices/authSlice';
import { useAppDispatch } from '../store/hooks';
import toast from 'react-hot-toast';

export function Login() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      const token = res?.data?.attributes?.tokens?.access?.token;
      const user  = res?.data?.attributes?.user;
      if (!token) throw new Error('Token not found');
      if (user?.role !== 'admin') throw new Error('অ্যাডমিন অ্যাক্সেস নেই');
      dispatch(setCredentials({ user, token }));
      navigate('/');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'লগইন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064E3B] via-[#065f46] to-[#047857] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">বাজার দর</h1>
          <p className="text-emerald-200 text-sm">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6">লগইন করুন</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ইমেইল</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com" required className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">পাসওয়ার্ড</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input pr-10" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="btn-primary justify-center py-3 mt-2 text-base w-full">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'লগইন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
