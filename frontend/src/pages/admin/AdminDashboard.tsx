import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import {
  FileText, Users, MessageSquare, AlertCircle,
  Plus, CheckCircle2, Clock, ChevronRight, Shield,
  ArrowUpRight, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });

  const stats = data?.stats || {
    totalUsers: 0,
    totalTenders: 0,
    activeTenders: 0,
    totalEnquiries: 0,
    newEnquiries: 0,
    closingSoon: 0,
  };

  const recentEnquiries = data?.recentEnquiries || [];

  const chartData = [
    { name: 'Active Tenders', count: stats.activeTenders, fill: '#2563eb' },
    { name: 'Closing Soon', count: stats.closingSoon, fill: '#f59e0b' },
    { name: 'New Enquiries', count: stats.newEnquiries, fill: '#10b981' },
    { name: 'Total Users', count: stats.totalUsers, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Administration Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time procurement metrics, lead intake, and portal operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tenders/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Publish New Tender
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tenders</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats.totalTenders}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.activeTenders} active
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closing Soon</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-amber-600">
              {isLoading ? '...' : stats.closingSoon}
            </span>
            <span className="text-xs text-slate-400">within 7 days</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Enquiries</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats.totalEnquiries}
            </span>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {stats.newEnquiries} unread
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats.totalUsers}
            </span>
            <span className="text-xs text-slate-400">Total Bidders</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Activity Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Portal Operations Distribution
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">High-level operational metrics snapshot</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Client Enquiries Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Incoming Enquiries</h2>
              <Link to="/admin/enquiries" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            {recentEnquiries.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent enquiries</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentEnquiries.map((enq: any) => (
                  <div key={enq.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{enq.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${
                        enq.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {enq.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{enq.service || 'Consultation'} • {enq.phone || enq.email}</p>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-1 italic">"{enq.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/admin/enquiries"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Open Enquiries Desk
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
