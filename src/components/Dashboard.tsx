import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Laptop, 
  Key, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  Package,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, isAdmin, profile } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*');
      
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*');
      
      if (assetsError) throw assetsError;
      if (licensesError) throw licensesError;

      setAssets(assetsData || []);
      setLicenses(licensesData || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      // Check for common Supabase errors
      if (err.message?.includes('API key')) {
        setError('Invalid Supabase API Key. Please check your VITE_SUPABASE_PUBLIC_KEY in the Secrets panel.');
      } else if (err.code === 'PGRST116' || err.message?.includes('relation "public.assets" does not exist') || err.message?.includes('schema cache')) {
        setError('Database tables missing. Please run the SQL setup script in your Supabase SQL Editor using the SCHEMA.sql file provided in this project.');
      } else if (err.message?.includes('recursion')) {
        setError('Database security policy error (infinite recursion). Please re-run the updated SCHEMA.sql in your Supabase SQL Editor to fix the RLS policies.');
      } else {
        setError(err.message || 'An unexpected error occurred while fetching dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to changes
    const assetsChannel = supabase.channel('dashboard-assets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchData)
      .subscribe();
      
    const licensesChannel = supabase.channel('dashboard-licenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(licensesChannel);
    };
  }, []);

  const userEmail = profile?.email || user?.email;
  const myAssets = assets.filter(a => a.assignedTo && userEmail && a.assignedTo.trim().toLowerCase() === userEmail.trim().toLowerCase());
  const myLicenses = licenses.filter(l => l.assignedTo && userEmail && l.assignedTo.trim().toLowerCase() === userEmail.trim().toLowerCase());
  const myPending = myAssets.filter(a => a.approvalStatus === 'Pending');
  const myApproved = myAssets.filter(a => a.approvalStatus === 'Approved');
  const myRejected = myAssets.filter(a => a.approvalStatus === 'Rejected');

  const adminStats = [
    { 
      label: 'Total Assets', 
      value: assets.length, 
      icon: Laptop, 
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true
    },
    { 
      label: 'Software Licenses', 
      value: licenses.length, 
      icon: Key, 
      color: 'bg-purple-500',
      trend: '+3',
      trendUp: true
    },
    { 
      label: 'In Stock Hardware', 
      value: assets.filter(a => a.status === 'In Stock').length, 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      trend: '-2',
      trendUp: false
    },
    { 
      label: 'Pending Approvals', 
      value: assets.filter(a => a.approvalStatus === 'Pending').length, 
      icon: Clock, 
      color: 'bg-amber-500',
      trend: assets.filter(a => a.approvalStatus === 'Pending').length > 0 ? 'Action Required' : 'All Clear',
      trendUp: assets.filter(a => a.approvalStatus === 'Pending').length > 0 ? false : null
    },
  ];

  const employeeStats = [
    { 
      label: 'My Assets', 
      value: myAssets.length, 
      icon: Laptop, 
      color: 'bg-blue-500',
      trend: 'Hardware',
      trendUp: true
    },
    { 
      label: 'My Licenses', 
      value: myLicenses.length, 
      icon: Key, 
      color: 'bg-indigo-500',
      trend: 'Software',
      trendUp: true
    },
    { 
      label: 'Pending Approval', 
      value: myPending.length, 
      icon: Clock, 
      color: 'bg-amber-500',
      trend: 'Waiting',
      trendUp: null
    },
    { 
      label: 'Rejected Requests', 
      value: myRejected.length, 
      icon: XCircle, 
      color: 'bg-red-500',
      trend: 'Review',
      trendUp: false
    },
  ];

  const stats = isAdmin ? adminStats : employeeStats;

  const assetTypeData = [
    { name: 'Laptop', value: (isAdmin ? assets : myAssets).filter(a => a.type === 'Laptop').length },
    { name: 'Monitor', value: (isAdmin ? assets : myAssets).filter(a => a.type === 'Monitor').length },
    { name: 'Network', value: (isAdmin ? assets : myAssets).filter(a => a.type === 'Network Device').length },
    { name: 'Mobile', value: (isAdmin ? assets : myAssets).filter(a => a.type === 'Mobile').length },
    { name: 'Other', value: (isAdmin ? assets : myAssets).filter(a => a.type === 'Other' || a.type === 'Peripheral' || a.type === 'Desktop').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#141414', '#404040', '#737373', '#A3A3A3', '#D4D4D4'];

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center p-8 bg-red-50 border border-red-100 rounded-3xl text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-900 mb-2">Connection Error</h3>
        <p className="text-red-700 max-w-md mb-6">{error}</p>
        <button 
          onClick={() => fetchData()}
          className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Welcome back, {profile?.displayName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-neutral-500">
            {isAdmin 
              ? "Here's the global overview of your organization's IT inventory." 
              : "Here's a summary of your assigned assets and pending requests."}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-xl font-bold">
              {profile?.displayName?.charAt(0) || profile?.email?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{profile?.displayName}</p>
              <p className="text-xs text-neutral-500">{profile?.department || 'Employee'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl text-white", stat.color)}>
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
                  stat.trendUp === true ? "bg-green-50 text-green-700" : 
                  stat.trendUp === false ? "bg-red-50 text-red-700" : 
                  "bg-neutral-50 text-neutral-500"
                )}>
                  {stat.trendUp === true && <ArrowUpRight size={10} />}
                  {stat.trendUp === false && <ArrowDownRight size={10} />}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {assetTypeData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold tracking-tight">
                  {isAdmin ? 'Asset Distribution' : 'My Asset Breakdown'}
                </h3>
                <p className="text-sm text-neutral-500">
                  {isAdmin ? 'Inventory breakdown by category' : 'Categories of assets assigned to you'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                <Clock size={14} />
                Real-time
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#141414" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold tracking-tight mb-2">Category Share</h3>
            <p className="text-sm text-neutral-500 mb-8">Visual breakdown</p>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {assetTypeData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm font-medium text-neutral-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border border-neutral-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="text-neutral-300" size={32} />
          </div>
          <h3 className="text-lg font-bold tracking-tight">No assets to display</h3>
          <p className="text-sm text-neutral-500 max-w-xs mx-auto mt-1">
            {isAdmin 
              ? "The inventory is currently empty. Start by adding some assets." 
              : "You don't have any assets assigned to you yet."}
          </p>
        </div>
      )}
    </div>
  );
}
