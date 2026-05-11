'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MapPin, ShoppingBag, CheckCircle2, Navigation, Camera, X, Store, Smartphone } from 'lucide-react';
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
  const { data: bazarsRes,   isLoading: loadingBazars1  } = useGetBazarsQuery(
    { limit: 50 }, { skip: !!userLocation },
  );
  const { data: nearbyBazarsRes, isLoading: loadingBazars2 } = useGetNearbyBazarsQuery(
    { lat: userLocation?.lat ?? 0, lng: userLocation?.lng ?? 0, radius: 10, limit: 50 },
    { skip: !userLocation },
  );
  const [submitPrice, { isLoading: isSubmitting }] = useSubmitPriceMutation();

  const loadingBazars = loadingBazars1 || loadingBazars2;
  const products  = productsRes?.data?.attributes?.data || [];
  const rawBazars = userLocation
    ? (nearbyBazarsRes?.data?.attributes || [])
    : (bazarsRes?.data?.attributes?.data || []);

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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
      fd.append('bazarId', formData.bazarId);
      fd.append('price', formData.price);
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

  const card = 'bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-5';

  /* ── Auth gate ── */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">🔒</div>
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">লগইন করুন</h2>
          <p className="text-slate-400 text-sm">দাম সাবমিট করতে অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="bg-[#064E3B] text-white px-6 py-2.5 rounded-xl font-bold text-sm">লগইন করুন</Link>
          <Link href="/register" className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm">রেজিস্ট্রেশন</Link>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 animate-in zoom-in-95 duration-500 text-center px-4">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl border-4 border-emerald-100 shadow-lg shadow-emerald-100">✅</div>
        <div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-1.5">ধন্যবাদ!</h2>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed">আপনার দাম সফলভাবে সাবমিট হয়েছে।<br />কমিউনিটি যাচাই করার পর প্রকাশিত হবে।</p>
        </div>
        <div className="flex gap-3 mt-1">
          <button onClick={() => { setSubmitted(false); setFormData(prev => ({ ...prev, price: '' })); }}
            className="bg-[#064E3B] text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform">
            আবার যোগ করুন
          </button>
          <Link href="/" className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm">হোমে যান</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#064E3B] tracking-tight">দাম যোগ করুন</h1>
        <p className="text-slate-400 text-sm mt-1">সঠিক বাজার দাম শেয়ার করে কমিউনিটিকে সাহায্য করুন</p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-600 font-medium flex items-center gap-2">
          <span>⚠️</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/*
          4 cards as direct grid children:
          Row 1 → বাজার (col 1)  |  দাম+ভিজিট (col 2)
          Row 2 → পণ্য   (col 1)  |  প্রমাণ ছবি (col 2)
          CSS grid ensures same-row cards start at the same vertical position.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* ── ROW 1, COL 1 — বাজার নির্বাচন ── */}
          <div className={`${card} order-1`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-none">বাজার নির্বাচন</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">কোন বাজারে দেখেছেন?</p>
                </div>
              </div>
              {userLocation ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <Navigation className="w-3 h-3" /> কাছের বাজার
                </span>
              ) : (
                <button type="button" onClick={refreshLocation}
                  className="text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full flex items-center gap-1 shrink-0 active:scale-95 transition-transform">
                  <Navigation className="w-3 h-3" /> লোকেশন দিন
                </button>
              )}
            </div>

            {loadingBazars ? (
              <div className="space-y-2">
                <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                <div className="flex gap-2">{[1,2,3].map(i => <div key={i} className="h-8 flex-1 bg-slate-100 rounded-xl animate-pulse" />)}</div>
              </div>
            ) : (
              <>
                <select value={formData.bazarId}
                  onChange={(e) => setFormData(p => ({ ...p, bazarId: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 text-slate-700 font-semibold text-sm transition-all">
                  <option value="">বাজার বেছে নিন</option>
                  {bazars.map((b: any) => {
                    const dist = userLocation ? formatDistance(distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)) : null;
                    return (
                      <option key={b._id} value={b._id}>
                        {b.nameBn || b.name}{b.area ? ` — ${b.area}` : ''}{dist ? ` (${dist})` : ''}
                      </option>
                    );
                  })}
                </select>

                {userLocation && bazars.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {bazars.slice(0, 3).map((b: any) => {
                      const dist = distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
                      const isSel = formData.bazarId === b._id;
                      return (
                        <button key={b._id} type="button"
                          onClick={() => setFormData(p => ({ ...p, bazarId: b._id }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            isSel ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                          }`}>
                          🏪 {b.nameBn || b.name}
                          <span className={isSel ? 'text-emerald-300' : 'text-emerald-500 font-extrabold'}>{formatDistance(dist)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedBazar && (
                  <div className="mt-3 flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-700 truncate">{selectedBazar.nameBn || selectedBazar.name}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── ROW 1, COL 2 — দাম + কোথায় (desktop only for কোথায়) ── */}
          <div className={`${card} order-2`}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="text-emerald-600 font-extrabold text-sm leading-none">৳</span>
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-none">দাম লিখুন</p>
                <p className="text-[11px] text-slate-400 mt-0.5">প্রতি ইউনিটের বাজার দাম</p>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-200 select-none leading-none pointer-events-none">৳</span>
              <input type="number" value={formData.price}
                onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                placeholder="০" min="1" required inputMode="numeric"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 text-slate-900 font-black text-3xl tracking-tight transition-all" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5 pl-1">
              {selectedProduct ? `প্রতি ${selectedProduct.unit}` : 'প্রতি ইউনিট'}
            </p>

            {/* কোথায় — desktop only (mobile has separate card below পণ্য) */}
            <div className="hidden lg:block mt-4">
              <div className="border-t border-slate-100 mb-4" />
              <p className="font-bold text-slate-700 text-sm mb-3">কোথা থেকে দেখেছেন?</p>
              <div className="flex gap-2.5">
                {[
                  { value: 'physical', Icon: Store, label: 'সরাসরি বাজার' },
                  { value: 'online',   Icon: Smartphone, label: 'অনলাইন' },
                ].map(({ value, Icon, label }) => (
                  <button key={value} type="button"
                    onClick={() => setFormData(p => ({ ...p, visitType: value as any }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs border-2 transition-all active:scale-95 ${
                      formData.visitType === value
                        ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}>
                    <Icon className="w-4 h-4" strokeWidth={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── ROW 2, COL 1 — পণ্য নির্বাচন ── */}
          <div className={`${card} order-3`}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-blue-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-none">পণ্য নির্বাচন</p>
                <p className="text-[11px] text-slate-400 mt-0.5">কোন পণ্যের দাম দিচ্ছেন?</p>
              </div>
            </div>

            {loadingProducts ? (
              <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <>
                <select value={formData.productId}
                  onChange={(e) => setFormData(p => ({ ...p, productId: e.target.value }))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 text-slate-700 font-semibold text-sm transition-all">
                  <option value="">পণ্য বেছে নিন</option>
                  {products.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.icon} {p.nameBn || p.name} ({p.unit})</option>
                  ))}
                </select>

                {selectedProduct && (
                  <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="text-xs font-semibold text-blue-700">
                      {selectedProduct.icon} {selectedProduct.nameBn || selectedProduct.name} · {selectedProduct.unit}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── MOBILE ONLY — কোথা থেকে দেখেছেন (order-4, after পণ্য) ── */}
          <div className={`${card} order-4 lg:hidden`}>
            <p className="font-bold text-slate-700 text-sm mb-3">কোথা থেকে দেখেছেন?</p>
            <div className="flex gap-2.5">
              {[
                { value: 'physical', Icon: Store, label: 'সরাসরি বাজার' },
                { value: 'online',   Icon: Smartphone, label: 'অনলাইন' },
              ].map(({ value, Icon, label }) => (
                <button key={value} type="button"
                  onClick={() => setFormData(p => ({ ...p, visitType: value as any }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs border-2 transition-all active:scale-95 ${
                    formData.visitType === value
                      ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── ROW 2, COL 2 — প্রমাণ ছবি ── */}
          <div className={`${card} order-5`}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-violet-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-none">
                  প্রমাণ ছবি
                  <span className="ml-2 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full align-middle">ঐচ্ছিক</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">দামের প্রমাণ হিসেবে ব্যবহার হবে</p>
              </div>
            </div>

            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <Image src={photoPreview} alt="proof" width={400} height={160}
                  className="w-full h-36 object-cover" unoptimized />
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:bg-black/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/30 active:scale-[0.98] transition-all bg-slate-50/50">
                <Camera className="w-5 h-5" />
                <div className="text-center">
                  <p className="text-xs font-semibold">ছবি তুলুন বা আপলোড করুন</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG · সর্বোচ্চ 5MB</p>
                </div>
              </button>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" capture="environment"
              onChange={handlePhotoSelect} className="hidden" />
          </div>
        </div>

        {/* ── Info strip ── */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 mb-4">
          <span className="text-base shrink-0">💡</span>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            আপনার তথ্য কমিউনিটি যাচাই করবে। সঠিক হলে <span className="font-bold text-amber-700">পয়েন্ট</span> পাবেন এবং বাজার দর আপডেট হবে।
          </p>
        </div>

        {/* ── Submit button ── */}
        <button type="submit" disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-[#064E3B] to-[#10B981] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-[0_6px_24px_rgba(16,185,129,0.28)] disabled:opacity-60 text-base">
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
