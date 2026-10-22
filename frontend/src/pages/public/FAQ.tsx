import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { ChevronDown, ChevronUp, Phone } from 'lucide-react';

const CATEGORIES: Record<string, string> = {
  general: 'General',
  gem: 'GeM Platform',
  tender: 'E-Tender Process',
  dsc: 'Digital Signature',
};

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => api.get('/public/faqs').then(r => r.data.faqs),
  });

  const faqs = data || [];
  const filtered = activeCategory === 'all' ? faqs : faqs.filter((f: any) => f.category === activeCategory);
  const categories = ['all', ...Object.keys(CATEGORIES)];

  return (
    <div className="bg-paper min-h-screen">
      <div className="border-b border-rule bg-ink py-16 text-paper">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-4xl">Questions we hear at the counter</h1>
          <p className="mt-3 text-paper/70">GeM, DSC, eligibility, and how we actually work.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-stamp text-paper shadow-sm'
                  : 'bg-white border border-rule text-ink-soft hover:border-stamp hover:text-ink'
              }`}
            >
              {cat === 'all' ? 'All Questions' : CATEGORIES[cat]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-rule animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq: any) => (
              <div key={faq.id} className="bg-white rounded-xl border border-rule overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-paper-2 transition-colors"
                >
                  <span className="font-semibold text-ink text-sm pr-4">{faq.question}</span>
                  {openId === faq.id
                    ? <ChevronUp className="w-4 h-4 text-ochre flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-ink-soft flex-shrink-0" />}
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-ink-soft leading-relaxed border-t border-rule pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-2xl border border-rule p-8 text-center shadow-sm">
          <h2 className="font-bold text-ink mb-2 text-xl">Didn't find your answer?</h2>
          <p className="text-ink-soft text-sm mb-5">Contact our desk directly — we're always happy to help.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contact" className="px-6 py-2.5 bg-stamp text-paper font-semibold rounded-xl text-sm hover:bg-stamp-deep transition-all shadow-sm">
              Contact Desk
            </Link>
            <a href="tel:+917016235257" className="inline-flex items-center gap-2 px-6 py-2.5 border border-rule text-ink font-semibold rounded-xl text-sm hover:bg-paper-2 transition-colors">
              <Phone className="w-4 h-4 text-ochre" />
              Call Helpline (+91 70162 35257)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
