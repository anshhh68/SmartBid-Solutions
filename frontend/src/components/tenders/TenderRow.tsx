import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '../ui/Badge';
import { daysUntil, formatINR } from '../../lib/constants';

export type TenderLite = {
  id: string;
  title: string;
  refNo?: string | null;
  department: string;
  location: string;
  state?: string | null;
  value?: number | null;
  status: string;
  closingDate: string;
  source?: string | null;
  category?: { name: string } | null;
};

function sourceTone(source?: string | null) {
  const s = (source || '').toLowerCase();
  if (s.includes('gem')) return 'gem' as const;
  if (s.includes('rail')) return 'rail' as const;
  if (s.includes('cppp') || s.includes('eprocure')) return 'cppp' as const;
  return 'mute' as const;
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'active' as const;
  if (status === 'CLOSED') return 'closed' as const;
  if (status === 'UPCOMING') return 'upcoming' as const;
  return 'mute' as const;
}

export function TenderRow({ tender }: { tender: TenderLite }) {
  const left = daysUntil(tender.closingDate);
  const urgent = left <= 7 && left > 0;

  return (
    <article className="grid gap-3 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {tender.refNo && (
            <span className="font-mono text-[11px] text-ink-soft">Ref {tender.refNo}</span>
          )}
          {tender.source && <Badge tone={sourceTone(tender.source)}>{tender.source}</Badge>}
          <Badge tone={statusTone(tender.status)}>{tender.status}</Badge>
          {urgent && <Badge tone="closed">{left} days left</Badge>}
        </div>
        <Link to={`/tenders/${tender.id}`} className="group">
          <h3 className="font-display text-xl font-semibold leading-snug text-ink group-hover:text-stamp">
            {tender.title}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-ink-soft">
          {tender.department}
          <span className="mx-2 text-rule">/</span>
          {tender.location}
          {tender.state ? `, ${tender.state}` : ''}
        </p>
      </div>
      <div className="flex items-end justify-between gap-6 md:flex-col md:items-end">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-ink-soft">Due</p>
          <p className="font-semibold tabular-nums">{format(new Date(tender.closingDate), 'dd MMM yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-ink-soft">Value</p>
          <p className="font-semibold tabular-nums">{formatINR(tender.value)}</p>
        </div>
        <Link
          to={`/tenders/${tender.id}`}
          className="text-xs font-semibold uppercase tracking-wider text-stamp hover:underline"
        >
          Open notice
        </Link>
      </div>
    </article>
  );
}
