'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MapPin, CheckCircle2, Navigation, Camera, X, ChevronRight } from 'lucide-react';
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

  const { data: productsRes, isLoading: loadingProducts } = useGetProductsQuery({ limit: 100 });
  const { data: bazarsRes,   isLoading: loadingBazars1  } = useGetBazarsQuery(
    { limit: 50 }, { skip: !!userLocation },
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
  const bazars = userLocation
    ? [...rawBazars].sort((a: any, b: any) =>
        distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng))
    : rawBazars;

  const [formData, setFormData] = useState({
    bazarId: searchParams.get('bazar_id') || '',
    productId: searchParams.get('product_id') || '',
    price: '',
    visitType: 'physical' as 'physical' | 'online',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [photoFile, setPhotoFile]         = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]   = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!formData.bazarId) {
      const saved = localStorage.getItem('defaultBazarId');
      if (saved) setFormData(prev => ({ ...prev, bazarId: saved }));
    }
  }, []);

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

  const selectedProduct = products.find((p: any) => p._id === formData.productId);
  const selectedBazar   = bazars.find((b: any) => b._id === formData.bazarId);

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 px-4 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-5xl border-4 border-emerald-100 shadow-lg">✅</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">ধন্যবাদ!</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            আপনার দাম সফলভাবে সাবমিট হয়েছে।<br />কমিউনিটি যাচাই করার পর প্রকাশিত হবে।
          </p>
        </div>
        <div className="flex gap-3 mt-1 w-full max-w-xs">
          <button onClick={() => { setSubmitted(false); setFormData(prev => ({ ...prev, price: '', productId: '', bazarId: '' })); }}
            className="flex-1 bg-[#064E3B] text-white py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all">
            আবার যোগ করুন
          </button>
          <Link href="/" className="flex-1 bg-white border border-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm text-center active:scale-95 transition-all">
            হোমে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-12">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-[#064E3B]">দাম যোগ করুন</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">সঠিক বাজার দাম শেয়ার করে কমিউনিটিকে সাহায্য করুন</p>
      </div>

      {/* Auth warning */}
      {!isAuthenticated && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl shrink-0">🔑</span>
            <p className="text-sm font-medium text-amber-800">দাম সাবমিট করতে লগইন করুন</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/login" className="bg-[#064E3B] text-white px-4 py-2 rounded-xl text-sm font-bold">লগইন</Link>
            <Link href="/register" className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold">রেজিস্ট্রেশন</Link>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 font-medium flex items-center gap-2">
          <span>⚠️</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Desktop: 2 col | Mobile: 1 col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── STEP 1: বাজার নির্বাচন ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#064E3B] flex items-center justify-center text-white text-xs font-black">১</div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <h2 className="font-bold text-slate-800 text-sm">বাজার নির্বাচন</h2>
                </div>
              </div>
              {userLocation ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> ১০ কিমির মধ্যে
                </span>
              ) : (
                <button type="button" onClick={refreshLocation}
                  className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                  <Navigation className="w-3 h-3" /> লোকেশন চালু করুন
                </button>
              )}
            </div>

            {loadingBazars ? (
              <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            ) : (
              <>
                {/* Quick-pick chips */}
                {userLocation && bazars.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {bazars.slice(0, 4).map((b: any) => {
                      const dist = distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
                      const isSel = formData.bazarId === b._id;
                      return (
                        <button key={b._id} type="button"
                          onClick={() => setFormData(p => ({ ...p, bazarId: b._id }))}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            isSel ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          🏪 {b.nameBn || b.name}
                          <span className={isSel ? 'text-white/70' : 'text-emerald-500'}>{formatDistance(dist)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown */}
                <div className="relative">
                  <select value={formData.bazarId}
                    onChange={(e) => setFormData(p => ({ ...p, bazarId: e.target.value }))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-400 text-slate-700 font-medium text-sm appearance-none cursor-pointer">
                    <option value="">বাজার বেছে নিন...</option>
                    {bazars.map((b: any) => {
                      const dist = userLocation ? formatDistance(distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)) : null;
                      return (
                        <option key={b._id} value={b._id}>
                          {b.nameBn || b.name}{b.area ? ` — ${b.area}` : ''}{dist ? ` (${dist})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>

                {selectedBazar && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedBazar.nameBn || selectedBazar.name}
                    {userLocation && ` · ${formatDistance(distanceKm(userLocation.lat, userLocation.lng, selectedBazar.lat, selectedBazar.lng))} দূরে`}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── STEP 2: পণ্য নির্বাচন ── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#064E3B] flex items-center justify-center text-white text-xs font-black">২</div>
              <h2 className="font-bold text-slate-800 text-sm">পণ্য নির্বাচন</h2>
            </div>

            {loadingProducts ? (
              <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            ) : (
              <>
                {/* Product chips grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {products.slice(0, 12).map((p: any) => {
                    const isSel = formData.productId === p._id;
                    return (
                      <button key={p._id} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, productId: p._id }))}
                        className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl border text-center transition-all active:scale-95 ${
                          isSel
                            ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}>
                        <span className="text-xl leading-none">{p.icon || '🛒'}</span>
                        <span className="text-[10px] font-bold leading-tight truncate w-full px-0.5">{p.nameBn || p.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Fallback dropdown for all products */}
                <div className="relative">
                  <select value={formData.productId}
                    onChange={(e) => setFormData(p => ({ ...p, productId: e.target.value }))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-400 text-slate-700 font-medium text-sm appearance-none cursor-pointer">
                    <option value="">সব পণ্য দেখুন...</option>
                    {products.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name} ({p.unit})</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>

                {selectedProduct && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {selectedProduct.icon} {selectedProduct.nameBn || selectedProduct.name} · {selectedProduct.unit}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── STEP 3: দাম + visit type + photo ── single wide card ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-full bg-[#064E3B] flex items-center justify-center text-white text-xs font-black">৩</div>
            <h2 className="font-bold text-slate-800 text-sm">দাম ও বিস্তারিত</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price input */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">প্রতি ইউনিটের দাম</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">৳</span>
                <input type="number" value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                  placeholder="০" min="1" required inputMode="numeric"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-4 outline-none focus:border-emerald-400 text-slate-900 font-black text-3xl tracking-tight" />
              </div>
              {selectedProduct && <p className="text-[11px] text-slate-400 mt-1.5">প্রতি {selectedProduct.unit}</p>}
            </div>

            {/* Visit type */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">কোথা থেকে দেখেছেন?</p>
              <div className="flex gap-2 h-[58px]">
                {[
                  { value: 'physical', label: '🏪', sub: 'সরাসরি বাজার' },
                  { value: 'online',   label: '📱', sub: 'অনলাইন' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setFormData(p => ({ ...p, visitType: opt.value as any }))}
                    className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-2xl font-bold text-xs transition-all active:scale-95 border-2 ${
                      formData.visitType === opt.value
                        ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                    <span className="text-lg">{opt.label}</span>
                    <span>{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Photo upload */}
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> প্রমাণ ছবি
              <span className="font-normal text-slate-400">(ঐচ্ছিক)</span>
            </p>
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <Image src={photoPreview} alt="proof" width={400} height={160}
                  className="w-full h-36 sm:h-44 object-cover rounded-2xl" unoptimized />
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white active:bg-black/70 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 active:border-emerald-300 active:text-emerald-500 transition-colors bg-slate-50/50">
                <Camera className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold">ছবি তুলুন বা আপলোড করুন</p>
                  <p className="text-[10px] text-slate-400">দাম প্রমাণ হিসেবে ব্যবহার হবে</p>
                </div>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>

        {/* Info tip */}
        <div className="bg-blue-50/60 rounded-2xl px-4 py-3 border border-blue-100/60 flex items-start gap-2.5">
          <span className="text-base shrink-0">💡</span>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            আপনার দেওয়া তথ্য কমিউনিটি যাচাই করবে। সঠিক হলে পয়েন্ট পাবেন এবং বাজার দর আপডেট হবে।
          </p>
        </div>

        {/* Submit button */}
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(16,185,129,0.35)] disabled:opacity-60 text-base">
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
