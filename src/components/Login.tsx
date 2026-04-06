import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Package, LogIn, ShieldCheck, Laptop, Key, Users, Mail, Lock, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, register, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
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
      if (isRegistering) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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
        <div className="w-24 h-24 bg-[#0047AB] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-neutral-200 overflow-hidden border border-neutral-100">
          <img 
            src="/image.png" 
            alt="ICS Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://media.licdn.com/dms/image/v2/D4D0BAQG_v_v_v_v_v/company-logo_200_200/company-logo_200_200/0/1630571000000?e=2147483647&v=beta&t=m6_v_v_v_v_v";
              target.parentElement!.style.backgroundColor = 'white';
              target.className = "w-full h-full object-contain p-2";
            }}
          />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">ICS IT Admin Directorate</h1>
        <p className="text-neutral-500 font-medium mb-8">Inventory Management System</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isRegistering && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Full Name</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
            ) : isRegistering ? (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="mt-6 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </button>

        <div className="mt-10 pt-8 border-t border-neutral-100 flex items-center justify-center gap-2 text-neutral-400">
          <ShieldCheck size={16} />
          <p className="text-xs font-bold uppercase tracking-widest">Enterprise Secure</p>
        </div>
      </motion.div>
    </div>
  );
}
