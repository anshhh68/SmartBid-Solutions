import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Users, Search, Shield, User, CheckCircle2,
  XCircle, ChevronLeft, ChevronRight, Phone, Mail
} from 'lucide-react';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: { search, role: role || undefined, page, limit: 15 },
      });
      return res.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User ${data.user.name} is now ${data.user.isActive ? 'Active' : 'Inactive'}`);
    },
    onError: () => toast.error('Failed to change user status'),
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          User Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review registered bidders, administrators, and monitor platform engagement.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full sm:w-auto"
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Saved Tenders</th>
                  <th className="py-3 px-4">Enquiries</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {u.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {u._count?.savedTenders || 0} saved
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {u._count?.enquiries || 0} enquiries
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: u.id, isActive: !u.isActive })}
                          disabled={toggleStatusMutation.isPending}
                          className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total {data?.total || 0} users • Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
