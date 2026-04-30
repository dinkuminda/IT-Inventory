import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, LogIn, ShieldCheck, Laptop, Key, Users, Mail, Lock, UserPlus, User, Eye, EyeOff } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
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
            <p className="font-normal opacity-90">Please ensure <code className="bg-black/10 px-1 rounded">VITE_SUPABASE_PUBLIC_KEY</code> in your Secrets is set to your Supabase <code className="bg-black/10 px-1 rounded">anon</code> <code className="bg-black/10 px-1 rounded">public</code> key.</p>
          </div>
        );
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError(
          <div>
            <p className="font-bold mb-1">Invalid Credentials</p>
            <p className="font-normal opacity-90 text-[10px]">Please double-check your email and password. If you just had your account enabled, ensure you are using the initial password provided by your administrator.</p>
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-neutral-200 border border-neutral-200 p-10 text-center"
      >
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">ICS IT Admin Directorate</h1>
        <p className="text-neutral-500 font-medium mb-8">Inventory Management System</p>

        <div className="flex bg-neutral-100 p-1 rounded-2xl mb-8">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={cn(
              "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
              isLogin ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={cn(
              "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
              !isLogin ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-sans"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                required
                type="email"
                placeholder="admin@assetflow.com"
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-sans"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                required
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-neutral-900 text-white py-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-neutral-100 flex items-center justify-center gap-2 text-neutral-400">
          <ShieldCheck size={16} />
          <p className="text-xs font-bold uppercase tracking-widest">Enterprise Secure</p>
        </div>
      </motion.div>
    </div>
  );
}
