import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  ClipboardList, Clock, User, ShieldAlert,
  Database, Activity
} from 'lucide-react';

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data.logs || [];
    },
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">DELETE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  const logs = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          System Audit Trail & Security Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable activity logs tracking all critical administrative operations, tender mutations, and configuration adjustments.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No audit events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Entity Identifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 text-xs">
                        {log.user?.name || 'System / Admin'}
                      </span>
                      {log.user?.email && (
                        <span className="block text-[11px] text-slate-400 font-mono">
                          {log.user.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-semibold text-slate-700">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs font-mono text-slate-500">
                      {log.entityId || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
