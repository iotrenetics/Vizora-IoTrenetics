'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Home, Bookmark, Star, LayoutDashboard, Compass,
  BarChart3, Bell, Database, Settings,
  ChevronDown, ChevronRight, ChevronLeft,
  ArrowLeft,
} from 'lucide-react';
import { useSidebarStore, useAlertsStore } from '@/store';

/* ══════════════════════════════════════════════
   NAV STRUCTURE
══════════════════════════════════════════════ */
const NAV = [
  {
    id: 'home', label: 'Home', icon: Home,
    href: '/', solo: true,
  },
  {
    id: 'bookmarks', label: 'Bookmarks', icon: Bookmark,
    href: '/bookmarks', solo: true,
  },
  {
    id: 'starred', label: 'Starred', icon: Star,
    href: '/starred', solo: true,
  },
  {
    id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard,
    href: '/dashboards',
    children: [
      { id: 'dash-browse', label: 'Browse',        href: '/dashboards' },
      { id: 'dash-new',    label: 'New dashboard', href: '/dashboards/new' },
      { id: 'dash-import', label: 'Import',        href: '/dashboards/import' },
    ],
  },
  {
    id: 'explore', label: 'Explore', icon: Compass,
    href: '/metrics', solo: true,
  },
  {
    id: 'drilldown', label: 'Drilldown', icon: BarChart3,
    href: '/drilldown',
    children: [
      { id: 'drill-metrics', label: 'Metrics', href: '/metrics' },
      { id: 'drill-logs',    label: 'Logs',    href: '/logs' },
      { id: 'drill-traces',  label: 'Traces',  href: '/traces' },
      { id: 'drill-devices', label: 'Devices', href: '/devices' },
    ],
  },
  {
    id: 'alerting', label: 'Alerting', icon: Bell,
    href: '/alerts',
    children: [
      { id: 'alert-rules',    label: 'Alert rules',    href: '/alerts' },
      { id: 'alert-contact',  label: 'Contact points', href: '/alerts/contacts' },
      { id: 'alert-silences', label: 'Silences',       href: '/alerts/silences' },
      { id: 'alert-irm',      label: 'IRM',            href: '/alerts/irm' },
    ],
  },
  {
    id: 'connections', label: 'Connections', icon: Database,
    href: '/datasources',
    children: [
      { id: 'conn-sources', label: 'Data sources',       href: '/datasources' },
      { id: 'conn-add',     label: 'Add new connection', href: '/plugins' },
    ],
  },
  {
    id: 'admin', label: 'Administration', icon: Settings,
    href: '/settings',
    children: [
      { id: 'admin-users',    label: 'Users',          href: '/team' },
      { id: 'admin-access',   label: 'Access control', href: '/access' },
      { id: 'admin-plugins',  label: 'Plugins',        href: '/plugins' },
      { id: 'admin-api',      label: 'API keys',       href: '/api-explorer' },
      { id: 'admin-settings', label: 'Settings',       href: '/settings' },
    ],
  },
];

/* ── Sub-page context (plugin config etc.) ── */
function getSubCtx(pathname: string) {
  if (pathname.startsWith('/plugins/') && pathname !== '/plugins') {
    const slug = pathname.split('/').pop() ?? '';
    return {
      label: slug.replace(/-/g, ' '),
      parentHref: '/plugins',
      parentLabel: 'Connections',
    };
  }
  if (pathname.startsWith('/datasources/') && pathname !== '/datasources') {
    return { label: 'Data source', parentHref: '/datasources', parentLabel: 'Connections' };
  }
  return null;
}

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore();
  const { alerts }            = useAlertsStore();
  const pathname              = usePathname();
  const router                = useRouter();
  const subCtx                = getSubCtx(pathname);
  const firingCount           = alerts.filter(a => a.state === 'firing').length;

  /* Auto-open sections that contain the active route */
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV.forEach(item => {
      if (item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/')))
        init[item.id] = true;
    });
    return init;
  });

  const toggleSection = (id: string) =>
    setOpen(p => ({ ...p, [id]: !p[id] }));

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const W_OPEN      = 240;
  const W_COLLAPSED = 56;

  return (
    <motion.aside
      animate={{ width: collapsed ? W_COLLAPSED : W_OPEN }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >

      {/* ── Logo ───────────────────────────────── */}
      <div style={{
        height: 56,
        display: 'flex', alignItems: 'center',
        padding: collapsed ? '0 14px' : '0 14px 0 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10,
      }}>

        {/* Logo image + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', minWidth: 0 }}>
          <Image
            src="/vizora-logo.png"
            alt="Vizora Logo"
            width={28}
            height={28}
            style={{ flexShrink: 0, borderRadius: Math.round(28 * 0.25) }}
            priority
          />

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    fontFamily: 'inherit',
                  }}>
                    Vizora
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    marginTop: 1, letterSpacing: '0.01em',
                  }}>
                    IoTrenetics Solutions
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse chevron — only visible when expanded */}
        {!collapsed && (
          <button
            onClick={toggle}
            title="Collapse sidebar"
            style={{
              width: 24, height: 24, borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Sub-page back banner ────────────────── */}
      <AnimatePresence>
        {subCtx && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <button
              onClick={() => router.push(subCtx.parentHref)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 8, padding: '10px 16px',
                background: 'var(--accent-soft)',
                border: 'none', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <ArrowLeft size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 10, color: 'var(--accent)', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Back to {subCtx.parentLabel}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-primary)', fontWeight: 600,
                    textTransform: 'capitalize', marginTop: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {subCtx.label}
                  </div>
                </div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ────────────────────────────────── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '6px 0',
        opacity: subCtx ? 0.35 : 1,
        pointerEvents: subCtx ? 'none' : 'auto',
        transition: 'opacity 0.2s',
      }}>
        {NAV.map(item => {
          const Icon        = item.icon;
          const active      = isActive(item.href);
          const isOpen      = open[item.id];
          const hasChildren = !!item.children;
          const badge       = item.id === 'alerting' && firingCount > 0 ? firingCount : null;
          const showSep     = item.id === 'alerting' || item.id === 'connections';

          return (
            <div key={item.id}>
              {showSep && (
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
              )}

              {hasChildren ? (
                /* ── Expandable section ── */
                <div>
                  <button
                    onClick={() => !collapsed && toggleSection(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: 10, padding: collapsed ? '9px 0' : '9px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active && !isOpen ? 'var(--sidebar-item-active-bg)' : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      position: 'relative', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!active || isOpen) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover-bg)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={e => {
                      if (!active || isOpen) (e.currentTarget as HTMLElement).style.background = active && !isOpen ? 'var(--sidebar-item-active-bg)' : 'transparent';
                      (e.currentTarget as HTMLElement).style.color = active ? 'var(--text-primary)' : 'var(--text-secondary)';
                    }}
                  >
                    {active && !isOpen && (
                      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'var(--accent)', borderRadius: '0 3px 3px 0' }} />
                    )}

                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Icon size={17} />
                      {badge && (
                        <div style={{
                          position: 'absolute', top: -5, right: -6,
                          minWidth: 16, height: 16, borderRadius: 8,
                          background: 'var(--red)', color: '#fff',
                          fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 3px',
                        }}>
                          {badge}
                        </div>
                      )}
                    </div>

                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 500 : 400, textAlign: 'left' }}>
                          {item.label}
                        </span>
                        <ChevronDown size={13} style={{
                          flexShrink: 0,
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          color: 'var(--text-muted)',
                        }} />
                      </>
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div style={{
                        position: 'absolute', left: '100%', top: '50%',
                        transform: 'translateY(-50%)',
                        marginLeft: 8, padding: '4px 10px', borderRadius: 6,
                        background: 'var(--surface-3)', border: '1px solid var(--border)',
                        color: 'var(--text-primary)', fontSize: 12, fontWeight: 500,
                        whiteSpace: 'nowrap', pointerEvents: 'none',
                        opacity: 0, transition: 'opacity 0.15s', zIndex: 100,
                      }} className="sidebar-tooltip">
                        {item.label}
                      </div>
                    )}
                  </button>

                  {/* Children */}
                  <AnimatePresence initial={false}>
                    {isOpen && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {item.children!.map(child => {
                          const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                          return (
                            <Link key={child.id} href={child.href} style={{ textDecoration: 'none' }}>
                              <div
                                style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '7px 14px 7px 41px',
                                  color: childActive ? 'var(--accent)' : 'var(--text-secondary)',
                                  background: childActive ? 'var(--accent-soft)' : 'transparent',
                                  fontSize: 13, cursor: 'pointer',
                                  position: 'relative', transition: 'all 0.12s',
                                }}
                                onMouseEnter={e => {
                                  if (!childActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover-bg)';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!childActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                  }
                                }}
                              >
                                {childActive && (
                                  <div style={{ position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 3, background: 'var(--accent)', borderRadius: '0 3px 3px 0' }} />
                                )}
                                <span style={{ fontWeight: childActive ? 500 : 400 }}>{child.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Simple link ── */
                <Link href={item.href} style={{ textDecoration: 'none' }}>
                  <div
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: 10, padding: collapsed ? '9px 0' : '9px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'var(--sidebar-item-active-bg)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover-bg)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: 'var(--accent)', borderRadius: '0 3px 3px 0' }} />
                    )}
                    <Icon size={17} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{item.label}</span>
                    )}
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: live status + expand toggle ─── */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--green)',
              animation: 'pulse-dot 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
              Connected · Live
            </span>
          </div>
        )}

        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: 8, padding: collapsed ? '10px 0' : '8px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 12,
            borderTop: collapsed ? 'none' : '1px solid var(--border)',
            transition: 'all 0.12s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-item-hover-bg)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>

      {/* Tooltip hover CSS */}
      <style>{`
        button:hover .sidebar-tooltip,
        a:hover .sidebar-tooltip { opacity: 1 !important; }
      `}</style>
    </motion.aside>
  );
}