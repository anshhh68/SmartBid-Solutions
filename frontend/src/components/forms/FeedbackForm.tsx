import { useState } from 'react';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import api from '../../lib/api';

// Feedback is stored as an enquiry (service "Feedback") so it shows up in Admin → Enquiries.
export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast.error('Please choose a rating.');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return toast.error('Name, email, and feedback are required.');
    }
    setBusy(true);
    try {
      await api.post('/enquiries', {
        name: form.name.trim(),
        email: form.email.trim(),
        service: 'Feedback',
        subject: `Website feedback: ${rating}/5 stars`,
        message: form.message.trim(),
      });
      setSent(true);
      toast.success('Thank you for your feedback!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not send feedback. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return <p className="text-sm text-ink-soft">Thank you! Your feedback helps us improve our service.</p>;
  }

  const input = 'w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
          >
            <Star className={`w-7 h-7 ${n <= (hover || rating) ? 'fill-ochre text-ochre' : 'text-rule'}`} />
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <input className={input} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={input} type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <textarea
        className={`${input} resize-none`}
        rows={4}
        placeholder="Tell us what worked well and what we can do better..."
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <button
        type="submit"
        disabled={busy}
        className="px-6 py-3 bg-stamp hover:bg-stamp-deep text-paper font-bold rounded-xl transition-all disabled:opacity-60"
      >
        {busy ? 'Sending...' : 'Submit Feedback'}
      </button>
    </form>
  );
}
