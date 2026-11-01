import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Search } from 'lucide-react';
import { InquiryForm } from '../../components/forms/InquiryForm';
import { SourceTabs } from '../../components/tenders/SourceTabs';
import { TenderRow, type TenderLite } from '../../components/tenders/TenderRow';
import { INDIAN_STATES, PHONES, WHATSAPP_URL } from '../../lib/constants';

const SERVICE_LINES = [
  { n: '01', title: 'Tender reading', body: 'We pull notices that match what you actually sell, not a dump of every GeM lot in the country.', to: '/services' },
  { n: '02', title: 'Bid filing', body: 'BOQ, technical packet, portal login, and deadline watch on GeM, CPPP, IREPS, and nProcure.', to: '/services/e-tender-bidding' },
  { n: '03', title: 'GeM seller desk', body: 'Registration, catalogue, brand approval, and the unglamorous follow-ups that stall new sellers.', to: '/services/gem-registration' },
  { n: '04', title: 'Paper & DSC', body: 'Declarations, ISO files, Class 3 signatures, and the stack buyers ask for at the last hour.', to: '/services/digital-signature' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [state, setState] = useState('Gujarat');
  const [source, setSource] = useState('');
  const navigate = useNavigate();

  const { data: settingsData } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/public/settings').then((r) => r.data.settings),
  });

  const { data: tendersData } = useQuery({
    queryKey: ['home-tenders', source],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '8', status: 'ACTIVE', sortBy: 'closingDate', sortOrder: 'asc' });
      if (source) params.set('source', source);
      return api.get(`/tenders?${params}`).then((r) => r.data);
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['tender-stats'],
    queryFn: () => api.get('/tenders/stats').then((r) => r.data),
  });

  const { data: testimonialsData } = useQuery({
    queryKey: ['testimonials'],
    queryFn: () => api.get('/public/testimonials').then((r) => r.data.testimonials),
  });

  const s = settingsData || {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (state) params.set('state', state);
    navigate(`/tenders?${params.toString()}`);
  };

  return (
    <div>
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stamp">
              Gujarat desk · India-wide portals
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] text-ink sm:text-5xl lg:text-[3.4rem]">
              {s.hero_title || 'Government tenders, read and filed across All India.'}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
              {s.hero_subtitle ||
                'SmartBid Solutions sits between your factory floor and GeM, CPPP, Railway, and nProcure. We find the notice, build the packet, and submit before the clock runs out.'}
            </p>

            <form onSubmit={handleSearch} className="mt-8 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keyword, department, product…"
                  className="w-full border border-ink/20 bg-paper py-3 pl-10 pr-3 text-sm outline-none focus:border-stamp"
                />
              </div>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="border border-ink/20 bg-paper px-3 py-3 text-sm outline-none focus:border-stamp"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
              <button type="submit" className="bg-stamp px-5 py-3 text-sm font-semibold text-paper hover:bg-stamp-deep">
                Search notices
              </button>
            </form>
          </div>

          <aside className="border border-ink/15 bg-paper-2 p-6">
            <p className="font-display text-2xl text-ink">Free sample alerts</p>
            <p className="mt-2 text-sm text-ink-soft">
              Tell us what you supply. We send a shortlist, not a mailing list.
            </p>
            <div className="mt-5">
              <InquiryForm compact />
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-rule bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-6 px-4 py-6">
          <p className="font-display text-lg italic text-paper/80">Desk figures, updated from published notices</p>
          <dl className="flex flex-wrap gap-8 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ochre">On file</dt>
              <dd className="font-display text-3xl">{statsData?.total ?? s.stats_tenders ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ochre">Open now</dt>
              <dd className="font-display text-3xl">{statsData?.active ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-ochre">Closing this week</dt>
              <dd className="font-display text-3xl">{statsData?.closingSoon ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stamp">Notice board</p>
            <h2 className="mt-2 font-display text-3xl">Latest tenders</h2>
          </div>
          <Link to="/tenders" className="text-sm font-semibold text-stamp hover:underline">
            Full board
          </Link>
        </div>
        <SourceTabs value={source} onChange={setSource} />
        <div className="mt-2">
          {(tendersData?.tenders || []).map((t: TenderLite) => (
            <TenderRow key={t.id} tender={t} />
          ))}
          {!tendersData?.tenders?.length && (
            <p className="py-12 text-sm text-ink-soft">No live notices in this filter yet. Ask the desk to load your category.</p>
          )}
        </div>
      </section>

      <section className="border-y border-rule bg-paper-2">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl">How the desk actually works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {SERVICE_LINES.map((item) => (
              <Link key={item.n} to={item.to} className="group grid grid-cols-[auto_1fr] gap-5">
                <span className="font-display text-3xl text-stamp/70">{item.n}</span>
                <div>
                  <h3 className="font-display text-2xl group-hover:text-stamp">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl">Why Gujarat firms keep the number</h2>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink-soft">
            Portals change screens. Deadlines do not. We have been filling GeM, state, and railway packets for MSMEs who cannot hire a full-time tender clerk. The office is at Delhi Darwaja, not in a WeWork in another city.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              'GeM, CPPP, IREPS, nProcure, and department sites',
              'MSME / EMD exemption checked before you pay a fee you do not owe',
              'Document turnaround in 24–48 hours when the notice is complete',
              'Direct desk updates and round-the-clock advisory',
            ].map((line) => (
              <li key={line} className="border-l-0 border-t border-rule pt-3 first:border-t-0 first:pt-0">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-ink p-8 text-paper">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ochre">24/7 Desk Availability</p>
          <p className="mt-4 font-display text-3xl">Call or message anytime.</p>
          <p className="mt-3 text-sm text-paper/70">
            Urgent bid deadline or query? Our desk is active 24/7 to check eligibility before you waste an EMD.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`tel:${PHONES[0].replace(/\s/g, '')}`} className="bg-stamp px-4 py-2.5 text-sm font-semibold">
              {PHONES[0]}
            </a>
            <Link to="/contact" className="border border-paper/30 px-4 py-2.5 text-sm font-semibold hover:bg-paper/10 transition-colors">
              Send Enquiry
            </Link>
          </div>
        </div>
      </section>

      {testimonialsData?.length > 0 && (
        <section className="border-t border-rule px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl">From the files</h2>
            <div className="mt-8 columns-1 gap-8 md:columns-2">
              {testimonialsData.map((t: any) => (
                <blockquote key={t.id} className="mb-8 break-inside-avoid border-t border-rule pt-4">
                  <p className="font-display text-xl leading-snug">“{t.content}”</p>
                  <footer className="mt-3 text-sm text-ink-soft">
                    {t.name}
                    {t.company ? ` · ${t.company}` : ''}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
