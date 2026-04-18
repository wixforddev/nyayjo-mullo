'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  useForgotPasswordMutation,
  useVerifyEmailMutation,
  useResetPasswordMutation,
} from '../../store/api/authApi';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');

  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  const [forgotPassword, { isLoading: sendingOtp }]  = useForgotPasswordMutation();
  const [verifyEmail,    { isLoading: verifyingOtp }] = useVerifyEmailMutation();
  const [resetPassword,  { isLoading: resetting }]    = useResetPasswordMutation();

  // Step 1 — send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword({ email }).unwrap();
      setSuccess('OTP কোড আপনার ইমেইলে পাঠানো হয়েছে');
      setStep('otp');
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'ইমেইল পাঠাতে সমস্যা হয়েছে');
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await verifyEmail({ email, oneTimeCode: otp }).unwrap();
      setSuccess('OTP ভেরিফাই হয়েছে! নতুন পাসওয়ার্ড দিন।');
      setStep('reset');
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'OTP ভুল হয়েছে');
    }
  };

  // Step 3 — set new password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না');
      return;
    }
    try {
      await resetPassword({ email, password: newPassword }).unwrap();
      setSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    }
  };

  const stepTitles: Record<Step, string> = {
    email: 'পাসওয়ার্ড ভুলে গেছেন?',
    otp:   'OTP ভেরিফাই করুন',
    reset: 'নতুন পাসওয়ার্ড দিন',
  };

  const stepSubtitles: Record<Step, string> = {
    email: 'আপনার ইমেইলে একটি কোড পাঠানো হবে',
    otp:   `${email} এ পাঠানো ৬ সংখ্যার কোড দিন`,
    reset: 'শক্তিশালী পাসওয়ার্ড বেছে নিন',
  };

  return (
    <div className="min-h-screen bg-[#FAFCFC] flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-teal-100/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-900/20 mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-[#064E3B]">বাজার দর</h1>
          <p className="text-sm text-slate-500 mt-1">{stepTitles[step]}</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-[#064E3B] text-white scale-110' :
                ((['email','otp','reset'] as Step[]).indexOf(step) > i) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {((['email','otp','reset'] as Step[]).indexOf(step) > i) ? '✓' : i + 1}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 max-w-8 transition-all ${
                ((['email','otp','reset'] as Step[]).indexOf(step) > i) ? 'bg-emerald-300' : 'bg-slate-200'
              }`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7">
          {/* Sub-title */}
          <p className="text-xs text-slate-500 font-medium text-center mb-5">{stepSubtitles[step]}</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
              {success}
            </div>
          )}

          {/* Step 1 — Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল লিখুন"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-900/15 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sendingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> পাঠানো হচ্ছে...</> : 'OTP পাঠান'}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">OTP কোড</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="৬ সংখ্যার কোড"
                  required
                  maxLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-bold text-center text-xl tracking-widest placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal"
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp}
                className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {verifyingOtp ? <><Loader2 className="w-4 h-4 animate-spin" /> ভেরিফাই হচ্ছে...</> : 'ভেরিফাই করুন'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
                className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">
                ← ইমেইল পরিবর্তন করুন
              </button>
            </form>
          )}

          {/* Step 3 — New password */}
          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">নতুন পাসওয়ার্ড</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৮ অক্ষর, ১টি নম্বর"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-11 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-1.5 px-1 space-y-1">
                    <p className={`text-[11px] font-medium flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span>{newPassword.length >= 8 ? '✓' : '•'}</span> কমপক্ষে ৮টি অক্ষর
                    </p>
                    <p className={`text-[11px] font-medium flex items-center gap-1.5 ${/[0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span>{/[0-9]/.test(newPassword) ? '✓' : '•'}</span> কমপক্ষে ১টি সংখ্যা
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    required
                    className={`w-full bg-slate-50 border rounded-xl p-3.5 pr-11 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm ${
                      confirmPassword && newPassword !== confirmPassword ? 'border-rose-300' : 'border-slate-200 focus:border-emerald-500 focus:bg-white'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-1 px-1">⚠️ পাসওয়ার্ড মিলছে না</p>
                )}
              </div>
              <button
                type="submit"
                disabled={resetting || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {resetting ? <><Loader2 className="w-4 h-4 animate-spin" /> পরিবর্তন হচ্ছে...</> : 'পাসওয়ার্ড পরিবর্তন করুন'}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-sm text-slate-500">
            মনে পড়েছে?{' '}
            <Link href="/login" className="text-[#064E3B] font-bold hover:underline">লগইন করুন</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
