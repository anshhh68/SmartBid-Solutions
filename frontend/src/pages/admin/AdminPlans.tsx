import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Package, Plus, Edit, Trash2, CheckCircle2,
  Sparkles, IndianRupee
} from 'lucide-react';

export default function AdminPlans() {
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('quarterly');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [order, setOrder] = useState('0');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await api.get('/admin/plans');
      return res.data.plans || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingPlan) {
        return api.put(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        return api.post('/admin/plans', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success(editingPlan ? 'Plan updated' : 'Plan created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan deleted');
    },
    onError: () => toast.error('Failed to delete plan'),
  });

  const openModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setPrice(String(plan.price || ''));
      setBillingPeriod(plan.period || plan.billingPeriod || 'monthly');
      setDescription(plan.description || '');
      setFeaturesText(Array.isArray(plan.features) ? plan.features.join('\n') : '');
      setIsPopular(Boolean(plan.isPopular));
      setOrder(String(plan.order || 0));
    } else {
      setEditingPlan(null);
      setName('');
      setPrice('');
      setBillingPeriod('quarterly');
      setDescription('');
      setFeaturesText('');
      setIsPopular(false);
      setOrder('0');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Plan name and price are required');
      return;
    }

    const features = featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    saveMutation.mutate({
      name,
      price: parseFloat(price) || 0,
      billingPeriod,
      description,
      features,
      isPopular,
      order: parseInt(order) || 0,
    });
  };

  const plans = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Pricing & Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage packages displayed on the public pricing page.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No plans found.</div>
        ) : (
          plans.map((p: any) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between relative ${
                p.isPopular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between pt-1">
                  <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(p)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete plan "${p.name}"?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{p.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500">/ {p.period || p.billingPeriod || 'period'}</span>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-500 mt-2">{p.description}</p>
                )}

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Features Included:
                  </span>
                  {p.features && p.features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 text-xs text-slate-400">
                Display Order: {p.order}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              {editingPlan ? 'Edit Pricing Plan' : 'Create Pricing Plan'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GeM Seller Growth Plan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="9999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Period</label>
                  <input
                    type="text"
                    placeholder="e.g. month, quarter, annual"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  placeholder="Best suited for expanding OEM manufacturers and civil contractors"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={5}
                  placeholder={`Daily Unlimited Tender Alerts\nFull GeM Catalog Management\nDedicated Tender Bid Prep Specialist\nClass-3 DSC Renewal Support`}
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="isPopular" className="text-xs font-semibold text-slate-700">
                    Highlight as Most Popular
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
