import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatNumber(n: number, decimals = 1): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

export function formatUptime(pct: number): string { return `${pct.toFixed(1)}%`; }

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning:  '#f59e0b',
  info:     '#3b82f6',
  success:  '#22c55e',
} as const;

export const LEVEL_COLORS = {
  debug: '#6b7280',
  info:  '#3b82f6',
  warn:  '#f59e0b',
  error: '#ef4444',
  fatal: '#a855f7',
} as const;

export const STATUS_COLORS = {
  online:  '#22c55e',
  offline: '#ef4444',
  warning: '#f59e0b',
} as const;

export const CHART_COLORS = {
  primary:   '#6366f1',
  secondary: '#22d3ee',
  tertiary:  '#f59e0b',
  success:   '#22c55e',
  danger:    '#ef4444',
  muted:     '#64748b',
} as const;
