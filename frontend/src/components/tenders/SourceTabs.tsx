import { cn } from '../../lib/cn';
import { TENDER_SOURCES } from '../../lib/constants';

export function SourceTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-rule">
      {TENDER_SOURCES.map((s) => (
        <button
          key={s.id || 'all'}
          type="button"
          onClick={() => onChange(s.id)}
          className={cn(
            'px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
            value === s.id
              ? 'text-stamp border-b-2 border-stamp -mb-px'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
