import React, { useEffect, useState } from 'react';
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
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [assets, setAssets] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, licensesRes] = await Promise.all([
          fetch('/api/assets'),
          fetch('/api/licenses')
        ]);
        
        if (!assetsRes.ok || !licensesRes.ok) {
          throw new Error(`Server returned error: Assets: ${assetsRes.status}, Licenses: ${licensesRes.status}`);
        }

        const assetsData = await assetsRes.json();
        const licensesData = await licensesRes.json();
        
        setAssets(assetsData);
        setLicenses(licensesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  const stats = [
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
      label: 'Under Repair', 
      value: assets.filter(a => a.status === 'Under Repair').length, 
      icon: AlertCircle, 
      color: 'bg-amber-500',
      trend: 'Stable',
      trendUp: null
    },
    { 
      label: 'Pending Approvals', 
      value: assets.filter(a => a.approvalStatus === 'Pending').length, 
      icon: Clock, 
      color: 'bg-neutral-500',
      trend: assets.filter(a => a.approvalStatus === 'Pending').length > 0 ? 'Action Required' : 'All Clear',
      trendUp: assets.filter(a => a.approvalStatus === 'Pending').length > 0 ? false : null
    },
  ];

  const assetTypeData = [
    { name: 'Laptop', value: assets.filter(a => a.type === 'Laptop').length },
    { name: 'Monitor', value: assets.filter(a => a.type === 'Monitor').length },
    { name: 'Network', value: assets.filter(a => a.type === 'Network Device').length },
    { name: 'Mobile', value: assets.filter(a => a.type === 'Mobile').length },
    { name: 'Other', value: assets.filter(a => a.type === 'Other' || a.type === 'Peripheral' || a.type === 'Desktop').length },
  ];

  const COLORS = ['#141414', '#404040', '#737373', '#A3A3A3', '#D4D4D4'];

  return (
    <div className="space-y-8">
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
              {stat.trendUp !== null && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.trendUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                  {stat.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className="text-neutral-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Asset Distribution</h3>
              <p className="text-sm text-neutral-500">Inventory breakdown by category</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <Clock size={14} />
              Updated Just Now
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
          <h3 className="text-lg font-bold tracking-tight mb-2">Status Overview</h3>
          <p className="text-sm text-neutral-500 mb-8">Current operational status</p>
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
    </div>
  );
}
