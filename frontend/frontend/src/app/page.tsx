'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useUserStore } from '@/store';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const TABS = ['Recent dashboards', 'Starred', 'Learn'] as const;
type Tab = typeof TABS[number];

const RECENT = [
  { id: 'r1', title: 'System Overview',   folder: 'Production',     updated: '2m ago',    starred: true  },
  { id: 'r2', title: 'MQTT Device Fleet', folder: 'IoT Platform',   updated: '1h ago',    starred: false },
  { id: 'r3', title: 'CPU & Memory',      folder: 'Infrastructure', updated: '3h ago',    starred: true  },
  { id: 'r4', title: 'Network I/O',       folder: 'Infrastructure', updated: 'Yesterday', starred: false },
  { id: 'r5', title: 'Active Alerts',     folder: 'Monitoring',     updated: '2d ago',    starred: false },
];

const LEARN = [
  { title: 'Getting started guide', desc: 'Set up your first dashboard in 5 minutes.',  href: '#' },
  { title: 'MQTT integration',      desc: 'Stream live device telemetry into Vizora.',  href: '#' },
  { title: 'Alert rule cookbook',   desc: 'Common alert patterns and best practices.',   href: '#' },
  { title: 'API reference',         desc: 'Automate Vizora via the REST API.',          href: '#' },
];

const QUICK = [
  { title: 'Demo data',         desc: 'Install demo dashboards with real IoT data to explore.', href: '/datasources', color: '#10b981', emoji: '🎮' },
  { title: 'Connect a source',  desc: 'Add MQTT, InfluxDB, Prometheus or any data source.',     href: '/datasources', color: '#3b82f6', emoji: '🔌' },
  { title: 'Build a dashboard', desc: 'Drag, drop and configure widgets to monitor your fleet.', href: '/',           color: '#6366f1', emoji: '📊' },
  { title: 'Set up alerts',     desc: 'Get notified when metrics cross thresholds that matter.', href: '/alerts',     color: '#f43f5e', emoji: '🔔' },
  { title: 'Invite team',       desc: 'Collaborate and set roles and access control.',           href: '/team',       color: '#f59e0b', emoji: '👥' },
  { title: 'Explore metrics',   desc: 'Ad-hoc query any metric without a dashboard.',            href: '/metrics',    color: '#06b6d4', emoji: '📈' },
];

const SUGGESTIONS = [
  'Show me all firing alerts',
  'Which devices are offline?',
  'Plot CPU usage last 24 hours',
  'Create a dashboard for MQTT stats',
];

/* ── Inline SVGs — no Lucide import needed ───────────────── */
const IcoGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IcoCpu = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
  </svg>
);
const IcoBell = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcoTrend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IcoStar = ({ filled }: { filled?: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IcoClock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoChevR = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const pill: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '6px 12px', borderRadius: 8,
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  fontSize: 12,
};

export default function HomePage() {
  const { currentUser } = useUserStore();
  const [tab, setTab] = useState<Tab>('Recent dashboards');
  const [prompt, setPrompt] = useState('');
  const [suggIdx, setSuggIdx] = useState(0);
  const [starred, setStarred] = useState<Set<string>>(
    new Set(RECENT.filter(r => r.starred).map(r => r.id))
  );
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSuggIdx(i => (i + 1) % SUGGESTIONS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const toggleStar = (id: string) =>
    setStarred(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 64 }}>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, marginTop: 0, letterSpacing: '-0.02em' }}>
          {getGreeting()}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}.
        </h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={pill}><span style={{ color: '#6366f1' }}><IcoGrid /></span><span style={{ color: 'var(--text-muted)' }}>Dashboards</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>12</span></div>
          <div style={pill}><span style={{ color: '#10b981' }}><IcoCpu /></span><span style={{ color: 'var(--text-muted)' }}>Devices</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>4/6 online</span></div>
          <div style={pill}><span style={{ color: '#f43f5e' }}><IcoBell /></span><span style={{ color: 'var(--text-muted)' }}>Firing alerts</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>3</span></div>
          <div style={pill}><span style={{ color: '#06b6d4' }}><IcoTrend /></span><span style={{ color: 'var(--text-muted)' }}>Avg CPU</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>42.9%</span></div>
        </div>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }} style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--accent)', background: 'var(--surface-2)', boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, fontSize: 16 }}>✦</span>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPrompt('')}
            placeholder={SUGGESTIONS[suggIdx]}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}
          />
          <button onClick={() => setPrompt('')} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <IcoSend />
          </button>
        </div>
        <p style={{ marginTop: 6, marginBottom: 0, fontSize: 11, color: 'var(--text-muted)', paddingLeft: 2 }}>
          Vizora Assistant · Ask anything about your data, devices, or dashboards.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.14 }} style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', padding: '8px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif', transition: 'color 0.15s' }}>
              {t}
              {tab === t && <motion.div layoutId="tab-indicator" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: 2 }} />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'Recent dashboards' && (
            <motion.div key="recent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {RECENT.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: hovered === d.id ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IcoGrid /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                  </div>
                  <button onClick={() => toggleStar(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: starred.has(d.id) ? '#f59e0b' : 'var(--text-muted)', opacity: hovered === d.id || starred.has(d.id) ? 1 : 0, transition: 'opacity 0.15s, color 0.15s' }}>
                    <IcoStar filled={starred.has(d.id)} />
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                    <IcoClock /> {d.updated}
                  </span>
                  <span style={{ color: 'var(--text-muted)', opacity: hovered === d.id ? 1 : 0, transition: 'opacity 0.15s' }}><IcoChevR /></span>
                </motion.div>
              ))}
              <div style={{ marginTop: 8, paddingLeft: 12 }}>
                <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                  <IcoPlus /> New dashboard
                </Link>
              </div>
            </motion.div>
          )}

          {tab === 'Starred' && (
            <motion.div key="starred" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              {RECENT.filter(r => starred.has(r.id)).length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No starred dashboards yet. Hover a dashboard and click the star.
                </div>
              ) : RECENT.filter(r => starred.has(r.id)).map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: hovered === d.id ? 'var(--surface-2)' : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}
                >
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}><IcoStar filled /></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}><IcoClock /> {d.updated}</span>
                  <span style={{ color: 'var(--text-muted)' }}><IcoChevR /></span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {tab === 'Learn' && (
            <motion.div key="learn" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}
            >
              {LEARN.map(({ title, desc, href }, i) => (
                <motion.a key={title} href={href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📖</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Get started */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Get started</h2>
          <Link href="/datasources" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
            See all connections <IcoArrow />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {QUICK.map(({ title, desc, href, color, emoji }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.05 }}>
              <Link href={href} style={{ textDecoration: 'none' }}>
                <div
                  style={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                >
                  <div style={{ height: 72, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: `0 4px 14px ${color}60` }}>
                      {emoji}
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px 16px' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55 }}>{desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}