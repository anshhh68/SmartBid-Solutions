import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { FileText, Lock, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { InquiryForm } from '../../components/forms/InquiryForm';
import { Badge } from '../../components/ui/Badge';
import { daysUntil, formatINR, PRIMARY_PHONE, WHATSAPP_URL } from '../../lib/constants';

export default function TenderDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tender', id],
    queryFn: () => api.get(`/tenders/${id}`).then((r) => r.data.tender),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-ink-soft">Opening notice…</div>;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="font-display text-3xl">Notice not on file</h2>
        <Link to="/tenders" className="mt-4 inline-block text-stamp">Back to the board</Link>
      </div>
    );
  }

  const tender = data;
  const left = daysUntil(tender.closingDate);
  const hasAdminAccess = isAdmin || tender.accessLevel === 'ADMIN';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <Link to="/tenders" className="text-xs font-semibold uppercase tracking-wider text-stamp hover:underline">
          ← All notices
        </Link>
        {hasAdminAccess ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-900">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            Admin Full Access Mode
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            <Lock className="h-3 w-3" />
            Essential Public Information
          </span>
        )}
      </div>

      {/* Admin banner if staff is logged in */}
      {hasAdminAccess && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-amber-300 bg-amber-50/70 p-3.5 text-xs text-amber-950">
          <div>
            <span className="font-bold">Staff Console Access:</span> Complete tender dossier, official NIT document links, and direct GeM procurement endpoints are unlocked.
          </div>
          <Link
            to={`/admin/tenders/${tender.id}/edit`}
            className="font-semibold underline hover:text-amber-800"
          >
            Edit in Admin Panel →
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {tender.source && <Badge tone="gem">{tender.source}</Badge>}
        <Badge tone={tender.status === 'ACTIVE' ? 'active' : 'mute'}>{tender.status}</Badge>
        {left > 0 && left <= 7 && <Badge tone="closed">{left} days left</Badge>}
      </div>

      <h1 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{tender.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {tender.department} · {tender.location}
        {tender.state ? `, ${tender.state}` : ''}
        {tender.refNo ? ` · Ref ${tender.refNo}` : ''}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-rule md:grid-cols-4">
        {[
          ['Due date', format(new Date(tender.closingDate), 'dd MMM yyyy')],
          ['Value', formatINR(tender.value)],
          ['Published', tender.publishedAt ? formatDistanceToNow(new Date(tender.publishedAt), { addSuffix: true }) : '—'],
          ['Views', String(tender.viewCount ?? 0)],
        ].map(([k, v]) => (
          <div key={k} className="bg-paper p-4">
            <dt className="text-[10px] uppercase tracking-widest text-ink-soft">{k}</dt>
            <dd className="mt-1 font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-8">
          {tender.description && (
            <section>
              <h2 className="font-display text-2xl">Scope of Work</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{tender.description}</p>
            </section>
          )}

          {tender.eligibility && (
            <section>
              <h2 className="font-display text-2xl">Eligibility & Criteria</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{tender.eligibility}</p>
            </section>
          )}

          {/* Role-based Document Access */}
          {hasAdminAccess ? (
            /* ADMIN: Complete Document Details & Direct URLs */
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Official Documents (Admin)</h2>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                  Full Access
                </span>
              </div>
              {Array.isArray(tender.documents) && tender.documents.length > 0 ? (
                <ul className="mt-3 divide-y divide-rule border-y border-rule">
                  {tender.documents.map((doc: any, i: number) => (
                    <li key={i} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-stamp" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-stamp hover:underline"
                      >
                        Download PDF <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-soft italic">No document attachments uploaded.</p>
              )}
            </section>
          ) : (
            /* CUSTOMER: Essential overview with Managed Desk Access */
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Official Documents & BOQ</h2>
                <span className="inline-flex items-center gap-1 border border-rule px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                  <Lock className="h-3 w-3" /> Desk-Managed Access
                </span>
              </div>
              <div className="mt-3 border border-rule bg-paper p-5">
                <div className="flex items-start gap-3.5">
                  <div className="border border-rule bg-paper-2 p-2.5 text-ink-soft">
                    <FileText className="h-5 w-5 text-stamp" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-semibold text-ink">
                      Official NIT & Technical BOQ Specifications
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                      Official tender notice documents, technical compliance matrices, and financial schedules of rates are actively cataloged for this notice. To protect vendors from technical disqualification and unviable submissions, complete documentation and compliance vetting are provided directly by our bidding desk.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hello SmartBid Solutions, I am interested in tender ${tender.refNo || tender.title}. Please provide document vetting and bidding assistance.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 text-xs font-semibold text-paper hover:bg-stamp hover:border-stamp transition-colors"
                      >
                        Request Document Review & Filing Support
                      </a>
                      <a
                        href={`tel:${PRIMARY_PHONE}`}
                        className="inline-flex items-center gap-1.5 border border-rule px-3.5 py-2 text-xs font-semibold text-ink hover:border-ink transition-colors"
                      >
                        Call Desk: {PRIMARY_PHONE}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {/* Admin vs Customer Source Link */}
          {hasAdminAccess && tender.sourceUrl ? (
            <a
              href={tender.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-ink px-4 py-3 text-center text-sm font-semibold hover:bg-paper-2 transition-colors"
            >
              Official GeM Source <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <div className="border border-rule bg-paper-2 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">SmartBid Desk Verification</p>
              <p className="mt-1 text-xs text-ink-soft">Our bidding engineers vet all requirements before fee submission.</p>
              <a
                href={`tel:${PRIMARY_PHONE}`}
                className="mt-3 block border border-ink bg-paper py-2 text-xs font-semibold hover:border-stamp hover:text-stamp transition-colors"
              >
                Speak With Bidding Specialist
              </a>
            </div>
          )}

          <div className="border border-rule bg-paper-2 p-5">
            <p className="font-display text-xl">Want this bid filed?</p>
            <p className="mt-2 text-sm text-ink-soft">Send the notice. We reply with a yes, a no, or what is missing.</p>
            <div className="mt-4">
              <InquiryForm compact defaultSubject={tender.title} />
            </div>
            <p className="mt-3 text-center text-xs text-ink-soft">
              Your inquiry is delivered straight to the SmartBid admin desk.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
