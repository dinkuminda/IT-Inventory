
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Shield, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function AuditLogs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, page, searchTerm]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*, profiles(displayName, email, role)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,entityType.ilike.%${searchTerm}%`);
      }

      const { data, count, error } = await query
        .order('createdAt', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500">
        <Shield size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h2>
        <p>Only administrators can view audit logs.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2">Audit Logs</h1>
          <p className="text-neutral-500 font-medium">Monitor system activities and data changes.</p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search actions or entities..." 
            className="pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl w-full sm:w-80 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Entity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Activity className="animate-spin mx-auto text-neutral-300 mb-2" size={24} />
                    <span className="text-sm font-medium text-neutral-400">Loading audit history...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <History className="mx-auto text-neutral-200 mb-2" size={32} />
                    <span className="text-sm font-medium text-neutral-400">No logs found matching your criteria.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-neutral-900">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 border border-neutral-200">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-900">
                            {log.profiles?.displayName || (log.userId === 'admin' ? 'System Admin' : 'System')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{log.profiles?.email || 'N/A'}</span>
                            {log.profiles?.role === 'admin' && (
                              <span className="px-1.5 py-0.5 bg-neutral-900 text-white rounded text-[8px] font-black uppercase tracking-widest">Admin</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
                        log.action.includes('Create') ? "bg-emerald-50 text-emerald-700" :
                        log.action.includes('Delete') ? "bg-rose-50 text-rose-700" :
                        log.action.includes('Update') ? "bg-amber-50 text-amber-700" :
                        "bg-neutral-100 text-neutral-600"
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Database size={12} className="text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-600">{log.entityType}</span>
                        {log.entityId && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-50 px-1.5 py-0.5 rounded">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-neutral-500 font-mono">
                        {JSON.stringify(log.details)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">
              Showing <span className="font-bold text-neutral-900">{(page - 1) * pageSize + 1}</span> to <span className="font-bold text-neutral-900">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-bold text-neutral-900">{totalCount}</span> logs
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-neutral-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-xl text-xs font-bold transition-all",
                      page === i + 1 
                        ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200" 
                        : "hover:bg-white border border-transparent hover:border-neutral-200"
                    )}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-neutral-200 rounded-xl hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
