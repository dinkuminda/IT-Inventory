import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './supabaseClient';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import LicenseList from './components/LicenseList';
import UserList from './components/UserList';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-neutral-200">
          <h1 className="text-xl font-semibold text-neutral-900 mb-4">Configuration Required</h1>
          <p className="text-neutral-600 mb-6">
            Please set the following environment variables in the <strong>Secrets</strong> panel:
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex flex-col">
              <code className="text-xs font-mono bg-neutral-100 p-1.5 rounded text-neutral-800">VITE_SUPABASE_URL</code>
              <span className="text-[10px] text-neutral-400 mt-1">Project Settings {"->"} API {"->"} Project URL</span>
            </li>
            <li className="flex flex-col">
              <code className="text-xs font-mono bg-neutral-100 p-1.5 rounded text-neutral-800">VITE_SUPABASE_PUBLIC_KEY</code>
              <span className="text-[10px] text-neutral-400 mt-1">Project Settings {"->"} API {"->"} `anon` `public` key</span>
            </li>
          </ul>
          <p className="text-xs text-neutral-500 italic">
            Note: You may need to restart the development server after updating secrets.
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
      {activeTab === 'users' && <UserList />}
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
