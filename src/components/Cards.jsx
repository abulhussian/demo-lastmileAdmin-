import React from 'react';
import { cn, formatCurrency } from '../lib/utils';

export const KPICard = ({ 
  title, value, icon: Icon, trend, className, isCurrency, currencyCode 
}) => {
  return (
    <div className={cn("p-6 bg-white rounded-[16px] border border-slate-200 shadow-sm transition-all hover:scale-[1.01]", className)}>
      <div className="flex flex-col">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-2xl font-extrabold text-slate-900">
            {isCurrency && typeof value === 'number' ? formatCurrency(value, currencyCode) : value}
          </h3>
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
            <Icon size={18} />
          </div>
        </div>
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded",
            trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
        </div>
      )}
    </div>
  );
};

export const StatusBadge = ({ status, className }) => {
  const getColors = () => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PICKED_UP': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'IN_TRANSIT': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'PAID': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UNPAID': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'OVERDUE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'INACTIVE': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-100';
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      getColors(),
      className
    )}>
      {status.replace('_', ' ')}
    </span>
  );
};
