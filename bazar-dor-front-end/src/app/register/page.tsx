'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterMutation, useVerifyEmailMutation } from '../../store/api/authApi';
import { Activity, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [register,    { isLoading: isRegistering }] = useRegisterMutation();
  const [verifyEmail, { isLoading: isVerifying }]   = useVerifyEmailMutation();

  const [step, setStep] = useState<'register' | 'verify'>('register');

  // Form fields
  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [phone, setPhone]         = useState('');
  const [address, setAddress]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp]             = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  // Auto-fill location via browser geolocation
  const [geoLoading, setGeoLoading] = useState(false);
  const [location, setLocation]     = useState<{lat: number; lng: number} | null>(null);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => setGeoLoading(false)
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const body: any = { fullName, email, password, role: 'user' };
      if (phone)    body.phone   = phone;
      if (address)  body.address = address;
      if (location) body.location = location;

      await register(body).unwrap();
      setSuccess('OTP কোড আপনার ইমেইলে পাঠানো হয়েছে');
      setStep('verify');
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await verifyEmail({ email, oneTimeCode: otp }).unwrap();
      setSuccess('ইমেইল ভেরিফাই হয়েছে! লগইন করুন।');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err?.data?.message || err?.error || 'OTP ভুল হয়েছে');
    }
  };

  const pwValid = password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);

  return (
    <div className="min-h-screen bg-[#FAFCFC] flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-teal-100/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#064E3B] to-[#10B981] flex items-center justify-center shadow-lg shadow-emerald-900/20 mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-[#064E3B]">বাজার দর</h1>
          <p className="text-sm text-slate-500 mt-1">
            {step === 'register' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'ইমেইল ভেরিফাই করুন'}
          </p>
        </div>

        <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-7">
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

          {step === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">পুরো নাম *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">ইমেইল *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1X XXXX XXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                />
              </div>

              {/* Address + Geolocation */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">এলাকা / ঠিকানা</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="যেমন: মিরপুর, ঢাকা"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    title="বর্তমান লোকেশন নিন"
                    className={`w-12 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      location ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300'
                    }`}
                  >
                    {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" strokeWidth={2} />}
                  </button>
                </div>
                {location && (
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 px-1">
                    ✓ লোকেশন সংগ্রহ হয়েছে ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">পাসওয়ার্ড *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৮ অক্ষর, ১টি নম্বর"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pr-11 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-medium placeholder:text-slate-400 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-1.5 px-1 space-y-0.5">
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span>{password.length >= 8 ? '✓' : '•'}</span> কমপক্ষে ৮ অক্ষর
                    </p>
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '•'}</span> কমপক্ষে ১টি সংখ্যা
                    </p>
                    <p className={`text-[11px] font-medium flex items-center gap-1 ${/[a-zA-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span>{/[a-zA-Z]/.test(password) ? '✓' : '•'}</span> কমপক্ষে ১টি অক্ষর
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isRegistering || !pwValid}
                className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-900/15 disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
              >
                {isRegistering ? <><Loader2 className="w-4 h-4 animate-spin" /> রেজিস্ট্রেশন হচ্ছে...</> : 'রেজিস্ট্রেশন করুন'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">📧</div>
                <p className="text-sm text-slate-600 font-medium">
                  <span className="font-bold text-slate-800">{email}</span> এ OTP কোড পাঠানো হয়েছে
                </p>
                <p className="text-xs text-slate-400 mt-1">কোডটি ৩ মিনিটের মধ্যে মেয়াদ শেষ হবে</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1.5 block">OTP কোড</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="৬ সংখ্যার কোড লিখুন"
                  required
                  maxLength={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-bold text-center text-xl tracking-widest placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-normal"
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-900/15 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isVerifying ? <><Loader2 className="w-4 h-4 animate-spin" /> ভেরিফাই হচ্ছে...</> : 'ভেরিফাই করুন'}
              </button>
              <button type="button" onClick={() => setStep('register')}
                className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">
                ← পিছনে যান
              </button>
            </form>
          )}

          {step === 'register' && (
            <div className="mt-5 text-center text-sm text-slate-500">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <Link href="/login" className="text-[#064E3B] font-bold hover:underline">
                লগইন করুন
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
