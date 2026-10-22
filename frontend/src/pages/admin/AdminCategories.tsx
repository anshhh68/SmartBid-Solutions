import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Tag, Plus, Edit, Trash2, Layers, FileText
} from 'lucide-react';

export default function AdminCategories() {
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Tag');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories-full'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.categories || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingCat) {
        return api.put(`/admin/categories/${editingCat.id}`, payload);
      } else {
        return api.post('/admin/categories', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      toast.success(editingCat ? 'Category updated' : 'Category created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save category'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingCat(cat);
      setName(cat.name);
      setSlug(cat.slug);
      setDescription(cat.description || '');
      setIcon(cat.icon || 'Tag');
    } else {
      setEditingCat(null);
      setName('');
      setSlug('');
      setDescription('');
      setIcon('Tag');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCat(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error('Name and slug are required');
      return;
    }
    saveMutation.mutate({ name, slug, description, icon });
  };

  const categories = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            Tender Categories & Domains
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure industry sectors and domain taxonomy for tender indexing.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">No categories found.</div>
        ) : (
          categories.map((c: any) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    slug: {c.slug}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(c)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete category "${c.name}"?`)) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {c.description || 'General procurement category'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  {c._count?.tenders || 0} Tenders
                </span>
                <span>Icon: {c.icon || 'Tag'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCat ? 'Edit Category' : 'Add Category'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil & Infrastructure"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCat) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slug URL</label>
                <input
                  type="text"
                  required
                  placeholder="civil-infrastructure"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Identifier</label>
                <input
                  type="text"
                  placeholder="Building, Cpu, Truck, Briefcase, etc."
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description for category..."
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
                  {saveMutation.isPending ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
