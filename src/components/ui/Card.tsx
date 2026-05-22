'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface CardProps extends HTMLMotionProps<'div'> {
  glass?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, hover = false, padding = 'md', border = true, children, ...props }, ref) => {
    const padMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'rounded-xl',
          glass && 'bg-[var(--card-bg)] backdrop-blur-md',
          border && 'border border-[var(--border)]',
          padMap[padding],
          hover && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';

interface CardHeaderProps { title: string; subtitle?: string; actions?: React.ReactNode; className?: string; }
export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-3', className)}>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}