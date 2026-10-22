import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Star, Plus, Edit, Trash2, Quote, User
} from 'lucide-react';

export default function AdminTestimonials() {
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState('5');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('0');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const res = await api.get('/admin/testimonials');
      return res.data.testimonials || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        return api.put(`/admin/testimonials/${editingItem.id}`, payload);
      } else {
        return api.post('/admin/testimonials', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(editingItem ? 'Testimonial updated' : 'Testimonial created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save testimonial'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Testimonial deleted');
    },
    onError: () => toast.error('Failed to delete testimonial'),
  });

  const openModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setCompany(item.company || '');
      setRole(item.role || '');
      setRating(String(item.rating || 5));
      setContent(item.content || '');
      setOrder(String(item.order || 0));
    } else {
      setEditingItem(null);
      setName('');
      setCompany('');
      setRole('');
      setRating('5');
      setContent('');
      setOrder('0');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      toast.error('Name and content are required');
      return;
    }
    saveMutation.mutate({
      name,
      company,
      role,
      rating: parseInt(rating) || 5,
      content,
      order: parseInt(order) || 0,
    });
  };

  const testimonials = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Client Reviews & Testimonials
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage bidder recommendations and success stories showcased on the home page.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading testimonials...</div>
        ) : testimonials.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No testimonials found.</div>
        ) : (
          testimonials.map((t: any) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(t)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete review from "${t.name}"?`)) {
                          deleteMutation.mutate(t.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 italic mt-3 line-clamp-4 leading-relaxed">
                  "{t.content}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    {t.role ? `${t.role}, ` : ''}{t.company}
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">#{t.order}</span>
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
              {editingItem ? 'Edit Testimonial' : 'Add Testimonial'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Shah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Engineering Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1 to 5)</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="5">5 Stars (Excellent)</option>
                    <option value="4">4 Stars (Good)</option>
                    <option value="3">3 Stars (Average)</option>
                  </select>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Statement</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Feedback on SmartBid Solutions team, turnaround time, successful bid results..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  {saveMutation.isPending ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
