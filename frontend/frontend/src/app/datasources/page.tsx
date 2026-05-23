'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const SOURCES = [
  { id: 's1', name: 'Production MQTT',    type: 'MQTT',      status: 'connected', latency: '12ms',  queries: 1420, lastCheck: '30s ago' },
  { id: 's2', name: 'InfluxDB Primary',   type: 'InfluxDB',  status: 'connected', latency: '8ms',   queries: 3891, lastCheck: '30s ago' },
  { id: 's3', name: 'Prometheus Node',    type: 'Prometheus',status: 'connected', latency: '5ms',   queries: 9120, lastCheck: '30s ago' },
  { id: 's4', name: 'Staging MQTT',       type: 'MQTT',      status: 'error',     latency: '—',     queries: 0,    lastCheck: '2m ago'  },
  { id: 's5', name: 'TimescaleDB',        type: 'PostgreSQL',status: 'connected', latency: '21ms',  queries: 540,  lastCheck: '30s ago' },
  { id: 's6', name: 'Grafana Loki',       type: 'Loki',      status: 'connected', latency: '14ms',  queries: 212,  lastCheck: '1m ago'  },
];

const TYPE_COLORS: Record<string, string> = {
  MQTT: '#f59e0b', InfluxDB: '#06b6d4', Prometheus: '#f43f5e',
  PostgreSQL: '#3b82f6', Loki: '#8b5cf6', Generic: '#6366f1',
};

// href: null means "coming soon" — will show disabled state
const AVAILABLE = [
  { type: 'MQTT',       desc: 'Connect any MQTT broker for real-time IoT telemetry.',  emoji: '📡', href: null },
  { type: 'InfluxDB',   desc: 'Time-series database for metrics and events.',            emoji: '📊', href: '/plugins/influxdb' },
  { type: 'Prometheus', desc: 'Pull metrics from any Prometheus-compatible endpoint.',   emoji: '🔥', href: null },
  { type: 'PostgreSQL', desc: 'Connect relational databases including TimescaleDB.',     emoji: '🐘', href: null },
  { type: 'Loki',       desc: 'Log aggregation system by Grafana Labs.',                 emoji: '📜', href: null },
  { type: 'REST API',   desc: 'Pull data from any HTTP/REST endpoint on a schedule.',    emoji: '🌐', href: null },
  { type: 'WebSocket',  desc: 'Stream real-time data over persistent WS connections.',   emoji: '⚡', href: null },
  { type: 'CSV / File', desc: 'Upload static datasets for one-time or scheduled use.',   emoji: '📁', href: null },
];

const IcoCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcoSettings = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M22 12h-2M4 12H2M12 22v-2M12 4V2"/></svg>;
const IcoArrow = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

export default function DataSourcesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = SOURCES.filter(s =>
    search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.type.toLowerCase().includes(search.toLowerCase())
  );

  const handlePickSource = (href: string | null) => {
    if (!href) return; // coming soon — do nothing
    setShowAdd(false);
    router.push(href);
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Data Sources</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Manage connections to your databases, brokers, and APIs</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          <IcoPlus /> Add data source
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total sources', value: SOURCES.length,                                              color: '#6366f1' },
          { label: 'Connected',     value: SOURCES.filter(s => s.status === 'connected').length,        color: '#10b981' },
          { label: 'Errors',        value: SOURCES.filter(s => s.status === 'error').length,            color: '#f43f5e' },
          { label: 'Total queries', value: SOURCES.reduce((a, s) => a + s.queries, 0).toLocaleString(), color: '#06b6d4' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '16px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><IcoSearch /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search data sources..."
          style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'Syne, sans-serif', boxSizing: 'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)', marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 80px 100px 80px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {['Name', 'Type', 'Status', 'Latency', 'Queries', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>
        {filtered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'grid', gridTemplateColumns: '2fr 120px 100px 80px 100px 80px', gap: 12, padding: '13px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Last checked {s.lastCheck}</p>
            </div>
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${TYPE_COLORS[s.type] ?? '#6366f1'}18`, color: TYPE_COLORS[s.type] ?? '#6366f1', border: `1px solid ${TYPE_COLORS[s.type] ?? '#6366f1'}30` }}>{s.type}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: s.status === 'connected' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.status === 'connected' ? '#16a34a' : '#dc2626' }}>
                {s.status === 'connected' ? <IcoCheck /> : <IcoX />}
              </span>
              <span style={{ fontSize: 12, color: s.status === 'connected' ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{s.status === 'connected' ? 'OK' : 'Error'}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>{s.latency}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>{s.queries.toLocaleString()}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {/* Settings — routes to plugin config page if available */}
              <button
                onClick={() => s.type === 'InfluxDB' && router.push('/plugins/influxdb')}
                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                <IcoSettings />
              </button>
              <button style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f43f5e'; (e.currentTarget as HTMLElement).style.borderColor = '#f43f5e'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                <IcoTrash />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add data source modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

              {/* Modal header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add data source</h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Choose a connector to get started</p>
                </div>
                <button onClick={() => setShowAdd(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1, padding: 4 }}>✕</button>
              </div>

              {/* Connector grid */}
              <div style={{ overflow: 'auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {AVAILABLE.map(({ type, desc, emoji, href }) => {
                  const ready = href !== null;
                  return (
                    <button key={type}
                      onClick={() => handlePickSource(href)}
                      disabled={!ready}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
                        borderRadius: 10, border: `1px solid ${ready ? 'var(--border)' : 'var(--border)'}`,
                        background: 'var(--surface)', cursor: ready ? 'pointer' : 'not-allowed',
                        textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Syne, sans-serif',
                        opacity: ready ? 1 : 0.5,
                        position: 'relative',
                      }}
                      onMouseEnter={e => {
                        if (!ready) return;
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                      }}
                    >
                      <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{type}</p>
                          {ready && (
                            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', opacity: 0.7 }}><IcoArrow /></span>
                          )}
                          {!ready && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 600 }}>Soon</span>
                          )}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}