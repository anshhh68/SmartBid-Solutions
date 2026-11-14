import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Search, Filter, Edit, Trash2,
  CheckCircle, XCircle, Eye, Upload, ChevronLeft, ChevronRight,
  RefreshCw, Bookmark
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export default function AdminTenders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenders', debouncedSearch, status, page],
    queryFn: async () => {
      const res = await api.get('/admin/tenders', {
        params: { search: debouncedSearch || undefined, status: status || undefined, page, limit: 15 },
      });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/tenders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      toast.success('Tender deleted successfully');
    },
    onError: () => toast.error('Failed to delete tender'),
  });

  const bulkPublishMutation = useMutation({
    mutationFn: async ({ ids, publish }: { ids: string[]; publish: boolean }) => {
      const res = await api.post('/admin/tenders/bulk-publish', { ids, publish });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      toast.success(data.message || 'Updated tenders');
      setSelectedIds([]);
    },
    onError: () => toast.error('Failed to bulk update'),
  });

  const importMutation = useMutation({
    mutationFn: async (tenders: any[]) => {
      const res = await api.post('/admin/tenders/import', { tenders });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      toast.success(data.message || 'Imported successfully');
      setIsImportModalOpen(false);
      setImportJson('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Import failed'),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      // Scraping GeM can take a while; override the default 15s API timeout
      const res = await api.post('/admin/tenders/sync-live', {}, { timeout: 120000 });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success(data.message || 'Live tenders synchronized');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to sync live tenders'),
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.tenders) {
      setSelectedIds(data.tenders.map((t: any) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        toast.error('Import data must be a JSON array of tender objects');
        return;
      }
      importMutation.mutate(parsed);
    } catch {
      toast.error('Invalid JSON syntax');
    }
  };

  const tenders = data?.tenders || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Tender Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage procurement listings, GeM bids, status lifecycles, and documents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            title="Automatically pull and refresh active tenders from GeM and nProcure (Gujarat)"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing Bids...' : 'Sync Live Bids'}
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Import (JSON)
          </button>
          <Link
            to="/admin/tenders/capture"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            title="Capture tenders from CPPP, IREPS and state portals"
          >
            <Bookmark className="w-4 h-4" />
            Capture from Portal
          </Link>
          <Link
            to="/admin/tenders/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Tender
          </Link>
        </div>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, ref no, or department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="CLOSED">CLOSED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 self-end md:self-auto bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            <span className="text-xs font-semibold text-blue-700">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, publish: true })}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
              Publish
            </button>
            <button
              onClick={() => bulkPublishMutation.mutate({ ids: selectedIds, publish: false })}
              className="px-2.5 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium"
            >
              Unpublish
            </button>
          </div>
        )}
      </div>

      {/* Tenders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading tenders...</div>
        ) : tenders.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No tenders found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={tenders.length > 0 && selectedIds.length === tenders.length}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4">Tender Details</th>
                  <th className="py-3 px-4">Department / Authority</th>
                  <th className="py-3 px-4">Closing Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenders.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={() => handleSelectRow(t.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900 line-clamp-1">{t.title}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Ref: {t.refNo || 'N/A'} • {t.category?.name || 'General'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {t.department || 'Government of India'}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                      {new Date(t.closingDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <Link
                        to={`/tenders/${t.id}`}
                        target="_blank"
                        className="inline-block p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/tenders/${t.id}/edit`}
                        className="inline-block p-1 text-slate-400 hover:text-blue-600 rounded"
                        title="Edit Tender"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this tender?')) {
                            deleteMutation.mutate(t.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
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
            Total {data?.total || 0} records • Page {page} of {totalPages}
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

      {/* JSON Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Bulk Import Tenders (JSON Array)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste an array of tender objects with fields: title, refNo, department, closingDate, location, value.
            </p>

            <form onSubmit={handleImportSubmit} className="mt-4 space-y-4">
              <textarea
                rows={8}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"title":"Supply of Office Equipment","refNo":"GEM/2026/B/8812","department":"Income Tax Dept","closingDate":"2026-10-20T18:00:00Z","value":500000}]'
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {importMutation.isPending ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
