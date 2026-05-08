'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface ToastAlert {
  id: string;
  alertId?: string;
  type: string;
  severity: string;
  message: string;
  messageBn: string;
}

const severityColor: Record<string, string> = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-blue-500',
};

export function AlertToast() {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useSocket('alert:new', (data: ToastAlert) => {
    const id = data.alertId || Date.now().toString();
    const toast = { ...data, id };
    setToasts(prev => [toast, ...prev].slice(0, 3));
    setTimeout(() => dismiss(id), 8000);
  });

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <div key={toast.id}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-start gap-3 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${severityColor[toast.severity] || 'bg-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-rose-700 mb-0.5">⚠️ নতুন এলার্ট</p>
            <p className="text-sm font-medium text-slate-800 leading-snug">{toast.messageBn || toast.message}</p>
          </div>
          <button onClick={() => dismiss(toast.id)}
            className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
