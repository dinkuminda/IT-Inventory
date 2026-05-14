import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../supabaseClient';
import { Package, LogIn, ShieldCheck, Laptop, Key, Users, Mail, Lock, UserPlus, User, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Login() {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-[#10214a] rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        setError(
          <div className="text-left space-y-2">
            <p className="font-bold">Supabase Not Configured</p>
            <p className="text-xs font-normal opacity-90">
              Please set your <code className="bg-black/10 px-1 rounded mx-1">VITE_SUPABASE_URL</code> and 
              <code className="bg-black/10 px-1 rounded mx-1">VITE_SUPABASE_PUBLIC_KEY</code> in the 
              **Secrets** panel in AI Studio.
            </p>
          </div>
        );
        setIsSubmitting(false);
        return;
      }

      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
    } catch (err: any) {
      if (err.message?.includes('API key') || err.message?.includes('apiKey') || err.message?.includes('invalid')) {
        setError(
          <div>
            <p className="font-bold mb-1">Invalid API Key</p>
            <p className="font-normal opacity-90 text-[10px]">Please ensure <code className="bg-black/10 px-1 rounded">VITE_SUPABASE_PUBLIC_KEY</code> is correctly set.</p>
          </div>
        );
      } else if (err.message?.toLowerCase().includes('failed to fetch')) {
        setError(
          <div>
            <p className="font-bold mb-1">Connection Error</p>
            <p className="font-normal opacity-90 text-[10px]">Failed to connect to Supabase. Please ensure your <code className="bg-black/10 px-1 rounded">VITE_SUPABASE_URL</code> is correct and that your network allows connections to Supabase.</p>
          </div>
        );
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e2e8f0] p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white shadow-2xl rounded-[1rem] overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Form */}
        <div className="w-full md:w-3/5 p-8 md:p-12 bg-[#f8fafc] flex flex-col justify-between relative">
          <div>
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-2xl font-bold text-slate-500 mb-1">Login To</h1>
              <p className="text-sm font-semibold text-slate-500 opacity-80 uppercase tracking-tight">
                Immigration and Citizenship Service System
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1 w-full space-y-6">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 ml-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10214a]/20 focus:border-[#10214a] transition-all text-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Username *</label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10214a]/20 focus:border-[#10214a] transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-600 ml-1">Password *</label>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10214a]/20 focus:border-[#10214a] transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                  >
                    <Laptop size={16} /> {/* Using laptop icon as fallback for the special icon in image */}
                  </button>
                </div>

                {error && (
                  <div className="text-[11px] text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#10214a] text-white py-2.5 rounded-full font-bold hover:bg-[#0c1a3b] transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-lg shadow-blue-900/20"
                  >
                    {isSubmitting ? 'Authenticating...' : (isLogin ? 'Log In' : 'Sign Up')}
                  </button>
                </div>

                <div className="pt-2 text-center md:text-left">
                  <button 
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-xs font-bold text-slate-500 hover:text-[#10214a] transition-colors"
                  >
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                  </button>
                </div>
              </div>

              {/* Fingerprint Mock Area */}
              <div className="hidden lg:flex flex-col items-center gap-2 p-6 bg-slate-100 rounded-xl border border-slate-200">
                <div className="flex justify-between w-full mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fingerprint</span>
                  <RefreshCw size={12} className="text-slate-400 cursor-pointer" />
                </div>
                <div className="w-24 h-32 bg-white rounded-lg border border-slate-200 flex items-center justify-center mb-2">
                  <ShieldCheck size={48} className="text-slate-200" />
                </div>
                <button type="button" className="w-full py-1.5 px-4 bg-[#10214a] text-white text-[10px] font-bold rounded-full uppercase tracking-widest hover:opacity-90">
                  Scan
                </button>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="mode" className="w-3 h-3 accent-[#10214a]" defaultChecked />
                    <span className="text-[9px] font-bold text-slate-500">Single</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="mode" className="w-3 h-3 accent-[#10214a]" />
                    <span className="text-[9px] font-bold text-slate-500">Stay</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-slate-400">
            <p className="text-[10px] font-bold">V1.0.0-PRODUCTION-General</p>
          </div>
        </div>

        {/* Right Side - Navy Branding */}
        <div className="w-full md:w-2/5 bg-[#10214a] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Subtle pattern or Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="z-10"
          >
            {/* Logo Group */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ShieldCheck size={120} className="text-white opacity-80" strokeWidth={1} />
                {/* Overlaying a fingerprint feel */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <LogIn size={40} className="text-white ml-2" />
                </div>
              </div>
              <h2 className="text-7xl font-bold text-white tracking-tighter mt-2">ICS</h2>
              <div className="space-y-1">
                <p className="text-2xl font-normal text-white leading-tight font-serif" style={{ fontFamily: 'noto-sans-ethiopi' }}>
                  የኢሚግሬሽንና ዜግነት አገልግሎት
                </p>
                <p className="text-sm font-medium text-white/70 uppercase tracking-[0.2em] mt-2">
                  IMMIGRATION AND CITIZENSHIP SERVICE
                </p>
              </div>
            </div>
          </motion.div>

          <div className="absolute bottom-6 left-0 right-0 opacity-20 transform scale-150 -z-0">
             {/* Large background decorative logo can be added here if needed */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
