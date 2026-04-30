
import React, { useState, useEffect } from 'react';
import { supabase, logAction } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  Calendar,
  X,
  Loader2,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function EmployeeList() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedForLogin, setSelectedForLogin] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    department: 'IT Department',
    position: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    enableLogin: false,
    initialPassword: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('"fullName"', { ascending: true });
      
      if (error) throw error;
      setEmployees(data || []);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, id, role');
      setProfiles(profileData || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableLogin = async (employee: any) => {
    setSelectedForLogin(employee);
    setPassword('');
    setIsLoginModalOpen(true);
  };

  const confirmEnableLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForLogin || !password) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedForLogin.email,
          password: password,
          fullName: selectedForLogin.fullName,
          department: selectedForLogin.department,
          role: 'employee'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create system account. Please check server logs or database constraints.');
      }

      await logAction(selectedForLogin.profileId ? 'Reset Password' : 'Enable Login', 'Employee', selectedForLogin.id, { email: selectedForLogin.email });
      alert(selectedForLogin.profileId ? `Password reset successfully for ${selectedForLogin.fullName}` : `System access enabled for ${selectedForLogin.fullName}`);
      setPassword('');
      setIsLoginModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.enableLogin && (!formData.initialPassword || formData.initialPassword.length < 6)) {
      alert('Initial password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save Employee Record
      const payload = {
        employeeId: formData.employeeId.trim() || null,
        fullName: formData.fullName,
        email: formData.email.trim() || null,
        department: formData.department,
        position: formData.position.trim() || null,
        joinDate: formData.joinDate,
        status: formData.status
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingEmployee.id);
        
        if (error) throw new Error(`Update failed: ${error.message}`);
        await logAction('Update Employee', 'Employee', editingEmployee.id, { name: formData.fullName });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([payload]);
          
        if (error) {
          if (error.code === '23505') {
            throw new Error(`Data validation failed: ${error.message.includes('email') ? 'Email' : 'Employee ID'} is already in use.`);
          }
          throw error;
        }
        await logAction('Create Employee', 'Employee', undefined, { name: formData.fullName });
      }

      // 2. Optional: Create System Auth Account
      if (formData.enableLogin && formData.email) {
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.initialPassword,
            fullName: formData.fullName,
            department: formData.department,
            role: 'employee'
          })
        });

        if (!response.ok) {
          const data = await response.json();
          console.warn('System account creation error:', data.error);
          alert(`Employee record saved, but system login account could not be created: ${data.error}`);
        } else {
          await logAction('Enable Login', 'Employee', undefined, { email: formData.email });
        }
      }

      setIsModalOpen(false);
      setEditingEmployee(null);
      setFormData({
        employeeId: '',
        fullName: '',
        email: '',
        department: 'IT Department',
        position: '',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
        enableLogin: false,
        initialPassword: ''
      });
      fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee record?')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      await logAction('Delete Employee', 'Employee', id);
      fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-neutral-900 mb-2">Employees</h1>
          <p className="text-neutral-500 font-medium">Manage organization staff and personnel details.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="pl-11 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl w-full sm:w-64 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-900 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setEditingEmployee(null);
                setFormData({
                  employeeId: '',
                  fullName: '',
                  email: '',
                  department: 'IT Department',
                  position: '',
                  joinDate: new Date().toISOString().split('T')[0],
                  status: 'Active'
                });
                setIsModalOpen(true);
              }}
              className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <span className="font-medium">Loading personnel directory...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-neutral-200 flex flex-col items-center justify-center text-neutral-400">
            <Users className="mb-4 opacity-20" size={48} />
            <span className="font-medium text-lg text-neutral-900 mb-1">No employees found</span>
            <span className="text-sm">Staff members added to the directory will appear here.</span>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <motion.div 
              layout
              key={employee.id} 
              className="bg-white border border-neutral-200 rounded-[32px] p-6 hover:shadow-xl hover:shadow-neutral-200/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-600 border border-neutral-200">
                  <User size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => {
                          setEditingEmployee(employee);
                          setFormData({
                            employeeId: employee.employeeId || '',
                            fullName: employee.fullName,
                            email: employee.email || '',
                            department: employee.department || 'IT Department',
                            position: employee.position || '',
                            joinDate: employee.joinDate || '',
                            status: employee.status || 'Active'
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-900 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(employee.id)}
                        className="p-2 hover:bg-rose-50 rounded-xl text-neutral-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4 text-black text-left">
                <h3 className="text-xl font-black tracking-tight truncate">{employee.fullName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{employee.employeeId || 'No ID'}</span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest",
                    employee.status === 'Active' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", employee.status === 'Active' ? "bg-emerald-600" : "bg-rose-600")} />
                    {employee.status}
                  </div>
                  {(employee.profileId || profiles.some(p => p.email === employee.email)) ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                        <ShieldCheck size={10} />
                        System Access
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            const pId = employee.profileId || profiles.find(p => p.email === employee.email)?.id;
                            if (pId) {
                              setSelectedForLogin({ ...employee, profileId: pId });
                              setPassword('');
                              setIsLoginModalOpen(true);
                            }
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                        >
                          Reset Pass
                        </button>
                      )}
                    </div>
                  ) : (
                    isAdmin && employee.email && (
                      <button 
                        onClick={() => handleEnableLogin(employee)}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <Key size={10} />
                        Enable Login
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-50">
                <div className="flex items-center gap-3 text-sm text-neutral-600 font-medium">
                  <Building2 size={16} className="text-neutral-300" />
                  {employee.department}
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600 font-medium">
                  <Briefcase size={16} className="text-neutral-300" />
                  {employee.position || 'Employee'}
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Mail size={16} className="text-neutral-300" />
                  <span className="truncate">{employee.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <Calendar size={16} className="text-neutral-300" />
                  Joined {new Date(employee.joinDate).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isLoginModalOpen && selectedForLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-neutral-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{selectedForLogin.profileId ? 'Reset System Password' : 'Enable System Access'}</h2>
                  <p className="text-neutral-500 text-xs truncate max-w-[200px]">{selectedForLogin.email}</p>
                </div>
                <button onClick={() => setIsLoginModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-xl">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={confirmEnableLogin} className="p-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Initial Password</label>
                  <div className="relative">
                    <input 
                      required 
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      autoFocus
                      className="w-full pl-4 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all font-mono"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (selectedForLogin.profileId ? 'Update Password' : 'Enable Access')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    {editingEmployee ? 'Update Employee' : 'Add New Employee'}
                  </h2>
                  <p className="text-neutral-500 text-sm font-medium">Personnel details for the organization directory.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Employee ID</label>
                    <input 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all font-mono"
                      value={formData.employeeId}
                      onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="EMP-101"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Full Name</label>
                    <input 
                      required 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Email Address</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Department</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="IT Department">IT Department</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Position / Title</label>
                    <input 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Join Date</label>
                    <input 
                      type="date"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.joinDate}
                      onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Employment Status</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Terminated">Terminated</option>
                    </select>
                  </div>

                  {editingEmployee && (
                    <div className="sm:col-span-2 space-y-4 pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-neutral-900">System Credentials</span>
                          <p className="text-[10px] text-neutral-400 font-medium">Manage this employee's dashboard access</p>
                        </div>
                        {(editingEmployee.profileId || profiles.some(p => p.email === editingEmployee.email)) ? (
                          <button 
                            type="button"
                            onClick={() => {
                              const pId = editingEmployee.profileId || profiles.find(p => p.email === editingEmployee.email)?.id;
                              if (pId) {
                                setSelectedForLogin({ ...editingEmployee, profileId: pId });
                                setPassword('');
                                setIsLoginModalOpen(true);
                                setIsModalOpen(false); // Close main modal
                              }
                            }}
                            className="px-4 py-2 bg-neutral-100 text-neutral-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-2"
                          >
                            <Key size={12} />
                            Reset Password
                          </button>
                        ) : (
                          <button 
                            type="button"
                            disabled={!formData.email}
                            onClick={() => {
                              setSelectedForLogin(editingEmployee);
                              setPassword('');
                              setIsLoginModalOpen(true);
                              setIsModalOpen(false); // Close main modal
                            }}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2 disabled:opacity-50"
                          >
                            <ShieldCheck size={12} />
                            Enable Access
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!editingEmployee && (
                    <div className="sm:col-span-2 space-y-4 pt-4 border-t border-neutral-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                          formData.enableLogin ? "bg-neutral-900 border-neutral-900 text-white" : "border-neutral-200 group-hover:border-neutral-300"
                        )}>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.enableLogin}
                            onChange={e => setFormData({ ...formData, enableLogin: e.target.checked })}
                          />
                          {formData.enableLogin && <Users size={14} />}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-900">Enable System Access</span>
                          <p className="text-[10px] text-neutral-400 font-medium">Create a login account for this employee</p>
                        </div>
                      </label>

                      {formData.enableLogin && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1.5"
                        >
                          <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">Initial Password</label>
                          <div className="relative">
                            <input 
                              required
                              type={showPassword ? "text" : "password"}
                              minLength={6}
                              className="w-full pl-4 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900/10 transition-all font-mono"
                              value={formData.initialPassword}
                              onChange={e => setFormData({ ...formData, initialPassword: e.target.value })}
                              placeholder="Min 6 characters"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-medium ml-1 flex items-center gap-1">
                            <ShieldCheck size={10} />
                            User will be forced to change this on first login
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
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
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (editingEmployee ? 'Update Record' : 'Save Record')}
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
