'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MapPin, ShoppingBag, CheckCircle2, Info, Navigation, Camera, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetProductsQuery } from '../../../store/api/productApi';
import { useGetBazarsQuery, useGetNearbyBazarsQuery } from '../../../store/api/bazarApi';
import { useSubmitPriceMutation } from '../../../store/api/priceApi';
import { useAppSelector } from '../../../store/hooks';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { distanceKm, formatDistance } from '../../../lib/distance';

export function SubmitPrice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

  const { location: userLocation, refresh: refreshLocation } = useUserLocation();

  const { data: productsRes, isLoading: loadingProducts } = useGetProductsQuery({ limit: 50 });
  const { data: bazarsRes, isLoading: loadingBazars1 } = useGetBazarsQuery(
    { limit: 50 },
    { skip: !!userLocation },
  );
  const { data: nearbyBazarsRes, isLoading: loadingBazars2 } = useGetNearbyBazarsQuery(
    { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 10, limit: 50 },
    { skip: !userLocation },
  );
  const [submitPrice, { isLoading: isSubmitting }] = useSubmitPriceMutation();

  const loadingBazars = loadingBazars1 || loadingBazars2;
  const products = productsRes?.data?.attributes?.data || [];
  const rawBazars = userLocation
    ? (nearbyBazarsRes?.data?.attributes || [])
    : (bazarsRes?.data?.attributes?.data || []);

  // Sort bazars by distance if user location is available
  const bazars = userLocation
    ? [...rawBazars].sort((a: any, b: any) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )
    : rawBazars;

  const [formData, setFormData] = useState({
    bazarId: searchParams.get('bazar_id') || '',
    productId: searchParams.get('product_id') || '',
    price: '',
    visitType: 'physical' as 'physical' | 'online',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Proof photo (optional)
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  useEffect(() => {
    if (!formData.bazarId) {
      const saved = localStorage.getItem('defaultBazarId');
      if (saved) setFormData(prev => ({ ...prev, bazarId: saved }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!formData.productId || !formData.bazarId || !formData.price) {
      setError('পণ্য, বাজার ও দাম সিলেক্ট করুন');
      return;
    }
    setError('');
    try {
      const fd = new FormData();
      fd.append('productId', formData.productId);
      fd.append('bazarId',   formData.bazarId);
      fd.append('price',     formData.price);
      fd.append('visitType', formData.visitType);
      if (photoFile) fd.append('photo', photoFile);

      await submitPrice(fd).unwrap();
      setSubmitted(true);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err?.data?.message || 'সাবমিট ব্যর্থ হয়েছে');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-bold text-slate-800">দাম সাবমিট করতে লগইন করুন</h2>
        <p className="text-slate-500 text-sm text-center">আপনার কমিউনিটিকে সাহায্য করুন সঠিক দাম শেয়ার করে</p>
        <div className="flex gap-3">
          <Link href="/login" className="bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold">লগইন করুন</Link>
          <Link href="/register" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">রেজিস্ট্রেশন</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl border-4 border-emerald-100">✅</div>
        <h2 className="text-2xl font-bold text-emerald-900">ধন্যবাদ!</h2>
        <p className="text-slate-500 text-center text-sm max-w-xs">আপনার দাম সফলভাবে সাবমিট হয়েছে। কমিউনিটি যাচাই করার পর এটি প্রকাশিত হবে।</p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setSubmitted(false); setFormData(prev => ({ ...prev, price: '' })); }}
            className="bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold">আবার যোগ করুন</button>
          <Link href="/" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold">হোমে যান</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#064E3B]">দাম যোগ করুন</h1>
        <p className="text-slate-500 text-sm mt-1">আপনার কমিউনিটিকে সাহায্য করুন সঠিক দাম শেয়ার করে</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Left: Market + Product */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center"><MapPin className="w-4 h-4 text-orange-500" /></div>
                  <h2 className="font-bold text-slate-800">বাজার নির্বাচন</h2>
                </div>
                {userLocation ? (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> ১০ কিমির মধ্যে
                  </span>
                ) : (
                  <button type="button" onClick={refreshLocation}
                    className="text-[10px] font-semibold text-blue-500 flex items-center gap-1 hover:text-blue-700">
                    <Navigation className="w-3 h-3" /> লোকেশন চালু করুন
                  </button>
                )}
              </div>
              {loadingBazars ? (
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
              ) : (
                <>
                  <select value={formData.bazarId} onChange={(e) => setFormData(p => ({ ...p, bazarId: e.target.value }))} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm">
                    <option value="">বাজার বেছে নিন</option>
                    {bazars.map((b: any) => {
                      const dist = userLocation
                        ? formatDistance(distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng))
                        : null;
                      return (
                        <option key={b._id} value={b._id}>
                          {b.nameBn || b.name} — {b.area}{dist ? ` (${dist})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  {/* Nearest bazar quick-picks */}
                  {userLocation && bazars.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {bazars.slice(0, 3).map((b: any) => {
                        const dist = distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
                        const isSelected = formData.bazarId === b._id;
                        return (
                          <button key={b._id} type="button"
                            onClick={() => setFormData(p => ({ ...p, bazarId: b._id }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? 'bg-[#064E3B] text-white border-[#064E3B]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                            }`}>
                            🏪 {b.nameBn || b.name}
                            <span className={`${isSelected ? 'text-white/70' : 'text-emerald-600'}`}>
                              {formatDistance(dist)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-blue-500" /></div>
                <h2 className="font-bold text-slate-800">পণ্য নির্বাচন</h2>
              </div>
              {loadingProducts ? (
                <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
              ) : (
                <select value={formData.productId} onChange={(e) => setFormData(p => ({ ...p, productId: e.target.value }))} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none focus:border-emerald-500 text-slate-800 font-medium text-sm">
                  <option value="">পণ্য বেছে নিন</option>
                  {products.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name} ({p.unit})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Right: Price + Visit Type */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">৳</div>
                <h2 className="font-bold text-slate-800">দাম লিখুন</h2>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">৳</span>
                <input type="number" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                  placeholder="০" min="1" required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-4 outline-none focus:border-emerald-500 text-slate-800 font-bold text-2xl" />
              </div>
              <p className="text-xs text-slate-400 mt-2 px-1">প্রতি ইউনিটের দাম লিখুন</p>
            </div>

            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 p-5">
              <h2 className="font-bold text-slate-800 mb-3">কোথা থেকে দেখেছেন?</h2>
              <div className="flex gap-3">
                {[
                  { value: 'physical', label: '🏪 সরাসরি বাজার' },
                  { value: 'online', label: '📱 অনলাইন' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setFormData(p => ({ ...p, visitType: opt.value as any }))}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.visitType === opt.value ? 'bg-[#064E3B] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proof photo upload */}
            <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 p-5">
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-400" /> ছবি যোগ করুন
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">ঐচ্ছিক</span>
              </h2>

              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <Image src={photoPreview} alt="proof" width={400} height={200}
                    className="w-full h-40 object-cover rounded-2xl" unoptimized />
                  <button type="button" onClick={removePhoto}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors bg-slate-50/50">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-semibold">বাজারের ছবি তুলুন বা আপলোড করুন</span>
                  <span className="text-[10px]">দাম প্রমাণ হিসেবে ব্যবহার হবে</span>
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
                onChange={handlePhotoSelect} className="hidden" />
            </div>

            <div className="bg-blue-50/50 rounded-[20px] p-4 border border-blue-100/50 flex gap-3">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 font-medium leading-relaxed">আপনার দেওয়া তথ্য কমিউনিটি যাচাই করবে এবং সঠিক হলে পয়েন্ট পাবেন।</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}
          className="w-full mt-6 bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-60">
          {isSubmitting ? (
            <span className="animate-pulse">সাবমিট হচ্ছে...</span>
          ) : (
            <><CheckCircle2 className="w-5 h-5" /> দাম সাবমিট করুন</>
          )}
        </button>
      </form>
    </div>
  );
}
