'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Bell, Sun, Moon, Plus, RefreshCw,
  ChevronDown, Settings, LogOut, User,
  Clock, Calendar, ChevronRight,
} from 'lucide-react';
import { useThemeStore, useAlertsStore, useUserStore, useSidebarStore } from '@/store';
import { MOCK_ALERTS } from '@/services/mockData';

const W_OPEN = 240;
const W_COLLAPSED = 56;

const TIME_PRESETS = [
  { label: 'Last 5 minutes',  value: 'now-5m'  },
  { label: 'Last 15 minutes', value: 'now-15m' },
  { label: 'Last 1 hour',     value: 'now-1h'  },
  { label: 'Last 3 hours',    value: 'now-3h'  },
  { label: 'Last 6 hours',    value: 'now-6h'  },
  { label: 'Last 12 hours',   value: 'now-12h' },
  { label: 'Last 24 hours',   value: 'now-24h' },
  { label: 'Last 7 days',     value: 'now-7d'  },
  { label: 'Last 30 days',    value: 'now-30d' },
];

/* ── Breadcrumb map ── */
const BREADCRUMBS: Record<string, { label: string; parent?: string; parentHref?: string }> = {
  '/':              { label: 'Home' },
  '/dashboards':    { label: 'Dashboards' },
  '/dashboards/new':{ label: 'New dashboard', parent: 'Dashboards', parentHref: '/dashboards' },
  '/metrics':       { label: 'Explore' },
  '/alerts':        { label: 'Alerting' },
  '/datasources':   { label: 'Connections' },
  '/plugins':       { label: 'Connections', },
  '/settings':      { label: 'Administration' },
  '/team':          { label: 'Administration' },
  '/devices':       { label: 'Drilldown' },
  '/logs':          { label: 'Drilldown' },
};

function Breadcrumb({ pathname }: { pathname: string }) {
  const base = '/' + pathname.split('/').filter(Boolean)[0];
  const info = BREADCRUMBS[pathname] ?? BREADCRUMBS[base];
  if (!info) return null;

  const isPlugin = pathname.startsWith('/plugins/') && pathname !== '/plugins';
  const pluginName = isPlugin ? pathname.split('/').pop()?.replace(/-/g, ' ') : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
      {info.parent && (
        <>
          <Link href={info.parentHref ?? '/'} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 400 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            {info.parent}
          </Link>
          <ChevronRight size={12} />
        </>
      )}
      {isPlugin && (
        <>
          <Link href="/plugins" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            Connections
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{pluginName}</span>
        </>
      )}
      {!isPlugin && (
        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{info.label}</span>
      )}
    </div>
  );
}

/* ── Icon button ── */
function IconBtn({ children, onClick, title, active, badge }: {
  children: React.ReactNode; onClick?: () => void;
  title?: string; active?: boolean; badge?: number;
}) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width: 32, height: 32, borderRadius: 7,
        border: active ? '1px solid var(--border-2)' : '1px solid transparent',
        background: active ? 'var(--surface-2)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-secondary)',
        position: 'relative', transition: 'all 0.12s', flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? 'var(--surface-2)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = active ? 'var(--border-2)' : 'transparent'; }}
    >
      {children}
      {badge != null && badge > 0 && (
        <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '1.5px solid var(--nav-bg)' }} />
      )}
    </button>
  );
}

/* ── Dropdown wrapper ── */
function Dropdown({ trigger, children, align = 'right', width = 280 }: {
  trigger: React.ReactNode; children: React.ReactNode;
  align?: 'left' | 'right'; width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(v => !v)} style={{ cursor: 'pointer' }}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)',
              [align === 'right' ? 'right' : 'left']: 0,
              width, zIndex: 200,
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore();
  const { alerts } = useAlertsStore();
  const { currentUser } = useUserStore();
  const { collapsed } = useSidebarStore();
  const pathname = usePathname();

  const [selectedTime, setSelectedTime] = useState('Last 1 hour');
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchVal, setSearchVal]       = useState('');
  const firingAlerts = alerts.filter(a => a.state === 'firing');

  const sidebarWidth = collapsed ? W_COLLAPSED : W_OPEN;

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, right: 0, zIndex: 30,
        left: sidebarWidth,
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--border)',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ── Breadcrumb ── */}
        <div style={{ flex: '0 0 auto', minWidth: 0 }}>
          <Breadcrumb pathname={pathname} />
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Search ── */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 13, minWidth: 200,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
          >
            <Search size={14} />
            <span style={{ flex: 1, textAlign: 'left' }}>Search...</span>
            <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* ── Time range ── */}
        <Dropdown
          width={220}
          trigger={
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12,
              transition: 'all 0.12s',
            }}>
              <Clock size={13} color="var(--text-muted)" />
              <span>{selectedTime}</span>
              <ChevronDown size={11} color="var(--text-muted)" />
            </button>
          }
        >
          <div style={{ padding: '6px 0' }}>
            <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick ranges</div>
            {TIME_PRESETS.map(t => (
              <button key={t.value} onClick={() => setSelectedTime(t.label)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 12px', background: selectedTime === t.label ? 'var(--accent-soft)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  color: selectedTime === t.label ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: selectedTime === t.label ? 500 : 400,
                  transition: 'background 0.1s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (selectedTime !== t.label) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (selectedTime !== t.label) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {t.label}
                {selectedTime === t.label && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* ── Refresh ── */}
        <IconBtn title="Refresh">
          <RefreshCw size={15} />
        </IconBtn>

        {/* ── New ── */}
        <Dropdown
          width={200}
          align="right"
          trigger={
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: 'var(--accent)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 2px 8px rgba(88,101,242,0.35)',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
            >
              <Plus size={15} />
              New
              <ChevronDown size={11} />
            </button>
          }
        >
          <div style={{ padding: '6px 0' }}>
            {[
              { label: 'Dashboard',     href: '/dashboards/new', emoji: '📊' },
              { label: 'Alert rule',    href: '/alerts/new',     emoji: '🔔' },
              { label: 'Data source',   href: '/plugins',        emoji: '🔌' },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Dropdown>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

        {/* ── Theme ── */}
        <IconBtn onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </IconBtn>

        {/* ── Notifications ── */}
        <Dropdown
          width={340}
          trigger={
            <div>
              <IconBtn badge={firingAlerts.length}>
                <Bell size={15} />
              </IconBtn>
            </div>
          }
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
              {firingAlerts.length > 0 && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--red-soft)', color: 'var(--red)', fontWeight: 600 }}>
                  {firingAlerts.length} firing
                </span>
              )}
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {MOCK_ALERTS.slice(0, 6).map(alert => (
                <div key={alert.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: alert.state === 'firing' ? 'var(--red)' : alert.state === 'pending' ? 'var(--amber)' : 'var(--green)', ...(alert.state === 'firing' ? { animation: 'pulse-dot 2s infinite' } : {}) }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '8px 14px' }}>
              <Link href="/alerts" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View all alerts →</Link>
            </div>
          </div>
        </Dropdown>

        {/* ── Profile ── */}
        <Dropdown
          width={220}
          trigger={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px 3px 3px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #5865f2, #7b8cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {currentUser?.name?.[0] ?? 'A'}
              </div>
              <ChevronDown size={11} color="var(--text-muted)" />
            </div>
          }
        >
          <div>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.name ?? 'Admin'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{currentUser?.email ?? 'admin@iotrenetics.com'}</p>
              <div style={{ marginTop: 6, display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {currentUser?.role ?? 'Admin'}
              </div>
            </div>
            {[
              { icon: User,     label: 'Profile',  href: '/profile'  },
              { icon: Settings, label: 'Settings', href: '/settings' },
            ].map(({ icon: Icon, label, href }) => (
              <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Icon size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{label}</span>
                </div>
              </Link>
            ))}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-soft)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <LogOut size={14} color="var(--red)" />
                <span style={{ fontSize: 13, color: 'var(--red)' }}>Sign out</span>
              </button>
            </div>
          </div>
        </Dropdown>
      </header>

      {/* ── Global search modal ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 560, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  autoFocus value={searchVal} onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search dashboards, metrics, alerts..."
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit' }}
                />
                <kbd onClick={() => setSearchOpen(false)} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer' }}>ESC</kbd>
              </div>
              <div style={{ padding: '8px 0' }}>
                {[
                  { label: 'System Overview',   type: 'Dashboard', href: '/dashboards' },
                  { label: 'MQTT Device Fleet', type: 'Dashboard', href: '/dashboards' },
                  { label: 'CPU Usage Alerts',  type: 'Alert',     href: '/alerts' },
                  { label: 'InfluxDB Primary',  type: 'Data source', href: '/datasources' },
                ].filter(r => !searchVal || r.label.toLowerCase().includes(searchVal.toLowerCase())).map(r => (
                  <Link key={r.label} href={r.href} style={{ textDecoration: 'none' }} onClick={() => setSearchOpen(false)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600 }}>{r.type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}