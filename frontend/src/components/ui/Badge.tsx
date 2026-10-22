import { cn } from '../../lib/cn';

const tones: Record<string, string> = {
  active: 'bg-moss/12 text-moss',
  closed: 'bg-stamp/12 text-stamp',
  upcoming: 'bg-ochre/25 text-ink',
  awarded: 'bg-ink/8 text-ink',
  gem: 'bg-stamp text-paper',
  rail: 'bg-ink text-paper',
  cppp: 'bg-moss text-paper',
  mute: 'bg-ink/8 text-ink-soft',
};

export function Badge({
  children,
  tone = 'mute',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]', tones[tone], className)}>
      {children}
    </span>
  );
}
