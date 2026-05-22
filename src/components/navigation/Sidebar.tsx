'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Activity, ScrollText,
  Bell, Cpu, Puzzle, Settings, ChevronRight,
  ChevronLeft, Zap, Wifi, Users, Database,
  GitBranch, Shield, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, useAlertsStore } from '@/store';

const NAV_SECTIONS = [
  {
    label: 'Observe',
    items: [
      { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard, href: '/' },
      { id: 'metrics', label: 'Metrics', icon: Activity, href: '/metrics' },
      { id: 'logs', label: 'Logs', icon: ScrollText, href: '/logs' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { id: 'alerts', label: 'Alerting', icon: Bell, href: '/alerts' },
      { id: 'devices', label: 'Devices', icon: Cpu, href: '/devices' },
      { id: 'uptime', label: 'Uptime', icon: Clock, href: '/uptime' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { id: 'datasources', label: 'Data Sources', icon: Database, href: '/datasources' },
      { id: 'plugins', label: 'Plugins', icon: Puzzle, href: '/plugins' },
      { id: 'team', label: 'Team', icon: Users, href: '/team' },
      { id: 'access', label: 'Access Control', icon: Shield, href: '/access' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'api', label: 'API', icon: GitBranch, href: '/api-explorer' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore();
  const { alerts } = useAlertsStore();
  const pathname = usePathname();
  const firingCount = alerts.filter(a => a.state === 'firing').length;

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border)] overflow-hidden"
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-[var(--border)] shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-bold text-[var(--text-primary)] text-base tracking-tight whitespace-nowrap">
                Vizora
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto">
            <Zap size={14} className="text-white" />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={toggle}
            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-thin">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 mb-1"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const badge = item.id === 'alerts' && firingCount > 0 ? firingCount : undefined;

              return (
                <Link key={item.id} href={item.href}>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group relative',
                      isActive
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                    )}
                  >
                    <div className="relative shrink-0">
                      <Icon size={16} />
                      {badge && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {badge}
                        </span>
                      )}
                    </div>

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.12 }}
                          className="text-xs font-medium whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[var(--accent)] rounded-full"
                      />
                    )}

                    {/* Tooltip for collapsed */}
                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--surface-3)] border border-[var(--border)] rounded-md text-xs text-[var(--text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Status Indicator */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="flex items-center gap-1.5 shrink-0">
            <Wifi size={12} className="text-emerald-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] text-emerald-400 font-medium whitespace-nowrap"
              >
                Live · Connected
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={toggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--surface-3)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all z-50"
        >
          <ChevronRight size={12} />
        </button>
      )}
    </motion.aside>
  );
}