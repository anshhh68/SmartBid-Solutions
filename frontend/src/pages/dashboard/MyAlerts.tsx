import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Bell, Plus, Trash2, Tag, MapPin, Search,
  CheckCircle2, AlertCircle
} from 'lucide-react';

export default function MyAlerts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [locations, setLocations] = useState('');
  const [categories, setCategories] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-alerts'],
    queryFn: async () => {
      const res = await api.get('/users/alerts');
      return res.data.alerts || [];
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (payload: { keywords: string[]; categories: string[]; locations: string[] }) => {
      const res = await api.post('/users/alerts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      toast.success('Procurement alert created successfully');
      setIsModalOpen(false);
      setKeywords('');
      setLocations('');
      setCategories('');
    },
    onError: () => {
      toast.error('Failed to create alert');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await api.delete(`/users/alerts/${alertId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      toast.success('Alert deleted');
    },
    onError: () => {
      toast.error('Failed to delete alert');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const kwList = keywords.split(',').map(s => s.trim()).filter(Boolean);
    const catList = categories.split(',').map(s => s.trim()).filter(Boolean);
    const locList = locations.split(',').map(s => s.trim()).filter(Boolean);

    if (kwList.length === 0 && catList.length === 0 && locList.length === 0) {
      toast.error('Please specify at least one keyword, category, or location');
      return;
    }

    createAlertMutation.mutate({
      keywords: kwList,
      categories: catList,
      locations: locList,
    });
  };

  const alerts = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Tender Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Get notified whenever tenders matching your business capabilities are published.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Alert
        </button>
      </div>

      {/* Info card */}
      <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <span className="font-semibold">How Tender Alerts Work:</span> Whenever fresh tenders are ingested from GeM, CPP Portal, Railway, or State E-Procurement sites that match your keywords or location criteria, they are highlighted in your dashboard feed.
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No active alerts configured</h3>
          <p className="text-sm text-slate-500 mt-2">
            Set alerts for keywords like "Solar Installation", "Security Services", "CCTV", or your preferred states.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Alert
                  </span>
                  <button
                    onClick={() => deleteAlertMutation.mutate(alert.id)}
                    disabled={deleteAlertMutation.isPending}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Target Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {alert.keywords && alert.keywords.length > 0 ? (
                        alert.keywords.map((kw: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">All keywords</span>
                      )}
                    </div>
                  </div>

                  {alert.locations && alert.locations.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Locations
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {alert.locations.map((loc: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg"
                          >
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Created on {new Date(alert.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Configure Tender Alert</h3>
            <p className="text-xs text-slate-500 mt-1">
              Specify comma-separated values to filter new opportunities.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CCTV, Civil Work, Medical Supplies"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Locations / States
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat, Maharashtra, Delhi"
                  value={locations}
                  onChange={(e) => setLocations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categories
                </label>
                <input
                  type="text"
                  placeholder="e.g. IT & Software, Construction, GeM"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlertMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {createAlertMutation.isPending ? 'Saving...' : 'Save Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
