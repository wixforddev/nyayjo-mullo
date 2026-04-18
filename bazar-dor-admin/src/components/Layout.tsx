import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Loader2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';

export function Layout() {
  const { token, user } = useAppSelector(s => s.auth);

  // Still initializing from localStorage (very brief)
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#064E3B]" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
