import { type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'stamp' | 'ink' | 'gold' | 'ghost' | 'whatsapp';

const styles: Record<Variant, string> = {
  stamp: 'bg-stamp text-paper hover:bg-stamp-deep shadow-sm transition-all',
  ink: 'bg-ink text-paper hover:bg-ink/90 shadow-sm transition-all',
  gold: 'bg-ochre text-white hover:bg-[#b08024] shadow-sm transition-all',
  ghost: 'border border-ink/20 text-ink hover:bg-ink/5 transition-all',
  whatsapp: 'bg-moss text-paper hover:bg-moss/90 shadow-sm transition-all',
};

export function Button({
  variant = 'stamp',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors disabled:opacity-50',
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
