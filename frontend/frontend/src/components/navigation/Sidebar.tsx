'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Activity, ScrollText,
  Bell, Cpu, Puzzle, Settings, ChevronRight, ChevronDown,
  Zap, Wifi, Users, Database, GitBranch, Shield, Clock,
  Bookmark, Star, Compass, TrendingUp, PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertsStore } from '@/store';

/* ─── Nav tree (mirrors Grafana's structure) ─── */
const NAV_ITEMS = [
  { id: 'home',       label: 'Home',       icon: LayoutDashboard, href: '/' },
  { id: 'bookmarks',  label: 'Bookmarks',  icon: Bookmark,        href: '/bookmarks',  collapsible: true },
  { id: 'starred',    label: 'Starred',    icon: Star,            href: '/starred',    collapsible: true },
  { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, href: '/dashboards', collapsible: true },
  { id: 'explore',    label: 'Explore',    icon: Compass,         href: '/explore' },
  {
    id: 'drilldown', label: 'Drilldown', icon: TrendingUp, href: '/drilldown',
    collapsible: true,
    children: [
      { id: 'metrics', label: 'Metrics', href: '/metrics' },
      { id: 'logs',    label: 'Logs',    href: '/logs' },
      { id: 'traces',  label: 'Traces',  href: '/traces' },
      { id: 'profiles',label: 'Profiles',href: '/profiles' },
    ],
  },
];

const BOTTOM_ITEMS = [
  { id: 'alerts',   label: 'Alerting',    icon: Bell,      href: '/alerts',      collapsible: true },
  { id: 'connections', label: 'Connections', icon: Wifi,   href: '/connections', collapsible: true },
  { id: 'admin',    label: 'Administration', icon: Shield, href: '/admin',       collapsible: true },
];

export function Sidebar() {
  const { alerts } = useAlertsStore();
  const pathname = usePathname();
  const firingCount = alerts.filter(a => a.state === 'firing').length;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ drilldown: true });

  const toggleExpand = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const renderItem = (item: typeof NAV_ITEMS[0] & { children?: { id: string; label: string; href: string }[] }) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    const isOpen = expanded[item.id];
    const hasChildren = item.children && item.children.length > 0;
    const badge = item.id === 'alerts' && firingCount > 0 ? firingCount : undefined;

    return (
      <div key={item.id}>
        <div
          className={cn(
            'flex items-center justify-between px-2 py-[5px] mx-1 rounded cursor-pointer select-none group',
            'text-[13px] text-[var(--gf-text-secondary)] hover:text-[var(--gf-text)] hover:bg-[var(--gf-hover)]',
            isActive && 'bg-[var(--gf-active-bg)] text-[var(--gf-text)] font-medium'
          )}
          onClick={() => hasChildren || item.collapsible ? toggleExpand(item.id) : null}
        >
          <Link href={item.href} className="flex items-center gap-2.5 flex-1 min-w-0" onClick={e => hasChildren && e.preventDefault()}>
            <item.icon size={16} className="shrink-0 opacity-80" />
            <span className="truncate">{item.label}</span>
            {badge && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                {badge}
              </span>
            )}
          </Link>
          {(hasChildren || item.collapsible) && (
            <ChevronDown
              size={13}
              className={cn('shrink-0 text-[var(--gf-text-muted)] transition-transform', isOpen && 'rotate-180')}
            />
          )}
          {!hasChildren && !item.collapsible && isActive && (
            <div className="w-0.5 h-4 bg-[var(--gf-accent)] rounded-full absolute right-0" />
          )}
        </div>

        {hasChildren && isOpen && (
          <div className="ml-6 border-l border-[var(--gf-border)] pl-0 mt-0.5 mb-1">
            {item.children!.map(child => {
              const childActive = pathname === child.href;
              return (
                <Link key={child.id} href={child.href}>
                  <div className={cn(
                    'px-3 py-[5px] text-[13px] rounded mx-1 cursor-pointer',
                    childActive
                      ? 'text-[var(--gf-text)] font-medium'
                      : 'text-[var(--gf-text-secondary)] hover:text-[var(--gf-text)] hover:bg-[var(--gf-hover)]'
                  )}>
                    {child.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[200px] z-40 flex flex-col bg-[var(--gf-sidebar)] border-r border-[var(--gf-border)]">
      {/* Logo */}
      <div className="h-[41px] flex items-center gap-2 px-3 border-b border-[var(--gf-border)] shrink-0">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center">
          <Zap size={13} className="text-white" />
        </div>
        <span className="font-semibold text-[var(--gf-text)] text-sm tracking-tight">Vizora</span>
        <button className="ml-auto text-[var(--gf-text-muted)] hover:text-[var(--gf-text)]">
          <PanelLeft size={15} />
        </button>
      </div>

      {/* Top nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5 scrollbar-thin space-y-0.5">
        {NAV_ITEMS.map(renderItem)}
      </nav>

      {/* Bottom nav items */}
      <div className="border-t border-[var(--gf-border)] py-1.5 space-y-0.5">
        {BOTTOM_ITEMS.map(renderItem)}
      </div>
    </aside>
  );
}