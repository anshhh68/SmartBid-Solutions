import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  FileText, ArrowLeft, Save, Plus, Trash2,
  Calendar, IndianRupee, MapPin, Building
} from 'lucide-react';

export default function AdminTenderForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    refNo: '',
    department: '',
    categoryId: '',
    location: '',
    state: '',
    value: '',
    emd: '',
    fee: '',
    closingDate: '',
    openingDate: '',
    status: 'ACTIVE',
    isPublished: true,
    source: 'GeM Portal',
    description: '',
    documents: [] as { name: string; url: string }[],
  });

  const [docName, setDocName] = useState('');
  const [docUrl, setDocUrl] = useState('');

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.categories || [];
    },
  });

  // Fetch tender if editing
  const { data: tenderData, isLoading: isFetchingTender } = useQuery({
    queryKey: ['admin-tender', id],
    queryFn: async () => {
      const res = await api.get(`/admin/tenders/${id}`);
      return res.data.tender;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (tenderData) {
      setFormData({
        title: tenderData.title || '',
        refNo: tenderData.refNo || '',
        department: tenderData.department || '',
        categoryId: tenderData.categoryId || '',
        location: tenderData.location || '',
        state: tenderData.state || '',
        value: tenderData.value ? String(tenderData.value) : '',
        emd: tenderData.emd ? String(tenderData.emd) : '',
        fee: tenderData.fee ? String(tenderData.fee) : '',
        closingDate: tenderData.closingDate
          ? new Date(tenderData.closingDate).toISOString().slice(0, 16)
          : '',
        openingDate: tenderData.openingDate
          ? new Date(tenderData.openingDate).toISOString().slice(0, 16)
          : '',
        status: tenderData.status || 'ACTIVE',
        isPublished: tenderData.isPublished ?? true,
        source: tenderData.source || 'GeM Portal',
        description: tenderData.description || '',
        documents: Array.isArray(tenderData.documents) ? tenderData.documents : [],
      });
    }
  }, [tenderData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing) {
        return api.put(`/admin/tenders/${id}`, payload);
      } else {
        return api.post('/admin/tenders', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenders'] });
      toast.success(isEditing ? 'Tender updated successfully' : 'Tender created successfully');
      navigate('/admin/tenders');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to save tender');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.closingDate) {
      toast.error('Tender title and closing date are required');
      return;
    }

    const payload = {
      ...formData,
      value: formData.value ? parseFloat(formData.value) : null,
      emd: formData.emd ? parseFloat(formData.emd) : null,
      fee: formData.fee ? parseFloat(formData.fee) : null,
      closingDate: new Date(formData.closingDate).toISOString(),
      openingDate: formData.openingDate ? new Date(formData.openingDate).toISOString() : null,
      categoryId: formData.categoryId || null,
    };

    saveMutation.mutate(payload);
  };

  const handleAddDocument = () => {
    if (!docName || !docUrl) {
      toast.error('Document name and URL are required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, { name: docName, url: docUrl }],
    }));
    setDocName('');
    setDocUrl('');
  };

  const handleRemoveDoc = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  if (isEditing && isFetchingTender) {
    return <div className="py-20 text-center text-slate-400">Loading tender data...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tenders"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Edit Procurement Tender' : 'Publish New Tender'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter tender specifications, bid deadlines, and tender document attachments.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tender Title / Name of Work <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Rate Contract for Supply of Computer Hardware and Peripherals"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Reference / Bid Number
              </label>
              <input
                type="text"
                value={formData.refNo}
                onChange={(e) => setFormData({ ...formData, refNo: e.target.value })}
                placeholder="GEM/2026/B/871291"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Procurement Authority / Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Ministry of Railways, ONGC, AIIMS"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select Category</option>
                {catData?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location / City
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ahmedabad"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Gujarat"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Portal
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="GeM Portal / CPP Portal"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Financials & Key Dates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Financial Values & Important Dates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Value (INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="1500000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMD / Bid Security (INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  value={formData.emd}
                  onChange={(e) => setFormData({ ...formData, emd: e.target.value })}
                  placeholder="30000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tender Document Fee (INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  placeholder="0 (or fee amount)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bid Submission Closing Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical Bid Opening Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.openingDate}
                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isPublished" className="text-sm font-semibold text-slate-700">
                Immediately Publish to Public Discovery
              </label>
            </div>
          </div>
        </div>

        {/* Scope / Description */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Scope of Work / Tender Description
          </h2>
          <textarea
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Comprehensive description of items, quantities, qualifications, and special conditions..."
            className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tender Attachments / Docs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Tender Documents & NIT Notice
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Document title (e.g. NIT Tender Notice PDF)"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <input
              type="url"
              placeholder="Document link or URL"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddDocument}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {formData.documents.length > 0 && (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden mt-3">
              {formData.documents.map((doc, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between text-sm bg-slate-50/50">
                  <div>
                    <span className="font-semibold text-slate-800">{doc.name}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-xs text-blue-600 hover:underline truncate max-w-md"
                    >
                      {doc.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/tenders"
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Tender' : 'Publish Tender'}
          </button>
        </div>
      </form>
    </div>
  );
}
