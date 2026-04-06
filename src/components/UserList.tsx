import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Mail, 
  Building2,
  MoreVertical,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function UserList() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      setUsers(await res.json());
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleRole = async (user: any) => {
    if (!isAdmin) return;
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Team Members</h3>
            <p className="text-sm text-neutral-500">Manage IT staff and permissions</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 rounded-full border border-neutral-100">
            <Users size={14} className="text-neutral-400" />
            <span className="text-xs font-bold text-neutral-600">{users.length} Total</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          {users.map((user) => (
            <div key={user.id} className="p-6 hover:bg-neutral-50 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-neutral-200">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  user.role === 'admin' ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                )}>
                  {user.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {user.role}
                </div>
              </div>

              <h4 className="font-bold text-neutral-900 mb-1">{user.displayName || 'Anonymous User'}</h4>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Mail size={14} />
                  {user.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Building2 size={14} />
                  {user.department || 'IT Department'}
                </div>
              </div>

              {isAdmin && (
                <button 
                  onClick={() => toggleRole(user)}
                  className={cn(
                    "w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                    user.role === 'admin' 
                      ? "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100" 
                      : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-200"
                  )}
                >
                  {user.role === 'admin' ? 'Demote to Employee' : 'Promote to Admin'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
