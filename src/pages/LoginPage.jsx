import React, { useState } from 'react';
import { useLogistics } from '../contexts/LogisticsContext';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const { login } = useLogistics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    }
  };
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
            LM
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Last Mile</h1>
          <p className="text-slate-400 mt-2">Enterprise Logistics Platform</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-center px-4">
            Enter your credentials to login
          </p>

          <div className="grid gap-3">
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-all"
              >
                Login
              </button>
            </div>
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
