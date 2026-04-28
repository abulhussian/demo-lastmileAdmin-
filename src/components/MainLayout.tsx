import React from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search, User } from 'lucide-react';
import { useLogistics } from '../contexts/LogisticsContext';

export const MainLayout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { currentUser } = useLogistics();

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            <div className="hidden md:flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Search size={14} className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Find orders..." 
                className="bg-transparent border-none outline-none text-[13px] w-64 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-100 mx-1"></div>
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
              {currentUser?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
