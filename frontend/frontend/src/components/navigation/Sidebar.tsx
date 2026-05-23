'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown, Zap, PanelLeft,
  Home, Bookmark, Star, LayoutDashboard,
  Compass, TrendingUp, Bell, Database,
  Shield, Settings, Users, Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertsStore } from '@/store';

type NavChild = { id: string; label: string; href: string };
type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  collapsible?: boolean;
  children?: NavChild[];
};

const TOP_ITEMS: NavItem[] = [
  { id: 'home',       label: 'Home',       icon: Home,            href: '/' },
  { id: 'bookmarks',  label: 'Bookmarks',  icon: Bookmark,        href: '/bookmarks',  collapsible: true },
  { id: 'starred',    label: 'Starred',    icon: Star,            href: '/starred',    collapsible: true },
  {
    id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, href: '/dashboards',
    collapsible: true,
    children: [
      { id: 'dashboards-list', label: 'Browse',      href: '/dashboards' },
      { id: 'dashboards-new',  label: 'New dashboard', href: '/dashboards/new' },
      { id: 'dashboards-playlists', label: 'Playlists', href: '/dashboards/playlists' },
      { id: 'dashboards-snapshots', label: 'Snapshots', href: '/dashboards/snapshots' },
    ],
  },
  { id: 'explore', label: 'Explore', icon: Compass, href: '/explore' },
  {
    id: 'drilldown', label: 'Drilldown', icon: TrendingUp, href: '/drilldown',
    collapsible: true,
    children: [
      { id: 'metrics',  label: 'Metrics',  href: '/metrics' },
      { id: 'logs',     label: 'Logs',     href: '/logs' },
      { id: 'traces',   label: 'Traces',   href: '/traces' },
      { id: 'profiles', label: 'Profiles', href: '/profiles' },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    id: 'alerting', label: 'Alerting', icon: Bell, href: '/alerts',
    collapsible: true,
    children: [
      { id: 'alert-rules',        label: 'Alert rules',         href: '/alerts' },
      { id: 'alert-contact',      label: 'Contact points',      href: '/alerts/contact' },
      { id: 'alert-policies',     label: 'Notification policies', href: '/alerts/policies' },
      { id: 'alert-silences',     label: 'Silences',            href: '/alerts/silences' },
    ],
  },
  {
    id: 'connections', label: 'Connections', icon: Plug, href: '/connections',
    collapsible: true,
    children: [
      { id: 'datasources',     label: 'Data sources',     href: '/datasources' },
      { id: 'plugins',         label: 'Plugins',          href: '/plugins' },
      { id: 'conn-connect',    label: 'Connect data',     href: '/connections/connect' },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: Shield, href: '/admin',
    collapsible: true,
    children: [
      { id: 'admin-users',  label: 'Users',         href: '/team' },
      { id: 'admin-teams',  label: 'Teams',         href: '/team/teams' },
      { id: 'admin-access', label: 'Access control', href: '/access' },
      { id: 'admin-settings', label: 'Settings',    href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const { alerts } = useAlertsStore();
  const pathname = usePathname();
  const firingCount = alerts.filter(a => a.state === 'firing').length;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    const isOpen = expanded[item.id];
    const hasChildren = !!item.children?.length;
    const badge = item.id === 'alerting' && firingCount > 0 ? firingCount : undefined;

    return (
      <div key={item.id}>
        {/* Row */}
        <div
          onClick={() => (hasChildren || item.collapsible) && toggle(item.id)}
          className={cn(
            'flex items-center gap-2 px-2 py-[5px] mx-1 rounded cursor-pointer select-none',
            'text-[13px] text-[var(--gf-text-secondary)] hover:text-[var(--gf-text)] hover:bg-[var(--gf-hover)] transition-colors',
            isActive && !hasChildren && 'bg-[var(--gf-active-bg)] text-[var(--gf-text)] font-medium'
          )}
        >
          {/* Icon + label — navigate only if no children */}
          {hasChildren ? (
            <>
              <item.icon size={15} className="shrink-0 opacity-75" />
              <span className="flex-1 truncate">{item.label}</span>
            </>
          ) : (
            <Link href={item.href} className="flex items-center gap-2 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
              <item.icon size={15} className="shrink-0 opacity-75" />
              <span className="truncate">{item.label}</span>
            </Link>
          )}

          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
              {badge}
            </span>
          )}
          {(hasChildren || item.collapsible) && (
            <ChevronDown size={12} className={cn('shrink-0 text-[var(--gf-text-muted)] transition-transform duration-150', isOpen && 'rotate-180')} />
          )}
        </div>

        {/* Children */}
        {hasChildren && isOpen && (
          <div className="ml-[26px] border-l border-[var(--gf-border)] mb-1">
            {item.children!.map(child => {
              const childActive = pathname === child.href;
              return (
                <Link key={child.id} href={child.href}>
                  <div className={cn(
                    'pl-3 pr-2 py-[5px] mx-1 rounded text-[13px] cursor-pointer transition-colors',
                    childActive
                      ? 'text-[var(--gf-text)] font-medium bg-[var(--gf-active-bg)]'
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
        <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center shrink-0">
          <Zap size={12} className="text-white" />
        </div>
        <span className="font-semibold text-[var(--gf-text)] text-sm tracking-tight">Vizora</span>
        <button className="ml-auto text-[var(--gf-text-muted)] hover:text-[var(--gf-text)] transition-colors">
          <PanelLeft size={14} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 scrollbar-thin">
        {TOP_ITEMS.map(renderItem)}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[var(--gf-border)] py-2 space-y-0.5">
        {BOTTOM_ITEMS.map(renderItem)}
      </div>

    </aside>
  );
}