import React from 'react';
import { Sidebar } from './Sidebar';
import { Bell, CheckCircle, AlertCircle, X, Banknote, Truck, Shield, Calendar } from 'lucide-react';
import { useLogistics } from '../contexts/LogisticsContext';
import { cn } from '../lib/utils';

const getIcon = (type) => {
  switch (type) {
    case 'delivery': return CheckCircle;
    case 'billing': return Banknote;
    case 'driver': return Truck;
    case 'assignment': return Calendar;
    case 'system':
    default: return Shield;
  }
};

const getBgClass = (type) => {
  switch (type) {
    case 'delivery': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
    case 'billing': return 'bg-indigo-50 border-indigo-100 text-indigo-600';
    case 'driver': return 'bg-sky-50 border-sky-100 text-sky-600';
    case 'assignment': return 'bg-amber-50 border-amber-100 text-amber-600';
    case 'system':
    default: return 'bg-rose-50 border-rose-100 text-rose-600';
  }
};

export const MainLayout = ({ children, title }) => {
  const { 
    currentUser, toast, showToast, 
    notifications = [], unreadNotificationsCount = 0, 
    markNotificationAsRead, markAllNotificationsAsRead 
  } = useLogistics();
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);

  const unreadCount = unreadNotificationsCount;

  const toggleRead = (id) => {
    markNotificationAsRead(id);
  };

  const markAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const clearAll = () => {
    markAllNotificationsAsRead();
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-indigo-600 text-white text-[9px] font-extrabold flex items-center justify-center px-1 rounded-full border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-slate-100 mx-1"></div>
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Backdrop Overlay for Drawer */}
      {isNotificationOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsNotificationOpen(false)}
        />
      )}

      {/* Slide-out Notification Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-slate-200 z-50 transform transition-transform duration-300 ease-out flex flex-col",
        isNotificationOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{unreadCount} unread alerts</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline px-2 py-1 rounded transition-colors"
              >
                Mark read
              </button>
            )}
            <button 
              onClick={() => setIsNotificationOpen(false)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors border border-transparent hover:border-slate-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              const Icon = getIcon(notif.type);
              const bgClass = getBgClass(notif.type);
              return (
                <div 
                  key={notif.id} 
                  onClick={() => toggleRead(notif.id)}
                  className={cn(
                    "p-5 flex gap-4 cursor-pointer transition-colors duration-200 hover:bg-slate-50/80 relative group",
                    !notif.read && "bg-indigo-50/20"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs transition-transform group-hover:scale-105 duration-200", bgClass)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={cn("text-sm text-slate-800 leading-snug", !notif.read ? "font-bold" : "font-medium")}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                      {notif.time}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-300 mb-4 transition-transform hover:scale-110 duration-300">
                <Bell size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">All caught up!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] font-medium leading-relaxed">
                You have no notifications. We'll let you know when new alerts arrive.
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            <button 
              onClick={clearAll}
              className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              Clear All
            </button>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
            >
              Close Panel
            </button>
          </div>
        )}
      </div>

      {/* Global Toast Notification - Top Left */}
      {toast.show && (
        <div className={cn(
          "fixed top-6 left-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-left-10 duration-300",
          toast.type === 'success' 
            ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
            : "bg-rose-50 border-rose-100 text-rose-800"
        )}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
          <p className="text-sm font-bold">{toast.message}</p>
          <button 
            onClick={() => showToast('', 'success')} // This will hide it since message is empty
            className="ml-4 p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
