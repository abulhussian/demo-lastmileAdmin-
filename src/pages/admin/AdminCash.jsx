import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { KPICard } from '../../components/Cards';
import { Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle2, History, AlertCircle, CheckCircle, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

export const AdminCash = () => {
  const { drivers, settlements, settleDriverCash, showToast } = useLogistics();

  const totalCashInHand = drivers.reduce((sum, d) => sum + d.cashInHand, 0);
  const totalSettledToday = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <MainLayout title="Cash Settlement Management">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <KPICard 
          title="Total Cash Flowing with Drivers" 
          value={totalCashInHand} 
          icon={Wallet} 
          isCurrency 
          className="border-amber-200 bg-amber-50 shadow-sm transition-all"
        />
        <KPICard 
          title="Consolidated Today" 
          value={totalSettledToday} 
          icon={ArrowDownCircle} 
          isCurrency 
          className="border-emerald-200 bg-emerald-50 shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Settlement Log */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History size={18} className="text-indigo-500" />
              Settlement History
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Last 24 Hours</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {settlements.length > 0 ? settlements.map((log) => {
              return (
                <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ArrowDownCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{log.driverName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{formatDate(log.date)} • Admin Collection</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">+{formatCurrency(log.amount)}</p>
                    <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">{log.status}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 animate-pulse">
                   <History size={32} />
                </div>
                <p className="text-sm font-medium text-slate-400">No settle entries yet today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Settlments */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-amber-500" />
              Pending Driver Consolidation
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {drivers.filter(d => d.cashInHand > 0).map((driver) => (
              <div key={driver.id} className="p-6 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{driver.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{driver.vehicleNumber}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-base font-bold text-amber-600">{formatCurrency(driver.cashInHand)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">In Hand</p>
                  </div>
                  <button 
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                    onClick={async () => {
                      if (confirm(`Collect ${formatCurrency(driver.cashInHand)} from ${driver.name}?`)) {
                        try {
                          await settleDriverCash(driver.id, driver.cashInHand);
                          showToast(`Successfully collected ${formatCurrency(driver.cashInHand)} from ${driver.name}`);
                        } catch (err) {
                          showToast(err.message || 'Failed to settle cash', 'error');
                        }
                      }
                    }}
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))}
            {drivers.filter(d => d.cashInHand > 0).length === 0 && (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">All Cash Settled</h4>
                <p className="text-xs text-slate-500 font-medium">All driver cash has been consolidated successfully.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
