import { useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2, Phone, Mail, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export function WhatsAppFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Tender Bidding Assistance',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please enter your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/enquiries', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        service: form.service,
        subject: `Direct On-Site Message: ${form.service}`,
        message: form.message.trim(),
      });

      setSubmitted(true);
      toast.success('Message sent directly to the SmartBid admin desk!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      name: '',
      phone: '',
      email: '',
      service: 'Tender Bidding Assistance',
      message: '',
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Card / Popup Form */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[390px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-[#0A2342] px-5 py-4 text-white flex items-center justify-between border-b border-[#C8932C]/30">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8932C] text-[#0A2342] font-bold shadow-sm">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-snug">SmartBid Desk</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Direct Message to Admin
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5">
            {submitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Message Delivered!</h4>
                <p className="text-xs text-slate-600 leading-relaxed max-w-[280px] mx-auto">
                  Your message has been directly received by the admin at our Ahmedabad desk. We will review your request and contact you promptly.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    Send Another Note
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 XXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Requirement / Service</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="Tender Bidding Assistance">Tender Bidding Assistance</option>
                    <option value="GeM Registration & Profile">GeM Registration & Profile</option>
                    <option value="Tender Document Scrutiny">Tender Document Scrutiny</option>
                    <option value="Vendor Assessment & OEM Approval">Vendor Assessment & OEM</option>
                    <option value="General Procurement Inquiry">General Procurement Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Message / Bid Details *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell the desk which tender or service you need help with..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? 'Sending to Admin…' : 'Send Message to Admin'}
                </button>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                  <span>Direct 24/7 Helpline:</span>
                  <a href="tel:+917016235257" className="font-semibold text-blue-700 hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" /> +91 70162 35257
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-900 hover:bg-blue-600 text-white px-4 py-3 text-sm font-semibold shadow-xl transition-all duration-200 hover:scale-105 border border-slate-700"
        aria-label="Message the desk"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <MessageSquare className="h-4 w-4" />
        <span>Message Desk</span>
      </button>
    </div>
  );
}
