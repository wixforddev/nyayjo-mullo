'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingBag, DollarSign, Camera, CheckCircle2, Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PRODUCTS, AREAS } from '@/constants';

export function SubmitPrice() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get('product_id') || '';
  const initialBazarId = searchParams.get('bazar_id') || '';

  const [submitted, setSubmitted] = useState(false);
  const [lastSubmittedVisitType, setLastSubmittedVisitType] = useState('direct');
  const [formData, setFormData] = useState({
    bazar_id: initialBazarId,
    product_id: initialProductId,
    price: '',
    photo_url: '',
    visit_type: 'direct'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      bazar_id: initialBazarId || prev.bazar_id,
      product_id: initialProductId || prev.product_id,
    }));
  }, [initialProductId, initialBazarId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          user_id: 'anonymous'
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setLastSubmittedVisitType(formData.visit_type);
        setFormData({
          bazar_id: '',
          product_id: '',
          price: '',
          photo_url: '',
          visit_type: 'direct'
        });
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        alert('Failed to submit price. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting price:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto w-full flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-[#10B981] mb-4 shadow-sm border border-emerald-100">
          <CheckCircle2 className="w-12 h-12" strokeWidth={2} />
        </div>
        <h2 className="text-3xl font-bold text-[#064E3B]">ধন্যবাদ</h2>
        <p className="text-lg text-slate-500 max-w-sm">
          আপনার দেওয়া দাম যাচাইয়ের জন্য পাঠানো হয়েছে।
        </p>
        {lastSubmittedVisitType === 'direct' && (
          <p className="text-sm font-medium text-[#10B981] bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
            সরাসরি বাজারের তথ্য দ্রুত যাচাই করা হয়।
          </p>
        )}
        <button
          onClick={() => setSubmitted(false)}
          className="mt-8 px-8 py-3 bg-[#064E3B] text-white rounded-xl font-bold hover:bg-[#043d2e] transition-colors shadow-lg"
        >
          আরেকটি দাম যোগ করুন
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="glass-card p-6 text-center">
        <h1 className="text-2xl font-bold text-[#064E3B] mb-2">দাম যোগ করুন</h1>
        <p className="text-sm text-slate-500">কমিউনিটিকে সঠিক দাম জানতে সাহায্য করুন</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Market & Product Selection */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5" />
                বাজার নির্বাচন করুন
              </label>
              <select
                name="bazar_id"
                value={formData.bazar_id}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 appearance-none"
              >
                <option value="">বাজার নির্বাচন করুন</option>
                {AREAS.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                পণ্য নির্বাচন করুন
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 appearance-none"
              >
                <option value="">পণ্য নির্বাচন করুন</option>
                {PRODUCTS.map(product => (
                  <option key={product.id} value={product.id}>{product.name} ({product.unit})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price Entry */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              বর্তমান দাম (টাকা)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-num text-xl font-bold">৳</span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="1"
                step="0.01"
                placeholder="0.00"
                className="w-full h-16 pl-10 pr-4 rounded-xl border border-slate-200 bg-white/50 text-[#064E3B] font-num text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
              />
            </div>
          </div>
        </div>

        {/* Verification Options */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#064E3B] mb-2">যাচাইকরণের তথ্য</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">
                আপনি কীভাবে দামটি জেনেছেন?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.visit_type === 'direct'
                    ? 'border-[#10B981] bg-emerald-50/30 text-[#064E3B]'
                    : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="visit_type"
                    value="direct"
                    checked={formData.visit_type === 'direct'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">সরাসরি বাজার</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  formData.visit_type === 'online'
                    ? 'border-[#10B981] bg-emerald-50/30 text-[#064E3B]'
                    : 'border-slate-200 bg-white/50 text-slate-500 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="visit_type"
                    value="online"
                    checked={formData.visit_type === 'online'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm font-medium">অনলাইন/অন্যান্য</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1.5">
                <Camera className="w-3.5 h-3.5" />
                ছবি যোগ করুন (ঐচ্ছিক)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white/30 hover:bg-white/50 transition-colors cursor-pointer">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600">ক্লিক করে ছবি আপলোড করুন</span>
                <span className="text-xs text-slate-400 mt-1">দোকানের বা পণ্যের ছবি (Max 5MB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full glass-pill !rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#043d2e] text-white p-4 flex items-center justify-center gap-2 shadow-[0_12px_32px_rgba(6,78,59,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="font-medium">পাঠানো হচ্ছে...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium text-lg">দাম নিশ্চিত করুন</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
