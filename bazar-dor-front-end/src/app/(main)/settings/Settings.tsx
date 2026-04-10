'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Settings() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <div className="min-h-screen bg-[#FAFCFC] p-4 font-sans text-slate-800 pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2 px-1">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-500 hover:bg-slate-50 transition"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-lg font-bold text-slate-800">অ্যাকাউন্ট সেটিংস</h1>
        <div className="w-10 h-10"></div>
      </div>

      {/* Group 1: ব্যক্তিগত তথ্য */}
      <h2 className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">ব্যক্তিগত তথ্য</h2>
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-6 overflow-hidden">
        <div onClick={() => setActiveModal('editProfile')} className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-lg">👤</div>
            <span className="font-semibold text-slate-700">প্রোফাইল এডিট করুন</span>
          </div>
          <span className="text-slate-300">❯</span>
        </div>
        <div onClick={() => alert("নিরাপত্তার জন্য মোবাইল নম্বর পরিবর্তন করতে সাপোর্ট টিমে যোগাযোগ করুন।")} className="flex items-center justify-between p-4 active:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">📱</div>
            <span className="font-semibold text-slate-700">মোবাইল নম্বর</span>
          </div>
          <span className="text-sm text-slate-400 font-medium">+880 17***</span>
        </div>
      </div>

      {/* Group 2: বাজার ও পছন্দ */}
      <h2 className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">বাজার ও পছন্দ</h2>
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-6 overflow-hidden">
        <div onClick={() => setActiveModal('market')} className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 text-lg">📍</div>
            <span className="font-semibold text-slate-700">আমার ডিফল্ট বাজার</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">মিরপুর ৬</span>
            <span className="text-slate-300">❯</span>
          </div>
        </div>
        <div onClick={() => setActiveModal('tracking')} className="flex items-center justify-between p-4 active:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 text-lg">❤️</div>
            <span className="font-semibold text-slate-700">প্রিয় পণ্য (ট্র্যাকিং)</span>
          </div>
          <span className="text-slate-300">❯</span>
        </div>
      </div>

      {/* Group 3: নিরাপত্তা */}
      <h2 className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">নিরাপত্তা</h2>
      <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-6 overflow-hidden">
        <div onClick={() => router.push('/change-password')} className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-lg">🔒</div>
            <span className="font-semibold text-slate-700">পাসওয়ার্ড পরিবর্তন</span>
          </div>
          <span className="text-slate-300">❯</span>
        </div>
        <div onClick={() => setActiveModal('delete')} className="flex items-center justify-between p-4 active:bg-rose-50 transition cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-lg">🗑️</div>
            <span className="font-semibold text-rose-600">অ্যাকাউন্ট মুছুন</span>
          </div>
          <span className="text-rose-300">❯</span>
        </div>
      </div>

      {/* MODALS / BOTTOM SHEETS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10">
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold">✕</button>

            {activeModal === 'editProfile' && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">প্রোফাইল আপডেট</h2>
                <label className="text-xs text-slate-500 mb-1 block">আপনার নাম</label>
                <input type="text" defaultValue="আহমেদ ফয়সাল" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:border-emerald-500 text-slate-800 font-medium" />
                <button onClick={closeModal} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform">সেভ করুন</button>
              </div>
            )}

            {activeModal === 'market' && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">ডিফল্ট বাজার নির্বাচন</h2>
                <p className="text-sm text-slate-500 mb-4">হোমপেজে এই বাজারের দাম আগে দেখানো হবে।</p>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none text-slate-800 font-medium">
                  <option>মিরপুর ৬ কাঁচাবাজার</option>
                  <option>কারওয়ান বাজার</option>
                  <option>গুলশান ডিএনসিসি</option>
                </select>
                <button onClick={closeModal} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform">নিশ্চিত করুন</button>
              </div>
            )}

            {activeModal === 'delete' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">অ্যাকাউন্ট মুছতে চান?</h2>
                <p className="text-sm text-slate-500 mb-6">আপনার সমস্ত ডাটা, সাশ্রয় এবং অবদান স্থায়ীভাবে মুছে যাবে। এটি আর ফিরিয়ে আনা সম্ভব নয়।</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl active:scale-95 transition-transform">বাতিল</button>
                  <button onClick={() => { alert("Account Deleted"); closeModal(); }} className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform shadow-[0_4px_15px_rgba(225,29,72,0.3)]">হ্যাঁ, মুছে ফেলুন</button>
                </div>
              </div>
            )}

            {activeModal === 'tracking' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">⚙️</div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">ফিচারটি তৈরি হচ্ছে</h2>
                <p className="text-sm text-slate-500 mb-6">খুব শীঘ্রই এই আপডেটটি যুক্ত করা হবে।</p>
                <button onClick={closeModal} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform">ঠিক আছে</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
