'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useUserStore } from '@/store';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TABS = ['Recent', 'Starred', 'Learn'] as const;
type Tab = typeof TABS[number];

const RECENT = [
  { id: 'r1', title: 'System Overview',   folder: 'Production',     updated: '2 minutes ago',  starred: true  },
  { id: 'r2', title: 'MQTT Device Fleet', folder: 'IoT Platform',   updated: '1 hour ago',     starred: false },
  { id: 'r3', title: 'CPU & Memory',      folder: 'Infrastructure', updated: '3 hours ago',    starred: true  },
  { id: 'r4', title: 'Network I/O',       folder: 'Infrastructure', updated: 'Yesterday',      starred: false },
  { id: 'r5', title: 'Active Alerts',     folder: 'Monitoring',     updated: '2 days ago',     starred: false },
];

const LEARN = [
  { title: 'Getting started',     desc: 'Set up your first dashboard in 5 minutes.',   href: '#', emoji: '🚀' },
  { title: 'MQTT integration',    desc: 'Stream live IoT telemetry into Vizora.',       href: '#', emoji: '📡' },
  { title: 'Alert rule cookbook', desc: 'Common patterns and best practices.',          href: '#', emoji: '🔔' },
  { title: 'API reference',       desc: 'Automate Vizora via the REST API.',            href: '#', emoji: '⚡' },
];

const QUICK = [
  { title: 'Demo data',         desc: 'Try Vizora with pre-built IoT dashboards.',        href: '/datasources', color: '#22c55e', emoji: '🎮' },
  { title: 'Connect a source',  desc: 'Add MQTT, InfluxDB, Prometheus and more.',         href: '/datasources', color: '#3b82f6', emoji: '🔌' },
  { title: 'Build a dashboard', desc: 'Drag, drop and configure visualization panels.',    href: '/dashboards/new', color: '#5865f2', emoji: '📊' },
  { title: 'Set up alerts',     desc: 'Get notified when metrics cross thresholds.',       href: '/alerts',     color: '#ef4444', emoji: '🔔' },
  { title: 'Invite your team',  desc: 'Collaborate with roles and access control.',        href: '/team',       color: '#f59e0b', emoji: '👥' },
  { title: 'Explore metrics',   desc: 'Ad-hoc query any metric without a dashboard.',      href: '/metrics',    color: '#06b6d4', emoji: '📈' },
];

const SUGGESTIONS = [
  'Show me all firing alerts',
  'Which devices are offline?',
  'Plot CPU usage last 24 hours',
  'Create a dashboard for MQTT stats',
];

/* ── Stat pill ── */
function StatPill({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 8,
      background: 'var(--surface)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

export default function HomePage() {
  const { currentUser } = useUserStore();
  const [tab, setTab]     = useState<Tab>('Recent');
  const [prompt, setPrompt] = useState('');
  const [suggIdx, setSuggIdx] = useState(0);
  const [starred, setStarred] = useState(new Set(RECENT.filter(r => r.starred).map(r => r.id)));
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSuggIdx(i => (i + 1) % SUGGESTIONS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const toggleStar = (id: string) =>
    setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div>

          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.025em' }}>
              {getGreeting()}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}.
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatPill emoji="📊" label="Dashboards"  value="12"         color="var(--accent)" />
              <StatPill emoji="🖥️" label="Devices"     value="4/6 online" color="var(--green)"  />
              <StatPill emoji="🔔" label="Firing"       value="3 alerts"   color="var(--red)"    />
              <StatPill emoji="⚡" label="Avg CPU"      value="42.9%"      color="var(--amber)"  />
            </div>
          </motion.div>

          {/* AI Assistant bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.07 }} style={{ marginBottom: 32 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 10,
              border: '1px solid var(--accent)',
              background: 'var(--surface)',
              boxShadow: '0 0 0 3px var(--accent-glow)',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
              <input
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPrompt('')}
                placeholder={SUGGESTIONS[suggIdx]}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}
              />
              <button onClick={() => setPrompt('')} style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0, transition: 'opacity 0.15s',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              Vizora Assistant · Powered by IoTrenetics Solutions
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    position: 'relative', padding: '8px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: 'Inter, sans-serif', transition: 'color 0.12s',
                  }}>
                  {t}
                  {tab === t && (
                    <motion.div layoutId="home-tab-line"
                      style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: 2 }} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'Recent' && (
                <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {RECENT.map((d, i) => (
                    <motion.div key={d.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 10px', borderRadius: 8, cursor: 'pointer',
                        background: hovered === d.id ? 'var(--surface)' : 'transparent',
                        transition: 'background 0.12s', boxShadow: hovered === d.id ? 'var(--shadow-sm)' : 'none',
                      }}
                      onMouseEnter={() => setHovered(d.id)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                      </div>
                      <button onClick={() => toggleStar(d.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: starred.has(d.id) ? '#f59e0b' : 'var(--text-muted)', opacity: hovered === d.id || starred.has(d.id) ? 1 : 0, transition: 'opacity 0.12s, color 0.12s' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={starred.has(d.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{d.updated}</span>
                    </motion.div>
                  ))}
                  <div style={{ marginTop: 8, paddingLeft: 10 }}>
                    <Link href="/dashboards/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                      + New dashboard
                    </Link>
                  </div>
                </motion.div>
              )}

              {tab === 'Starred' && (
                <motion.div key="starred" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {RECENT.filter(r => starred.has(r.id)).length === 0
                    ? <p style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No starred dashboards yet.</p>
                    : RECENT.filter(r => starred.has(r.id)).map((d, i) => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 8, cursor: 'pointer' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.title}</p>
                          <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.updated}</span>
                      </div>
                    ))}
                </motion.div>
              )}

              {tab === 'Learn' && (
                <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 8 }}>
                  {LEARN.map(({ title, desc, href, emoji }) => (
                    <a key={title} href={href} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ══ RIGHT COLUMN — Get started ══ */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Get started</h2>
            <Link href="/datasources" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>All connections →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK.map(({ title, desc, href, color, emoji }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.05 }}>
                <Link href={href} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${color}22`; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, boxShadow: `0 2px 8px ${color}50` }}>
                      {emoji}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}