'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon?: ReactNode;
  accent?: string;
  className?: string;
  trend?: 'up' | 'down' | 'flat';
  sparkline?: number[];
}

export function StatTile({ label, value, unit, change, icon, accent = 'var(--accent)', className, trend, sparkline }: StatTileProps) {
  const isPositive = (change ?? 0) > 0;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : 'var(--text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-4 flex flex-col gap-3 backdrop-blur-md', className)}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-[var(--text-muted)] font-medium tracking-wide uppercase">{label}</span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}20`, color: accent }}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums leading-none">{value}</span>
        {unit && <span className="text-sm text-[var(--text-muted)] mb-0.5">{unit}</span>}
      </div>

      <div className="flex items-center justify-between">
        {change !== undefined && (
          <span className="text-xs font-medium" style={{ color: trendColor }}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
            <span className="text-[var(--text-muted)] font-normal ml-1">vs last hour</span>
          </span>
        )}
        {sparkline && sparkline.length > 1 && (
          <MiniSparkline data={sparkline} color={accent} />
        )}
      </div>
    </motion.div>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64, h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} opacity="0.8" />
    </svg>
  );
}