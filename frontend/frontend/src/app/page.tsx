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

const SUGGESTIONS = ['Show me all firing alerts','Which devices are offline?','Plot CPU usage last 24 hours','Create a dashboard for MQTT stats'];

const IcoGrid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoCpu = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>;
const IcoBell = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoTrend = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const IcoStar = ({ filled }: { filled?: boolean }) => <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoClock = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoChevR = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoSend = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoArrow = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function HomePage() {
  const { currentUser } = useUserStore();
  const [tab, setTab] = useState<Tab>('Recent dashboards');
  const [prompt, setPrompt] = useState('');
  const [suggIdx, setSuggIdx] = useState(0);
  const [starred, setStarred] = useState<Set<string>>(new Set(RECENT.filter(r => r.starred).map(r => r.id)));
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setSuggIdx(i => (i + 1) % SUGGESTIONS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const toggleStar = (id: string) => setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const s = {
    page: { width: '100%' } as React.CSSProperties,
    hero: { marginBottom: 32 } as React.CSSProperties,
    h1: { fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, marginTop: 0, letterSpacing: '-0.02em' } as React.CSSProperties,
    pills: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
    pill: { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12 } as React.CSSProperties,
    bar: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--accent)', background: 'var(--surface)', boxShadow: '0 0 0 3px rgba(99,102,241,0.07)', marginBottom: 6 } as React.CSSProperties,
    input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' } as React.CSSProperties,
    sendBtn: { width: 30, height: 30, borderRadius: 7, background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 } as React.CSSProperties,
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      {/* Two-column layout: main content left, sidebar right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32, alignItems: 'start' }}>

        {/* LEFT */}
        <div>
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} style={s.hero}>
            <h1 style={s.h1}>{getGreeting()}{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}.</h1>
            <div style={s.pills}>
              {[
                { ico: <IcoGrid />, label: 'Dashboards', val: '12', c: '#6366f1' },
                { ico: <IcoCpu />, label: 'Devices', val: '4/6 online', c: '#10b981' },
                { ico: <IcoBell />, label: 'Firing', val: '3', c: '#f43f5e' },
                { ico: <IcoTrend />, label: 'Avg CPU', val: '42.9%', c: '#06b6d4' },
              ].map(({ ico, label, val, c }) => (
                <div key={label} style={s.pill}>
                  <span style={{ color: c }}>{ico}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.07 }} style={{ marginBottom: 32 }}>
            <div style={s.bar}>
              <span style={{ color: 'var(--accent)', fontSize: 15, flexShrink: 0 }}>✦</span>
              <input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPrompt('')} placeholder={SUGGESTIONS[suggIdx]} style={s.input} />
              <button onClick={() => setPrompt('')} style={s.sendBtn}><IcoSend /></button>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>Vizora Assistant · Powered by IoTrenetics Solutions</p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.12 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ position: 'relative', padding: '7px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>
                  {t}
                  {tab === t && <motion.div layoutId="home-tab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: 2 }} />}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'Recent dashboards' && (
                <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {RECENT.map((d, i) => (
                    <motion.div key={d.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7, cursor: 'pointer', background: hovered === d.id ? 'var(--surface-2)' : 'transparent', transition: 'background 0.12s' }}
                      onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><IcoGrid /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                      </div>
                      <button onClick={() => toggleStar(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: starred.has(d.id) ? '#f59e0b' : 'var(--text-muted)', opacity: hovered === d.id || starred.has(d.id) ? 1 : 0, transition: 'opacity 0.12s' }}>
                        <IcoStar filled={starred.has(d.id)} />
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}><IcoClock /> {d.updated}</span>
                      <span style={{ color: 'var(--text-muted)', opacity: hovered === d.id ? 1 : 0, transition: 'opacity 0.12s' }}><IcoChevR /></span>
                    </motion.div>
                  ))}
                  <div style={{ marginTop: 8, paddingLeft: 10 }}>
                    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}><IcoPlus /> New dashboard</Link>
                  </div>
                </motion.div>
              )}

              {tab === 'Starred' && (
                <motion.div key="starred" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {RECENT.filter(r => starred.has(r.id)).length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '32px 0', textAlign: 'center' }}>No starred dashboards yet.</p>
                    : RECENT.filter(r => starred.has(r.id)).map((d, i) => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 7, cursor: 'pointer' }}>
                        <span style={{ color: '#f59e0b' }}><IcoStar filled /></span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.title}</p>
                          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{d.folder}</p>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}><IcoClock /> {d.updated}</span>
                      </div>
                    ))
                  }
                </motion.div>
              )}

              {tab === 'Learn' && (
                <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'grid', gap: 10 }}>
                  {LEARN.map(({ title, desc, href }) => (
                    <a key={title} href={href} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', textDecoration: 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📖</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR — Get started */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Get started</h2>
            <Link href="/datasources" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>All connections <IcoArrow /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUICK.map(({ title, desc, href, color, emoji }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 + i * 0.04 }}>
                <Link href={href} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: `0 2px 8px ${color}50` }}>{emoji}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
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