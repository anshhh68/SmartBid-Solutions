import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Phone, Mail, MapPin, Clock, MessageCircle, MessageSquare, CheckCircle } from 'lucide-react';
import { EMAILS } from '../../lib/constants';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  service: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof schema>;

const SERVICES = [
  'GeM Registration & Bidding',
  'E-Tender Bidding Assistance',
  'Tender Documentation',
  'Digital Signature Certificate',
  'ISO Certification Assistance',
  'Brand & OEM Registration',
  'General Enquiry',
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/enquiries', data);
      setSubmitted(true);
      reset();
      toast.success('Enquiry submitted! We\'ll be in touch shortly.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to submit. Please try again.');
    }
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="border-b border-rule bg-ink py-16 text-paper">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-4xl">Write to the desk</h1>
          <p className="mt-3 max-w-xl text-paper/70">
            Call or send the form anytime. Our Ahmedabad desk is available 24/7 for urgent bid queries and deadlines.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-rule p-6 shadow-sm">
              <h2 className="font-bold text-ink mb-5 text-lg">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#0A2342]/10 text-stamp rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-ink-soft mb-0.5">Helpline (Call / Message)</p>
                    <a
                      href="tel:+917016235257"
                      className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-stamp transition-colors"
                    >
                      +91 70162 35257
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ochre bg-ochre/10 px-1.5 py-0.5 rounded border border-ochre/30">
                        Default
                      </span>
                    </a>
                    <a
                      href="tel:+918511722588"
                      className="flex items-center gap-2 text-xs font-medium text-ink-soft hover:text-stamp transition-colors"
                    >
                      +91 85117 22588
                      <span className="text-[10px] text-ink-soft/70">Alternate</span>
                    </a>
                  </div>
                </div>

                <a href={`mailto:${EMAILS[0]}`} className="flex items-start gap-3 group">
                  <div className="w-10 h-10 bg-[#0A2342]/10 text-stamp rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-stamp group-hover:text-paper transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-ink group-hover:text-stamp transition-colors break-all">{EMAILS[0]}</p>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#0A2342]/10 text-stamp rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft mb-0.5">Location</p>
                    <p className="text-sm font-semibold text-ink">Ahmedabad, Gujarat, India</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#0A2342]/10 text-stamp rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft mb-0.5">Availability & Support</p>
                    <p className="text-sm font-semibold text-ink">24/7 Desk Availability</p>
                    <p className="text-xs text-ink-soft">Round-the-clock bid deadline assistance</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="#contact-form"
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-stamp hover:bg-stamp-deep text-paper font-semibold rounded-xl transition-all shadow-sm"
            >
              <MessageSquare className="w-5 h-5" />
              Send Direct Message Below
            </a>

            <div className="bg-paper-2 border border-rule rounded-2xl p-5">
              <h3 className="font-semibold text-ink mb-2 text-sm">Quick Response Guarantee</h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                We respond to all enquiries within 4 business hours. For urgent matters, please call our 24/7 helpline directly.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white rounded-2xl border border-rule p-10 text-center shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-ink mb-2">Enquiry Submitted!</h2>
                <p className="text-ink-soft mb-6 text-sm">
                  Thank you for contacting us. Our team will get back to you promptly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-stamp text-paper rounded-xl font-medium text-sm hover:bg-stamp-deep transition-colors"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <div id="contact-form" className="bg-white rounded-2xl border border-rule p-8 scroll-mt-24 shadow-sm">
                <h2 className="font-bold text-ink text-xl mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Full Name *</label>
                      <input
                        {...register('name')}
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Email Address *</label>
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="your@email.com"
                        className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Phone Number</label>
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-1.5">Service Interest</label>
                      <select
                        {...register('service')}
                        className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper"
                      >
                        <option value="">Select a service</option>
                        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Subject</label>
                    <input
                      {...register('subject')}
                      placeholder="Brief subject of your enquiry"
                      className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1.5">Message *</label>
                    <textarea
                      {...register('message')}
                      rows={5}
                      placeholder="Describe your requirement in detail..."
                      className="w-full px-4 py-2.5 border border-rule rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stamp focus:border-stamp bg-paper resize-none"
                    />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-stamp hover:bg-stamp-deep text-paper font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Enquiry'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
