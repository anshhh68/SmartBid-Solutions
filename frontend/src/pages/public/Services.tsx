import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { ChevronRight, Award } from 'lucide-react';

export default function Services() {
  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data.services),
  });

  return (
    <div className="bg-paper min-h-screen">
      <div className="border-b border-rule bg-ink py-16 text-paper">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-4xl">What we file</h1>
          <p className="mt-3 max-w-2xl text-paper/70">
            GeM, e-tender, DSC, ISO, and the paperwork that actually gets a bid accepted.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded mb-3 w-2/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data || []).map((svc: any) => (
              <div key={svc.id} className="bg-white rounded-2xl border border-rule hover:border-ochre/40 hover:shadow-md transition-all p-6 group shadow-sm">
                <div className="w-12 h-12 bg-[#0A2342]/10 group-hover:bg-stamp text-stamp group-hover:text-ochre rounded-xl flex items-center justify-center mb-4 transition-all">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="font-bold text-ink mb-2 text-lg group-hover:text-stamp transition-colors">{svc.title}</h2>
                <p className="text-sm text-ink-soft mb-4 leading-relaxed">{svc.shortDesc}</p>

                {svc.features?.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {svc.features.slice(0, 4).map((f: string) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink-soft">
                        <span className="w-1.5 h-1.5 bg-ochre rounded-full flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <Link
                  to={`/services/${svc.slug}`}
                  className="flex items-center gap-1.5 text-sm font-semibold text-stamp group-hover:text-ochre group-hover:gap-2 transition-all"
                >
                  Learn More <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-ink rounded-3xl p-10 text-center text-paper border border-rule">
          <h2 className="font-display text-3xl mb-3">Not sure which service you need?</h2>
          <p className="text-paper/75 mb-6 max-w-xl mx-auto text-sm">
            Get a free consultation and we'll guide you to the right solution for your business.
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-ochre hover:bg-[#b08024] text-white font-bold rounded-xl transition-all shadow-sm"
          >
            Get Free Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
