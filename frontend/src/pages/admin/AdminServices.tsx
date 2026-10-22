import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Briefcase, Plus, Edit, Trash2, Check,
  ExternalLink, Layers
} from 'lucide-react';

export default function AdminServices() {
  const [editingService, setEditingService] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('ShieldCheck');
  const [order, setOrder] = useState('0');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const res = await api.get('/admin/services');
      return res.data.services || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingService) {
        return api.put(`/admin/services/${editingService.id}`, payload);
      } else {
        return api.post('/admin/services', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(editingService ? 'Service updated' : 'Service created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save service'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success('Service deleted');
    },
    onError: () => toast.error('Failed to delete service'),
  });

  const openModal = (serv?: any) => {
    if (serv) {
      setEditingService(serv);
      setTitle(serv.title);
      setSlug(serv.slug);
      setDescription(serv.description || '');
      setIcon(serv.icon || 'ShieldCheck');
      setOrder(String(serv.order || 0));
    } else {
      setEditingService(null);
      setTitle('');
      setSlug('');
      setDescription('');
      setIcon('ShieldCheck');
      setOrder('0');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) {
      toast.error('Title and slug are required');
      return;
    }
    saveMutation.mutate({
      title,
      slug,
      description,
      icon,
      order: parseInt(order) || 0,
    });
  };

  const services = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Bidding Services Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure offered services (GeM Registration, Bidding Assistance, DSC, ISO Certification).
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No services found.</div>
        ) : (
          services.map((s: any) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    Order: {s.order}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(s)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete service "${s.title}"?`)) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{s.title}</h3>
                <span className="text-xs text-blue-600 font-mono">/services/{s.slug}</span>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {s.description || 'No description provided'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Icon: {s.icon}</span>
                <a
                  href={`/services/${s.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  View Public <ExternalLink className="w-3 h-3" />
                </a>
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
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GeM Portal Registration & Profile Management"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingService) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Slug URL</label>
                  <input
                    type="text"
                    required
                    placeholder="gem-registration"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Identifier</label>
                <input
                  type="text"
                  placeholder="ShieldCheck, FileText, Award, Key, etc."
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Description</label>
                <textarea
                  rows={4}
                  placeholder="Detailed overview of what SmartBid Solutions provides under this service..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
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
                  {saveMutation.isPending ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
