import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users, 
  Banknote, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { useLogistics } from '../contexts/LogisticsContext';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useLogistics();
  const isAdmin = currentUser?.role === 'ADMIN';

  const adminLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Orders', icon: Package, path: '/admin/orders' },
    { name: 'Drivers', icon: Truck, path: '/admin/drivers' },
    { name: 'Cash Flow', icon: Banknote, path: '/admin/cash' },
    { name: 'Billing', icon: FileText, path: '/admin/billing' },
    { name: 'Users', icon: Users, path: '/admin/users' },
  ];

  const clientLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/client' },
    { name: 'My Orders', icon: Package, path: '/client/orders' },
    { name: 'Invoices', icon: FileText, path: '/client/billing' },
    { name: 'My Profile', icon: UserCircle, path: '/client/profile' },
  ];

  const links = isAdmin ? adminLinks : clientLinks;
  const profilePath = isAdmin ? '/admin/profile' : '/client/profile';

  return (
    <div className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          LF
        </div>
        <span className="text-xl font-bold text-white tracking-tight">LogiFlow</span>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-sm font-medium",
              isActive 
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <link.icon size={18} className={cn("transition-colors", "group-hover:text-indigo-400")} />
            <span className="flex-1">{link.name}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <NavLink 
          to={profilePath}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
            isActive ? "bg-white/5 border border-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 uppercase text-xs font-bold text-slate-300">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 truncate lowercase">{currentUser?.role}</p>
          </div>
        </NavLink>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-sm transition-all border border-transparent hover:border-rose-500/20"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
