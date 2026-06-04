import React, { useState } from 'react';
import { useLogistics } from '../contexts/LogisticsContext';
import { Eye, EyeOff, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const LoginPage = () => {
  const { login, verifyOtp } = useLogistics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.step2Required) {
        setStep('otp');
        setMessage(res.message || 'OTP sent to email');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOtp = async () => {
    setError('');
    setOtp('000000');
    setLoading(true);
    try {
      await verifyOtp(email, '000000');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await login(email, password);
      setMessage(res?.message || 'OTP resent successfully');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
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
          {step === 'credentials' ? (
            <>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-center px-4">
                Enter your credentials to login
              </p>

              <form onSubmit={handleLogin} className="grid gap-3">
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      required
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
                    <p className="text-red-400 text-sm text-center">{error}</p>
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
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : 'Login'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-center px-4">
                OTP Verification
              </p>

              <form onSubmit={handleVerifyOtp} className="grid gap-3">
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-400">
                      We've sent a verification code to
                    </p>
                    <p className="text-sm font-semibold text-white mt-1 break-all flex items-center justify-center gap-1">
                      <Mail size={14} className="text-indigo-400" /> {email}
                    </p>
                  </div>

                  {message && (
                    <p className="text-emerald-400 text-xs text-center font-medium bg-emerald-500/10 py-2 px-3 rounded-lg border border-emerald-500/20 animate-pulse">
                      {message}
                    </p>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Verification Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 text-center tracking-[0.5em] text-xl font-bold font-mono"
                        maxLength={6}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleDemoOtp}
                        disabled={loading}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Use Demo OTP (000000)
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Verify Code
                      </>
                    )}
                  </button>

                  <div className="flex justify-between items-center text-xs px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('credentials');
                        setError('');
                        setMessage('');
                      }}
                      className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={12} /> Back to Login
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built for high-performance last mile operations.
          <br />© 2026 LogiFlow Solutions Inc.
        </p>
      </motion.div>
    </div>
  );
};
