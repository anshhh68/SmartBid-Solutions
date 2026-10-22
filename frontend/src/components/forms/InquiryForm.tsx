import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { INDIAN_STATES } from '../../lib/constants';
import { Button } from '../ui/Button';

export function InquiryForm({
  compact = false,
  defaultSubject,
}: {
  compact?: boolean;
  defaultSubject?: string;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    state: 'Gujarat',
    message: defaultSubject ? `Need support for: ${defaultSubject}` : '',
  });
  const [busy, setBusy] = useState(false);

  const onChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Name, email, and a short note are required.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/enquiries', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: 'Tender alert / bid support',
        subject: defaultSubject || `Enquiry from ${form.state}`,
        message: `${form.message}${form.state ? `\nState: ${form.state}` : ''}`,
      });
      toast.success('Received. Our desk will contact you promptly.');
      setForm({ name: '', email: '', phone: '', state: form.state, message: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not send. Please try again or call our 24/7 desk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={compact ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
      <input
        className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => onChange('name', e.target.value)}
      />
      <input
        className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
      />
      <input
        className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        placeholder="Phone / WhatsApp"
        value={form.phone}
        onChange={(e) => onChange('phone', e.target.value)}
      />
      <select
        className="w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp"
        value={form.state}
        onChange={(e) => onChange('state', e.target.value)}
      >
        {INDIAN_STATES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <textarea
        className={`w-full border border-rule bg-paper px-3 py-2.5 text-sm outline-none focus:border-stamp ${compact ? '' : 'sm:col-span-2'}`}
        rows={compact ? 3 : 4}
        placeholder="Products or services you sell, or the tender you want help with"
        value={form.message}
        onChange={(e) => onChange('message', e.target.value)}
      />
      <div className={compact ? '' : 'sm:col-span-2'}>
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy ? 'Sending…' : 'Send enquiry'}
        </Button>
        <p className="mt-2 text-[11px] text-ink-soft">Your details stay with SmartBid. We do not sell lead lists.</p>
      </div>
    </form>
  );
}
