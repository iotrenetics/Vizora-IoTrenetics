import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'critical' | 'warning' | 'success' | 'info' | 'muted';

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  success:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  info:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
  muted:    'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border tracking-wider uppercase',
      variants[variant], className
    )}>
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-red-400': variant === 'critical',
          'bg-amber-400': variant === 'warning',
          'bg-emerald-400': variant === 'success',
          'bg-blue-400': variant === 'info',
          'bg-[var(--accent)]': variant === 'default',
          'animate-pulse': variant === 'critical' || variant === 'warning',
        })} />
      )}
      {children}
    </span>
  );
}