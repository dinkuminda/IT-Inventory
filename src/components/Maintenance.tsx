
import React, { useState, useEffect } from 'react';
import { supabase, logAction } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wrench, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Loader2,
  Laptop,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Maintenance() {
  const { user, isAdmin, profile } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    issueDescription: '',
    actionTaken: '',
    performedBy: '',
    cost: '0',
    status: 'Completed',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: recData, error: recError } = await supabase
        .from('maintenance')
        .select('*, assets(name, type, "serialNumber")')
        .order('date', { ascending: false });

      if (recError) throw recError;
      setRecords(recData || []);

      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('id, name, "serialNumber"')
        .order('name');

      if (assetError) throw assetError;
      setAssets(assetData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        cost: parseFloat(formData.cost) || 0
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('maintenance')
          .update(payload)
          .eq('id', editingRecord.id);
        if (error) throw error;
        await logAction('Update Maintenance', 'Maintenance', editingRecord.id, { issue: formData.issueDescription });
      } else {
        const { error } = await supabase
          .from('maintenance')
          .insert([payload]);
        if (error) throw error;
        await logAction('Create Maintenance', 'Maintenance', undefined, { issue: formData.issueDescription });
      }

      setIsModalOpen(false);
      setEditingRecord(null);
      setFormData({
        assetId: '',
        issueDescription: '',
        actionTaken: '',
        performedBy: '',
        cost: '0',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;
    try {
      const { error } = await supabase.from('maintenance').delete().eq('id', id);
      if (error) throw error;
      await logAction('Delete Maintenance', 'Maintenance', id);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredRecords = records.filter(r => 
    r.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.assets?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.performedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2">Maintenance</h1>
          <p className="text-neutral-500 font-medium">Track asset repairs, costs, and hardware lifespan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingRecord(null);
                setFormData({
                  assetId: '',
                  issueDescription: '',
                  actionTaken: '',
                  performedBy: '',
                  cost: '0',
                  status: 'Completed',
                  date: new Date().toISOString().split('T')[0]
                });
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              New Log
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <span className="font-medium">Loading hardware history...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400">
            <Wrench className="mb-4 opacity-20" size={48} />
            <span className="font-medium text-lg text-neutral-900 mb-1">No maintenance found</span>
            <span className="text-sm">Maintenance logs recorded for assets will appear here.</span>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div key={record.id} className="bg-white border border-neutral-200 rounded-3xl p-6 hover:shadow-xl hover:shadow-neutral-200/40 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-neutral-100 rounded-2xl text-neutral-900 shrink-0">
                    <Laptop size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black tracking-tight text-neutral-900">{record.assets?.name || 'Unknown Asset'}</h3>
                      <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-500">{record.assets?.serialNumber}</span>
                    </div>
                    <p className="text-neutral-500 font-medium mb-3">{record.issueDescription}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-neutral-300" />
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-neutral-300" />
                        {record.performedBy || 'System'}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <DollarSign size={14} />
                        <span className="font-bold">${record.cost?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-neutral-100 pt-6 lg:pt-0">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                    record.status === 'Completed' ? "bg-emerald-50 text-emerald-700" :
                    record.status === 'In Progress' ? "bg-amber-50 text-amber-700" :
                    "bg-rose-50 text-rose-700"
                  )}>
                    {record.status === 'Completed' ? <CheckCircle2 size={12} /> : record.status === 'In Progress' ? <Clock size={12} /> : <AlertCircle size={12} />}
                    {record.status}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingRecord(record);
                          setFormData({
                            assetId: record.assetId,
                            issueDescription: record.issueDescription,
                            actionTaken: record.actionTaken || '',
                            performedBy: record.performedBy || '',
                            cost: String(record.cost),
                            status: record.status,
                            date: record.date
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-3 hover:bg-neutral-100 rounded-2xl text-neutral-400 hover:text-neutral-900 transition-all border border-transparent hover:border-neutral-200"
                        title="Edit Record"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-3 hover:bg-rose-50 rounded-2xl text-neutral-400 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {record.actionTaken && (
                <div className="mt-4 pt-4 border-t border-dashed border-neutral-100 text-sm text-neutral-500 font-medium italic">
                  Note: {record.actionTaken}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="px-8 pt-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-neutral-900">
                    {editingRecord ? 'Update Log' : 'New Maintenance Log'}
                  </h2>
                  <p className="text-neutral-500 text-sm font-medium">Record maintenance details for tracking.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Select Asset</label>
                    <select 
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.assetId}
                      onChange={e => setFormData({ ...formData, assetId: e.target.value })}
                    >
                      <option value="">Select an asset...</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.serialNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Issue Description</label>
                    <textarea 
                      required 
                      rows={2}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all resize-none"
                      value={formData.issueDescription}
                      onChange={e => setFormData({ ...formData, issueDescription: e.target.value })}
                      placeholder="What was the problem?"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Action Taken</label>
                    <textarea 
                      rows={2}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all resize-none"
                      value={formData.actionTaken}
                      onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
                      placeholder="How was it fixed?"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Performed By</label>
                    <input 
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.performedBy}
                      onChange={e => setFormData({ ...formData, performedBy: e.target.value })}
                      placeholder="Technician name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Cost ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.cost}
                      onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 text-black">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Status</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ordered Parts">Ordered Parts</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Date</label>
                    <input 
                      type="date"
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-bold hover:bg-neutral-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (editingRecord ? 'Update Log' : 'Create Log')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
