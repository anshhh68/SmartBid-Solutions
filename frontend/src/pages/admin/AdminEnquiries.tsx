import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  MessageSquare, Search, Filter, Phone, Mail,
  CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight,
  ExternalLink, Edit3, UserCheck
} from 'lucide-react';

export default function AdminEnquiries() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [activeEnquiry, setActiveEnquiry] = useState<any | null>(null);

  const [editStatus, setEditStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-enquiries', status, page],
    queryFn: async () => {
      const res = await api.get('/admin/enquiries', {
        params: { status: status || undefined, page, limit: 15 },
      });
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, assignedTo, notes }: any) => {
      const res = await api.put(`/admin/enquiries/${id}`, { status, assignedTo, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Enquiry updated');
      setActiveEnquiry(null);
    },
    onError: () => toast.error('Failed to update enquiry'),
  });

  const openEditModal = (enq: any) => {
    setActiveEnquiry(enq);
    setEditStatus(enq.status || 'NEW');
    setAssignedTo(enq.assignedTo || '');
    setNotes(enq.notes || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiry) return;
    updateMutation.mutate({
      id: activeEnquiry.id,
      status: editStatus,
      assignedTo,
      notes,
    });
  };

  const enquiries = data?.enquiries || [];
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">NEW</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">CLOSED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            Client Consultation Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming bidding consultation enquiries, assign managers, and update notes.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No client enquiries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Service Required</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((enq: any) => (
                  <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{enq.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <a href={`mailto:${enq.email}`} className="hover:text-blue-600 flex items-center gap-0.5">
                          <Mail className="w-3 h-3" /> {enq.email}
                        </a>
                        {enq.phone && (
                          <a href={`tel:${enq.phone}`} className="hover:text-emerald-600 flex items-center gap-0.5">
                            <Phone className="w-3 h-3" /> {enq.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {enq.service || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-xs text-slate-600 truncate">
                      {enq.message}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(enq.status)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {enq.assignedTo || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      {enq.phone && (
                        <a
                          href={`https://wa.me/${enq.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(enq.name)}%2C%20regarding%20your%20enquiry%20on%20SmartBid%20Solutions`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block p-1 text-emerald-600 hover:text-emerald-700 rounded"
                          title="WhatsApp Chat"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(enq)}
                        className="inline-block p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="Update Status / Notes"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total {data?.total || 0} leads • Page {page} of {totalPages}
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

      {/* Edit Modal */}
      {activeEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enquiry Lead Details</h3>
                <p className="text-xs text-slate-500">{activeEnquiry.name} • {activeEnquiry.email}</p>
              </div>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {activeEnquiry.service || 'General'}
              </span>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-line border border-slate-200">
              <span className="font-semibold block text-slate-500 mb-1">User Message:</span>
              {activeEnquiry.message}
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="NEW">NEW</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Executive</label>
                <input
                  type="text"
                  placeholder="e.g. Priyank Patel, Account Manager"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes / Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Notes about discussion with bidder, documents requested, quote sent..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveEnquiry(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Update Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
