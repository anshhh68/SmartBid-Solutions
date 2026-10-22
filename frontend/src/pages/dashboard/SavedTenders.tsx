import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Bookmark, Trash2, Clock, MapPin, IndianRupee,
  ExternalLink, Search, FileText
} from 'lucide-react';

export default function SavedTenders() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-tenders'],
    queryFn: async () => {
      const res = await api.get('/tenders/user/saved');
      return res.data.savedTenders || [];
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (tenderId: string) => {
      const res = await api.post(`/tenders/${tenderId}/save`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tenders'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      toast.success('Removed from saved tenders');
    },
    onError: () => {
      toast.error('Failed to update saved tender');
    },
  });

  const savedTenders = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-600" />
            Saved Tenders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of tenders you are analyzing or preparing to bid on.
          </p>
        </div>
        <Link
          to="/tenders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4" />
          Find More Tenders
        </Link>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Loading saved tenders...</div>
      ) : savedTenders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No saved tenders yet</h3>
          <p className="text-sm text-slate-500 mt-2">
            When browsing the tender discovery portal, click "Bookmark" on any tender to pin it to your dashboard.
          </p>
          <Link
            to="/tenders"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Browse Live Opportunities
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedTenders.map((tender: any) => {
            const closing = new Date(tender.closingDate);
            const isClosed = closing.getTime() < Date.now();
            return (
              <div
                key={tender.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                      {tender.category?.name || 'General'}
                    </span>
                    <button
                      onClick={() => unsaveMutation.mutate(tender.id)}
                      disabled={unsaveMutation.isPending}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors rounded-lg hover:bg-red-50"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    to={`/tenders/${tender.id}`}
                    className="mt-3 block font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 text-base"
                  >
                    {tender.title}
                  </Link>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{tender.department}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                    <div>
                      <span className="text-slate-400 block">Est. Value</span>
                      <span className="font-semibold text-slate-800 flex items-center mt-0.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {tender.value ? tender.value.toLocaleString('en-IN') : 'Refer Doc'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Closing Date</span>
                      <span className={`font-semibold mt-0.5 flex items-center gap-1 ${
                        isClosed ? 'text-red-600' : 'text-slate-800'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {closing.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {tender.location || 'Pan-India'}
                  </span>
                  <Link
                    to={`/tenders/${tender.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
