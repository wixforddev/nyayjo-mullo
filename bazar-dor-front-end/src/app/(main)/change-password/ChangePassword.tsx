'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useChangePasswordMutation } from '../../../store/api/authApi';

export function ChangePassword() {
  const router = useRouter();
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [isSuccess, setIsSuccess]             = useState(false);
  const [error, setError]                     = useState('');

  const isValid = currentPassword && newPassword && newPassword === confirmPassword && newPassword.length >= 8 && /[0-9]/.test(newPassword);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await changePassword({ oldPassword: currentPassword, newPassword }).unwrap();
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCFC] p-4 font-sans text-slate-800 pb-20">
      <div className="flex items-center justify-between mb-8 pt-2 px-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition active:scale-95"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">পাসওয়ার্ড পরিবর্তন</h1>
        <div className="w-10 h-10" />
      </div>

      {isSuccess ? (
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(16,185,129,0.1)] border border-emerald-100 p-8 text-center mt-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">পাসওয়ার্ড আপডেট হয়েছে!</h2>
          <p className="text-sm text-slate-500 mb-6">আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform shadow-md"
          >
            প্রোফাইলে ফিরে যান
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-50 p-6">
          <div className="flex items-center gap-3 mb-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <span className="text-2xl">🔒</span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              আপনার অ্যাকাউন্টের সুরক্ষার জন্য একটি শক্তিশালী এবং মনে রাখা যায় এমন পাসওয়ার্ড ব্যবহার করুন।
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            {/* Current Password */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block px-1">বর্তমান পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-11 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 mb-5" />

            {/* New Password */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block px-1">নতুন পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড দিন"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-11 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400"
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword.length > 0 && (
                <div className="mt-2 px-1 space-y-1">
                  <p className={`text-[11px] font-medium flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span>{newPassword.length >= 8 ? '✓' : '•'}</span> কমপক্ষে ৮টি অক্ষর
                  </p>
                  <p className={`text-[11px] font-medium flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span>{/[0-9]/.test(newPassword) ? '✓' : '•'}</span> কমপক্ষে ১টি সংখ্যা (0-9)
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-8">
              <label className="text-xs font-bold text-slate-500 mb-1.5 block px-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                  className={`w-full bg-slate-50 border rounded-xl p-3.5 pr-11 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 ${
                    confirmPassword.length > 0 && newPassword !== confirmPassword
                      ? 'border-rose-300 focus:border-rose-400 bg-rose-50/30'
                      : 'border-slate-200 focus:border-emerald-500 focus:bg-white'
                  }`}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1.5 px-1">⚠️ পাসওয়ার্ড দুটি মিলছে না</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                !isValid || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white active:scale-95 shadow-[0_4px_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> আপডেট হচ্ছে...</> : 'আপডেট করুন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
