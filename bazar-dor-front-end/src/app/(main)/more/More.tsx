'use client';

import React, { useState } from 'react';
import { User, Trophy, BarChart2, ChevronRight, LogOut, Settings, HelpCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function More() {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    console.log("Logging out...");
    setShowLogoutConfirm(false);
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-24">
      <div className="text-center mb-8">
        <h1 className="text-hero text-text-primary mb-3">More</h1>
      </div>

      <div className="surface-1 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary relative z-10 border-4 border-white shadow-sm">
            <User className="w-8 h-8" strokeWidth={2} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-text-primary mb-1.5">Rahim Uddin</h2>
            <span className="inline-flex items-center gap-1 bg-status-success-soft text-status-verified text-xs px-2 py-0.5 rounded-full font-bold">
              <Shield className="w-3.5 h-3.5" strokeWidth={2} /> Mirpur Price Captain
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <Link href="/profile" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <User className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-medium text-text-primary text-base">My Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </Link>

          <Link href="/ranking" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <BarChart2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-medium text-text-primary text-base">Market Ranking</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <div className="surface-1 overflow-hidden">
        <div className="divide-y divide-gray-100">
          <Link href="/settings" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary">
                <Settings className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-medium text-text-primary text-base">Settings</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </Link>

          <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary">
                <HelpCircle className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-medium text-text-primary text-base">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={2} />
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                <LogOut className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="font-medium text-red-500 text-base">Log Out</span>
            </div>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-red-600" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Log Out</h3>
              <p className="text-sm text-text-secondary mb-6">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-text-primary rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
