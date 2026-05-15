import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './supabaseClient';
import { ShieldCheck, Package } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import LicenseList from './components/LicenseList';
import EmployeeList from './components/EmployeeList';
import Maintenance from './components/Maintenance';
import AuditLogs from './components/AuditLogs';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';

function AppContent() {
  const { user, profile, loading, error: authError } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <ShieldCheck size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Connection Error</h1>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">
            {authError}
          </p>
          <div className="bg-slate-50 p-5 rounded-2xl space-y-2 mb-8 text-left">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Troubleshooting:</p>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>Verify <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_URL</code> is correct</li>
              <li>Ensure your <code className="bg-slate-200 px-1 rounded">anon</code> public key is set</li>
              <li>Check your internet connection and DNS settings</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#1e40af] text-white py-4 rounded-2xl font-bold hover:bg-[#1a3a9a] transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#eef2ff] rounded-2xl flex items-center justify-center text-[#1e40af]">
              <Package size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Setup Required</h1>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed text-center">
            To start using <strong>ITA Directorate Inventory</strong>, please configure your Supabase credentials in the <strong>Secrets</strong> panel.
          </p>
          <div className="space-y-4 mb-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Environment Variable</span>
              <code className="text-sm font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">VITE_SUPABASE_URL</code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Environment Variable</span>
              <code className="text-sm font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">VITE_SUPABASE_PUBLIC_KEY</code>
            </div>
          </div>
          <p className="text-xs text-slate-400 italic text-center leading-relaxed">
            Note: You may need to restart the development server after updating secrets to apply changes.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profile?.needsPasswordChange) {
    return <ChangePassword />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'assets' && <AssetList />}
      {activeTab === 'licenses' && <LicenseList />}
      {activeTab === 'maintenance' && <Maintenance />}
      {activeTab === 'employees' && <EmployeeList />}
      {activeTab === 'logs' && <AuditLogs />}
      {activeTab === 'security' && <ChangePassword />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
