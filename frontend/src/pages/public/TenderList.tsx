import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import api from '../../lib/api';
import { INDIAN_STATES } from '../../lib/constants';
import { SourceTabs } from '../../components/tenders/SourceTabs';
import { TenderRow, type TenderLite } from '../../components/tenders/TenderRow';

export default function TenderList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    state: searchParams.get('state') || '',
    status: searchParams.get('status') || 'ACTIVE',
    source: searchParams.get('source') || '',
    sortBy: searchParams.get('sortBy') || 'closingDate',
    sortOrder: searchParams.get('sortOrder') || 'asc',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['tender-categories'],
    queryFn: () => api.get('/tenders/categories').then((r) => r.data.categories),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tenders', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v != null) params.set(k, String(v));
      });
      params.set('limit', '15');
      return api.get(`/tenders?${params}`).then((r) => r.data);
    },
    placeholderData: (prev) => prev,
  });

  const updateFilter = (key: string, value: string | number) => {
    const next = { ...filters, [key]: value, page: key !== 'page' ? 1 : Number(value) };
    setFilters(next);
    const params: Record<string, string> = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== '' && !(k === 'status' && v === 'ACTIVE') && !(k === 'sortBy' && v === 'closingDate') && !(k === 'sortOrder' && v === 'asc') && !(k === 'page' && Number(v) === 1)) {
        params[k] = String(v);
      }
    });
    setSearchParams(params);
  };

  const tenders: TenderLite[] = data?.tenders || [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stamp">Public notice board</p>
      <h1 className="mt-2 font-display text-4xl">Tenders on file</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Live GeM, railway, CPPP, and state notices we are tracking. Ask the desk if a lot looks right for you; we will say if the eligibility is a waste of time.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Title, department, reference…"
            className="w-full border border-rule bg-paper py-2.5 pl-10 pr-8 text-sm outline-none focus:border-stamp"
          />
          {filters.search && (
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => updateFilter('search', '')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={filters.state}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="border border-rule bg-paper px-3 py-2.5 text-sm"
        >
          <option value="">All states</option>
          {INDIAN_STATES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="border border-rule bg-paper px-3 py-2.5 text-sm"
        >
          <option value="">All sectors</option>
          {(categoriesData || []).map((c: any) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <SourceTabs value={filters.source} onChange={(id) => updateFilter('source', id)} />
      </div>

      <div className="mt-2">
        {isLoading && <p className="py-10 text-sm text-ink-soft">Pulling notices…</p>}
        {tenders.map((t) => (
          <TenderRow key={t.id} tender={t} />
        ))}
        {!isLoading && tenders.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-soft">Nothing matches. Widen the state or drop the keyword.</p>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-rule pt-4 text-sm">
          <button
            type="button"
            disabled={!pagination.hasPrev}
            onClick={() => updateFilter('page', filters.page - 1)}
            className="disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-ink-soft">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNext}
            onClick={() => updateFilter('page', filters.page + 1)}
            className="disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
