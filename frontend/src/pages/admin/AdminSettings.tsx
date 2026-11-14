import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Settings, Save, Phone, Mail, MapPin,
  Clock, Globe, Shield, MessageCircle, KeyRound
} from 'lucide-react';

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<Record<string, string>>({
    site_title: 'SmartBid Solutions — Tender Bidding & GeM Portal Services',
    contact_email: 'kinjal.modismartbidsolutions@gmail.com',
    contact_phone: '+91 70162 35257',
    contact_phone2: '+91 85117 22588',
    whatsapp_number: '917016235257',
    address: 'B-402, Titanium City Centre, Prahlad Nagar, Ahmedabad, Gujarat 380015',
    office_hours: '24/7 Dedicated Desk & Bid Advisory',
    footer_text: 'Empowering Indian enterprises with end-to-end tender bidding, GeM portal management, and compliance solutions.',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data.settings || {};
    },
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setSettings((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updated: Record<string, string>) => {
      const res = await api.put('/admin/settings', updated);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Site settings saved successfully');
    },
    onError: () => toast.error('Failed to update settings'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(settings);
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Site Settings & Corporate Details
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure corporate contact numbers, head office address, business hours, and global meta settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Site Information */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            General Branding & Header
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website Title / Brand Tagline
            </label>
            <input
              type="text"
              value={settings.site_title || ''}
              onChange={(e) => handleChange('site_title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Footer Summary Text
            </label>
            <textarea
              rows={2}
              value={settings.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Official Contact Coordinates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Secondary Support Line
              </label>
              <input
                type="text"
                value={settings.contact_phone2 || ''}
                onChange={(e) => handleChange('contact_phone2', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Hotline (International digits only)
              </label>
              <input
                type="text"
                value={settings.whatsapp_number || ''}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                placeholder="917016235257"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Office Address
            </label>
            <input
              type="text"
              value={settings.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Working Hours
            </label>
            <input
              type="text"
              value={settings.office_hours || ''}
              onChange={(e) => handleChange('office_hours', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      <ChangePassword />
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/change-password', {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to change password'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    if (form.newPassword !== form.confirm) return toast.error('New passwords do not match');
    mutation.mutate();
  };

  const field = (label: string, key: keyof typeof form, autoComplete: string) => (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={form[key]}
        onChange={set(key)}
        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-blue-600" />
        Change Admin Password
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {field('Current password', 'currentPassword', 'current-password')}
        {field('New password', 'newPassword', 'new-password')}
        {field('Confirm new password', 'confirm', 'new-password')}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
