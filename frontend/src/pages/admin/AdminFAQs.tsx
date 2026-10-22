import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  HelpCircle, Plus, Edit, Trash2, ChevronDown, Tag
} from 'lucide-react';

export default function AdminFAQs() {
  const [editingFaq, setEditingFaq] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [order, setOrder] = useState('0');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const res = await api.get('/admin/faqs');
      return res.data.faqs || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingFaq) {
        return api.put(`/admin/faqs/${editingFaq.id}`, payload);
      } else {
        return api.post('/admin/faqs', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success(editingFaq ? 'FAQ updated' : 'FAQ created');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save FAQ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ deleted');
    },
    onError: () => toast.error('Failed to delete FAQ'),
  });

  const openModal = (f?: any) => {
    if (f) {
      setEditingFaq(f);
      setQuestion(f.question);
      setAnswer(f.answer);
      setCategory(f.category || 'general');
      setOrder(String(f.order || 0));
    } else {
      setEditingFaq(null);
      setQuestion('');
      setAnswer('');
      setCategory('general');
      setOrder('0');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) {
      toast.error('Question and answer are required');
      return;
    }
    saveMutation.mutate({
      question,
      answer,
      category,
      order: parseInt(order) || 0,
    });
  };

  const faqs = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Frequently Asked Questions (FAQs)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage common queries regarding GeM, tenders, documentation, and subscriptions.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">No FAQs found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {faqs.map((f: any) => (
              <div key={f.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded uppercase">
                        {f.category}
                      </span>
                      <span className="text-xs text-slate-400">Order: {f.order}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{f.question}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                      {f.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openModal(f)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this question?')) {
                          deleteMutation.mutate(f.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="general">General</option>
                  <option value="gem">GeM Portal</option>
                  <option value="tender">Tender & Bidding</option>
                  <option value="dsc">Digital Signature & Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How long does GeM OEM dashboard approval take?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Clear, helpful response explaining process or compliance requirements..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
                  {saveMutation.isPending ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
