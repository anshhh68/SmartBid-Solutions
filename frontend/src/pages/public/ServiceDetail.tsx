import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { CheckCircle, ArrowLeft, Phone } from 'lucide-react';

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: svc, isLoading, isError } = useQuery({
    queryKey: ['service', slug],
    queryFn: () => api.get(`/services/${slug}`).then(r => r.data.service),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-slate-100 rounded mb-2" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
    </div>
  );

  if (isError || !svc) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-500">Service not found.</p>
      <Link to="/services" className="mt-4 inline-block text-blue-700 font-medium">← Back to Services</Link>
    </div>
  );

  return (
    <div className="bg-paper min-h-screen">
      <div className="border-b border-rule bg-ink py-14 text-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/services" className="inline-flex items-center gap-2 text-ochre hover:text-paper mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Services
          </Link>
          <h1 className="font-display text-4xl mb-3">{svc.title}</h1>
          <p className="text-paper/75 text-lg max-w-2xl">{svc.shortDesc}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-rule p-8 shadow-sm">
              <h2 className="font-bold text-ink text-xl mb-4">About This Service</h2>
              <p className="text-ink-soft leading-relaxed">{svc.description}</p>
            </div>

            {svc.features?.length > 0 && (
              <div className="bg-white rounded-2xl border border-rule p-8 shadow-sm">
                <h2 className="font-bold text-ink text-xl mb-5">What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {svc.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-3 p-3 bg-paper-2 rounded-lg border border-rule">
                      <CheckCircle className="w-4 h-4 text-ochre flex-shrink-0" />
                      <span className="text-sm text-ink">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-ink text-paper rounded-2xl p-6 border border-rule shadow-sm">
              <h3 className="font-display text-xl mb-2">Get Started Today</h3>
              <p className="text-paper/75 text-sm mb-5 leading-relaxed">
                Contact our desk for a free consultation about this service.
              </p>
              <Link
                to="/contact"
                className="block text-center py-3 bg-ochre hover:bg-[#b08024] text-white font-bold rounded-xl text-sm transition-all shadow-sm mb-3"
              >
                Request Free Consultation
              </Link>
              <a
                href="tel:+917016235257"
                className="flex items-center justify-center gap-2 py-3 border border-paper/30 hover:bg-paper/10 text-paper font-semibold rounded-xl text-sm transition-colors"
              >
                <Phone className="w-4 h-4 text-ochre" /> Call Us Now
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-rule p-5 shadow-sm">
              <h3 className="font-semibold text-ink mb-4 text-sm">Other Services</h3>
              <div className="space-y-2">
                {['GeM Registration & Bidding', 'E-Tender Bidding Assistance', 'Digital Signature Certificate', 'ISO Certification Assistance'].map(s => (
                  <div key={s} className="text-sm text-stamp hover:text-ochre hover:underline cursor-pointer transition-colors">{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
