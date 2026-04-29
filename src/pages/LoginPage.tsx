import React, { useState } from 'react';
import { useLogistics } from '../contexts/LogisticsContext';
import { LogIn, Truck, Building2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_USERS, MOCK_DRIVERS } from '../lib/mockData';

export const LoginPage: React.FC = () => {
  const { login } = useLogistics();
  
const allUsers = MOCK_USERS.filter(user => user.role !== 'DRIVER');
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-600/20 mb-4">
            LF
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LogiFlow</h1>
          <p className="text-slate-400 mt-2">Enterprise Logistics Platform</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-center px-4">
            Select an account to login as
          </p>
          
          <div className="grid gap-3">
            {allUsers.map((user) => (
              <button
                key={user.email}
                onClick={() => login(user.email)}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  {user.role === 'ADMIN' && <ShieldCheck size={20} />}
                  {user.role === 'CLIENT' && <Building2 size={20} />}
                  {user.role === 'DRIVER' && <Truck size={20} />}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{user.name}</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">{user.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built for high-performance last mile operations.
          <br />© 2026 LogiFlow Solutions Inc.
        </p>
      </motion.div>
    </div>
  );
};
