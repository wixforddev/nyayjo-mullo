'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginMutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password }).unwrap();
      console.log(res)
      const user   = res.data.attributes.user;
      const tokens = res.data.attributes.tokens;
      dispatch(setCredentials({ user, tokens }));

      router.push('/');
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'লগইন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCFC] flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-teal-100/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-emerald-900/20 mx-auto mb-4">
            <Image src="/images/logo.png" alt="নায্যমূল্য" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#064E3B]">নায্যমূল্য</h1>
          <p className="text-sm text-slate-500 mt-1">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">ইমেইল</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-[#064E3B] font-medium">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-900/15 disabled:opacity-60 mt-2"
            >
              {isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/register" className="text-[#064E3B] font-bold hover:underline">
              রেজিস্ট্রেশন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
