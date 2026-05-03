'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera } from 'lucide-react';
import Image from 'next/image';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { updateUser, logout } from '../../../store/slices/authSlice';
import { useUpdateProfileMutation } from '../../../store/api/userApi';
import { useDeleteAccountMutation } from '../../../store/api/authApi';

export function Settings() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const user     = useAppSelector((s) => s.auth.user);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [flashMsg, setFlashMsg]       = useState<{type: 'ok'|'err'; text: string} | null>(null);

  const closeModal = () => setActiveModal(null);
  const showFlash  = (type: 'ok'|'err', text: string) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg(null), 3000);
  };

  // Profile form state
  const [fullName,   setFullName]   = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Image preview state
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');

  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();

  // Pre-fill form when modal opens
  useEffect(() => {
    if (activeModal === 'editProfile' && user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setDateOfBirth(user.dataOfBirth || '');
      setImageFile(null);
      setImagePreview(null);
    }
    if (activeModal !== 'delete') setDeletePassword('');
  }, [activeModal, user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    if (!user?.id && !user?._id) return;
    try {
      const id = user.id || user._id;

      // Always send as FormData so the image file (if any) can be attached
      const fd = new FormData();
      fd.append('fullName',    fullName);
      fd.append('phone',       phone);
      fd.append('address',     address);
      fd.append('dataOfBirth', dateOfBirth);
      if (imageFile) fd.append('image', imageFile);

      const result = await updateProfile({ id, formData: fd }).unwrap();

      // Update Redux store — include new image URL if server returned it
      const updatedImage = result?.data?.image || result?.data?.user?.image;
      dispatch(updateUser({
        fullName,
        phone,
        address,
        dataOfBirth: dateOfBirth,
        ...(updatedImage && { image: updatedImage }),
      }));

      closeModal();
      showFlash('ok', 'প্রোফাইল আপডেট হয়েছে');
    } catch (err: any) {
      showFlash('err', err?.data?.message || 'আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) return;
    try {
      await deleteAccount({ password: deletePassword }).unwrap();
      dispatch(logout());
      router.push('/login');
    } catch (err: any) {
      showFlash('err', err?.data?.message || 'অ্যাকাউন্ট মুছতে সমস্যা হয়েছে');
    }
  };

  const avatarUrl = typeof user?.image === 'string' ? user.image : '';
  const initials  = (user?.fullName || 'U').charAt(0).toUpperCase();

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
        <div className="w-10 h-10" />
      </div>

      {flashMsg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${flashMsg.type === 'ok' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-600'}`}>
          {flashMsg.text}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:gap-6">

        {/* Group 1: ব্যক্তিগত তথ্য */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">ব্যক্তিগত তথ্য</h2>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-6 overflow-hidden">
            <div onClick={() => setActiveModal('editProfile')}
              className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="profile" fill className="object-cover" unoptimized />
                  ) : (
                    <span className="text-lg font-bold text-emerald-700">{initials}</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">প্রোফাইল এডিট করুন</span>
                  <span className="text-xs text-slate-400">{user?.fullName || '—'}</span>
                </div>
              </div>
              <span className="text-slate-300">❯</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500 text-lg">📱</div>
                <span className="font-semibold text-slate-700">মোবাইল নম্বর</span>
              </div>
              <span className="text-sm text-slate-500 font-medium">{user?.phone || 'যোগ করা হয়নি'}</span>
            </div>
          </div>
        </div>

        <div>
          {/* Group 2: নিরাপত্তা */}
          <h2 className="text-xs font-bold text-slate-400 mb-2 px-3 uppercase tracking-wider">নিরাপত্তা</h2>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 mb-6 overflow-hidden">
            <div onClick={() => router.push('/change-password')}
              className="flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-lg">🔒</div>
                <span className="font-semibold text-slate-700">পাসওয়ার্ড পরিবর্তন</span>
              </div>
              <span className="text-slate-300">❯</span>
            </div>
            <div onClick={() => setActiveModal('delete')}
              className="flex items-center justify-between p-4 active:bg-rose-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 text-lg">🗑️</div>
                <span className="font-semibold text-rose-600">অ্যাকাউন্ট মুছুন</span>
              </div>
              <span className="text-rose-300">❯</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 pt-4 pb-24 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 overflow-y-auto max-h-[85vh]">
            <button onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold">✕</button>

            {/* Edit Profile Modal */}
            {activeModal === 'editProfile' && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-5">প্রোফাইল আপডেট</h2>

                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center mb-5">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center mb-3 border-2 border-white shadow-md">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="preview" fill className="object-cover" unoptimized />
                    ) : avatarUrl ? (
                      <Image src={avatarUrl} alt="profile" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-3xl font-bold text-emerald-700">{initials}</span>
                    )}
                    {/* Camera overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity rounded-full"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                  >
                    ছবি পরিবর্তন করুন
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imageFile && (
                    <p className="text-[11px] text-slate-400 mt-1">{imageFile.name}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">পুরো নাম</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm"
                      placeholder="আপনার নাম"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">মোবাইল নম্বর</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm"
                      placeholder="+880 1X XXXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">ঠিকানা</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm"
                      placeholder="আপনার এলাকা / শহর"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">জন্ম তারিখ</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleProfileSave}
                  disabled={updating}
                  className="w-full mt-5 bg-emerald-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> আপলোড হচ্ছে...</> : 'সেভ করুন'}
                </button>
              </div>
            )}

            {/* Delete Account Modal */}
            {activeModal === 'delete' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">অ্যাকাউন্ট মুছতে চান?</h2>
                <p className="text-sm text-slate-500 mb-4">এটি স্থায়ী। নিশ্চিত করতে আপনার পাসওয়ার্ড দিন।</p>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:border-rose-400 text-slate-800 font-medium text-sm text-center"
                />
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl active:scale-95 transition-transform">
                    বাতিল
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || deleting}
                    className="flex-1 bg-rose-600 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(225,29,72,0.3)]"
                  >
                    {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> মুছছে...</> : 'মুছে ফেলুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
