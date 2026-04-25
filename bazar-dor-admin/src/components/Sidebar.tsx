import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Store, Tag, Bell, Users, LogOut, Activity, ChevronRight, BarChart2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

const nav = [
  { to: '/',         icon: LayoutDashboard, label: 'ড্যাশবোর্ড' },
  { to: '/products', icon: Package,         label: 'পণ্য' },
  { to: '/bazars',   icon: Store,           label: 'বাজার' },
  { to: '/prices',   icon: Tag,             label: 'দাম' },
  { to: '/alerts',   icon: Bell,            label: 'এলার্ট' },
  { to: '/users',        icon: Users,      label: 'ব্যবহারকারী' },
  { to: '/market-index', icon: BarChart2,  label: 'বাজার সূচক' },
];

export function Sidebar() {
  const user     = useAppSelector(s => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="w-64 shrink-0 bg-[#064E3B] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">বাজার দর</p>
            <p className="text-emerald-300 text-xs font-medium">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white text-[#064E3B] shadow-sm font-bold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }>
            <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span>{label}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-6 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center text-emerald-300 font-bold text-sm shrink-0">
            {user?.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-emerald-300/70 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all">
          <LogOut className="w-4 h-4" />
          <span>লগ আউট</span>
        </button>
      </div>
    </aside>
  );
}
