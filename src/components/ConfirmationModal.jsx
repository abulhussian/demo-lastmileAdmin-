import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", type = "danger" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              type === 'danger' ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
            )}>
              <AlertTriangle size={20} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
        </div>
        
        <div className="p-4 bg-slate-50 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95",
              type === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
