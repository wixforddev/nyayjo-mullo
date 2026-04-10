'use client';

import { useState } from 'react';
import { ArrowRight, Search, Plus, ArrowLeft, Clock, ChefHat, CheckCircle2, Circle } from 'lucide-react';

const INITIAL_INGREDIENTS = [
  'মুরগি', 'গরুর মাংস', 'মাছ', 'ডিম', 'আলু', 'পেঁয়াজ', 'টমেটো', 'কাঁচা মরিচ', 'রসুন', 'আদা', 'ধনে পাতা', 'গাজর', 'ক্যাপসিকাম'
];

const RECIPES = [
  {
    id: 1,
    name: 'মুরগির কষা মাংস',
    time: '৩০ মিনিট',
    difficulty: 'সহজ',
    match: 80,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop',
    ingredients: ['মুরগি', 'পেঁয়াজ', 'টমেটো', 'রসুন', 'আদা', 'কাঁচা মরিচ', 'তেল', 'মসলা'],
    steps: [
      'প্যানে তেল গরম করে পেঁয়াজ কুচি সোনালী করে ভেজে নিন।',
      'রসুন ও আদা বাটা দিয়ে ২ মিনিট কষান।',
      'টমেটো কুচি ও মসলা দিয়ে তেল উপরে ওঠা পর্যন্ত কষান।',
      'মুরগির টুকরো দিয়ে ভালোভাবে মিশিয়ে ১৫ মিনিট ঢেকে রান্না করুন।',
      'প্রয়োজনমতো পানি দিয়ে আরও ১০ মিনিট রান্না করুন।',
      'কাঁচা মরিচ দিয়ে নামিয়ে নিন।'
    ]
  },
  {
    id: 2,
    name: 'ডিম আলুর ডালনা',
    time: '২০ মিনিট',
    difficulty: 'সহজ',
    match: 100,
    image: 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?q=80&w=600&auto=format&fit=crop',
    ingredients: ['ডিম', 'আলু', 'পেঁয়াজ', 'টমেটো', 'কাঁচা মরিচ', 'তেল', 'মসলা'],
    steps: [
      'ডিম ও আলু সেদ্ধ করে খোসা ছাড়িয়ে নিন।',
      'ডিমগুলো হালকা হলুদ দিয়ে তেলে ভেজে নিন।',
      'একই তেলে পেঁয়াজ কুচি ভেজে টমেটো ও মসলা দিয়ে কষান।',
      'সেদ্ধ আলু ও ভাজা ডিম দিয়ে ভালোভাবে মিশিয়ে নিন।',
      'পরিমাণমতো পানি দিয়ে ৫-৭ মিনিট ঢেকে রান্না করুন।'
    ]
  },
  {
    id: 3,
    name: 'মিক্সড সবজি ভাজি',
    time: '১৫ মিনিট',
    difficulty: 'মাঝারি',
    match: 60,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
    ingredients: ['আলু', 'গাজর', 'ক্যাপসিকাম', 'পেঁয়াজ', 'কাঁচা মরিচ', 'তেল', 'লবণ'],
    steps: [
      'সবজিগুলো একই আকারে কেটে নিন।',
      'প্যানে তেল গরম করে পেঁয়াজ ও কাঁচা মরিচ হালকা ভেজে নিন।',
      'সবজিগুলো দিয়ে মাঝারি আঁচে ভাজতে থাকুন।',
      'লবণ দিয়ে ঢেকে ৫ মিনিট রান্না করুন।',
      'সবজি সেদ্ধ হলে নামিয়ে পরিবেশন করুন।'
    ]
  }
];

export function FoodRescue() {
  const [ingredients, setIngredients] = useState<string[]>(INITIAL_INGREDIENTS);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<typeof RECIPES[0] | null>(null);

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newIng = inputValue.trim();
      if (!ingredients.includes(newIng)) {
        setIngredients(prev => [newIng, ...prev]);
      }
      if (!selectedIngredients.includes(newIng)) {
        setSelectedIngredients(prev => [...prev, newIng]);
      }
      setInputValue('');
    }
  };

  if (selectedRecipe) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedRecipe(null)}
            className="p-2 glass-pill hover:bg-white/50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <h2 className="text-xl font-bold text-[#064E3B]">রেসিপি বিস্তারিত</h2>
        </div>

        <div className="glass-card overflow-hidden rounded-[24px]">
          <div className="relative h-64 w-full">
            <img src={selectedRecipe.image} alt={selectedRecipe.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h1 className="text-3xl font-bold text-white mb-3 leading-tight">{selectedRecipe.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                  <Clock className="w-4 h-4" /> {selectedRecipe.time}
                </span>
                <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                  <ChefHat className="w-4 h-4" /> {selectedRecipe.difficulty}
                </span>
                <span className="flex items-center gap-1.5 bg-[#10B981]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20 font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> {selectedRecipe.match}% মিলেছে
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-[#064E3B] mb-4 border-b border-black/[0.04] pb-3">প্রয়োজনীয় উপাদান</h3>
          <ul className="space-y-3">
            {selectedRecipe.ingredients.map((ing, idx) => {
              const hasIngredient = selectedIngredients.includes(ing) || ['তেল', 'মসলা', 'লবণ', 'পানি'].includes(ing);
              return (
                <li key={idx} className="flex items-center gap-3">
                  {hasIngredient ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" strokeWidth={2} />
                  )}
                  <span className={`text-base font-medium ${hasIngredient ? 'text-[#064E3B]' : 'text-slate-500'}`}>
                    {ing}
                  </span>
                  {!hasIngredient && (
                    <span className="ml-auto text-[10px] font-bold text-[#F43F5E] bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                      মিসিং
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-[#064E3B] mb-4 border-b border-black/[0.04] pb-3">প্রস্তুত প্রণালী</h3>
          <div className="space-y-5">
            {selectedRecipe.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-7 h-7 shrink-0 bg-[#10B981]/15 text-[#064E3B] rounded-full flex items-center justify-center text-sm font-bold font-num mt-0.5 border border-[#10B981]/30">
                  {idx + 1}
                </div>
                <p className="text-slate-600 leading-relaxed font-medium pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#064E3B] mb-2">আপনার কাছে কী কী আছে?</h2>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleAddIngredient}
            placeholder="উপাদান খুঁজুন বা যোগ করুন (Enter চাপুন)..."
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-black/[0.04] bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 transition-all text-slate-700"
          />
          {inputValue && (
            <button
              onClick={() => handleAddIngredient({ key: 'Enter', preventDefault: () => {} } as any)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#10B981]/10 text-[#10B981] rounded-lg hover:bg-[#10B981]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {ingredients.map(ing => {
            const isSelected = selectedIngredients.includes(ing);
            return (
              <button
                key={ing}
                onClick={() => toggleIngredient(ing)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  isSelected
                    ? 'bg-[#10B981]/15 border-[#10B981]/30 text-[#064E3B]'
                    : 'bg-white/50 border-black/[0.04] text-slate-600 hover:bg-white/80'
                }`}
              >
                {isSelected ? '✓' : '+'} {ing}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RECIPES.map(recipe => (
          <div
            key={recipe.id}
            onClick={() => setSelectedRecipe(recipe)}
            className="glass-card overflow-hidden flex flex-col rounded-[20px] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer group"
          >
            <div className="relative h-40 w-full overflow-hidden">
              <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-white/90 backdrop-blur-sm text-[#064E3B] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  ⏳ {recipe.time}
                </span>
                <span className="bg-white/90 backdrop-blur-sm text-[#064E3B] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  🔥 {recipe.difficulty}
                </span>
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1 bg-white/40">
              <h3 className="text-lg font-bold text-[#064E3B] mb-3">{recipe.name}</h3>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-slate-200" />
                      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-[#10B981]" strokeDasharray="87.9" strokeDashoffset={87.9 * (1 - recipe.match / 100)} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[9px] font-num font-bold text-[#064E3B]">{recipe.match}%</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 leading-tight">উপাদান<br/>মিলেছে</span>
                </div>
                <button className="w-8 h-8 rounded-full bg-[#064E3B] text-white flex items-center justify-center shadow-md hover:bg-[#043d2e] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
