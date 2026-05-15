import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../supabaseClient';
import { Package, LogIn, ShieldCheck, Laptop, Key, Users, Mail, Lock, UserPlus, User, Eye, EyeOff, RefreshCw, Fingerprint } from 'lucide-react';
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
      if (err.message?.includes('API key') || err.message?.includes('apiKey')) {
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
      } else if (err.message?.toLowerCase().includes('invalid login credentials') || err.message?.toLowerCase().includes('invalid credentials') || err.message === 'Invalid login credentials') {
        setError(
          <div className="text-left">
            <p className="font-bold mb-1">Invalid login credentials</p>
            <p className="font-normal opacity-90 text-[10px]">The email or password you entered is incorrect. Please try again.</p>
          </div>
        );
      } else if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError(
          <div className="text-left">
            <p className="font-bold mb-1">Email not confirmed</p>
            <p className="font-normal opacity-90 text-[10px]">Please check your inbox and confirm your email address before signing in.</p>
          </div>
        );
      } else if (err.message?.toLowerCase().includes('user already registered')) {
        setError(
          <div className="text-left">
            <p className="font-bold mb-1">Account already exists</p>
            <p className="font-normal opacity-90 text-[10px]">This email is already registered. Please sign in instead.</p>
          </div>
        );
      } else if (err.message?.toLowerCase().includes('rate limit') || err.message?.toLowerCase().includes('too many requests')) {
        setError(
          <div className="text-left">
            <p className="font-bold mb-1">Too many attempts</p>
            <p className="font-normal opacity-90 text-[10px]">Please wait a moment before trying to sign in again.</p>
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
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl bg-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[600px]"
      >
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#0f172a] mb-2 leading-tight">
              {isLogin ? 'ITA Directorate Inventory' : 'Join ITA Directorate Inventory'}
            </h1>
            <p className="text-slate-500 font-medium mb-10 text-[15px]">
              {isLogin 
                ? 'Sign in to manage your organization\'s resources' 
                : 'Create an account to start managing your assets'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              {!isLogin && (
                <div className="space-y-1.5">
                  <input
                    required
                    type="text"
                    placeholder="Full Name"
                    className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[15px]"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[15px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>

              <div className="space-y-1.5 relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder="Password"
                  className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[15px]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-semibold text-[#1e40af] hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1e40af] text-white py-4 rounded-2xl font-bold hover:bg-[#1a3a9a] transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  isLogin ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            <div className="mt-8">
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[15px] font-semibold text-[#1e40af] hover:underline"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center md:justify-start gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              SYSTEM STATUS: ONLINE
            </div>
          </div>
        </div>

        {/* Right Side - Branding (Matching the latest Image) */}
        <div className="hidden md:flex w-1/2 bg-[#0a1e45] p-12 flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="z-10 w-full"
          >
            {/* Logo Group */}
            <div className="flex flex-col items-center gap-6">
              {/* Fingerprint as Logo */}
              <div className="relative">
                <div className="absolute -inset-4 bg-white/5 rounded-full blur-xl" />
                <Fingerprint size={160} className="text-[#3b82f6] opacity-90 relative" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center">
                   {/* This is a placeholder for the Ethiopia shape, but using icon for now */}
                </div>
              </div>
              
              <h2 className="text-8xl font-black text-white tracking-[0.1em] mt-4">ICS</h2>
              
              <div className="space-y-2 mt-4">
                <p className="text-3xl font-medium text-white leading-tight opacity-95">
                  የኢሚግሬሽንና የዜግነት አገልግሎት
                </p>
                
                <div className="w-full max-w-[280px] h-[1px] bg-white/20 mx-auto my-6" />
                
                <p className="text-base font-bold text-white/80 uppercase tracking-[0.2em] leading-relaxed">
                  IMMIGRATION AND CITIZENSHIP SERVICE
                </p>
              </div>
            </div>
          </motion.div>

          <div className="absolute bottom-6 right-8 text-white/10 font-bold text-xs uppercase tracking-widest">
            Authentication Module V1.0
          </div>
        </div>
      </motion.div>
    </div>
  );
}
