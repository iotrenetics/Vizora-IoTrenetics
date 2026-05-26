// src/app/plugins/page.tsx  — REPLACE ENTIRE FILE
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PLUGINS = [
  { id: 'influxdb',    name: 'InfluxDB',    author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: true,  href: '/plugins/influxdb',    emoji: '📊', color: '#22ADF6' },
  { id: 'mqtt',        name: 'MQTT',        author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: true,  href: '/plugins/mqtt',        emoji: '📡', color: '#f59e0b' },
  { id: 'prometheus',  name: 'Prometheus',  author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/prometheus',  emoji: '🔥', color: '#f43f5e' },
  { id: 'postgresql',  name: 'PostgreSQL',  author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/postgresql',  emoji: '🐘', color: '#3b82f6' },
  { id: 'mysql',       name: 'MySQL',       author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/mysql',       emoji: '🐬', color: '#4479A1' },
  { id: 'elasticsearch',name:'Elasticsearch',author:'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/elasticsearch',emoji:'🔍', color: '#00bfb3' },
  { id: 'redis',       name: 'Redis',       author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/redis',       emoji: '🟥', color: '#dc382c' },
  { id: 'mongodb',     name: 'MongoDB',     author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/mongodb',     emoji: '🍃', color: '#00ed64' },
  { id: 'loki',        name: 'Loki',        author: 'IoTrenetics',   type: 'datasource', signed: true,  installed: false, href: '/plugins/loki',        emoji: '📜', color: '#8b5cf6' },
  { id: 'timescale',   name: 'TimescaleDB', author: 'Timescale Inc', type: 'datasource', signed: true,  installed: false, href: '/plugins/timescaledb', emoji: '⏱',  color: '#f97316' },
  { id: 'barchart',    name: 'Bar Chart',   author: 'IoTrenetics',   type: 'panel',      signed: true,  installed: true,  href: '#',                    emoji: '📊', color: '#6366f1' },
  { id: 'gauge',       name: 'Gauge Panel', author: 'IoTrenetics',   type: 'panel',      signed: true,  installed: true,  href: '#',                    emoji: '🎯', color: '#10b981' },
  { id: 'heatmap',     name: 'Heatmap',     author: 'IoTrenetics',   type: 'panel',      signed: false, installed: false, href: '#',                    emoji: '🟩', color: '#06b6d4' },
  { id: 'geomap',      name: 'Geo Map',     author: 'IoTrenetics',   type: 'panel',      signed: false, installed: false, href: '#',                    emoji: '🗺',  color: '#84cc16' },
  { id: 'table',       name: 'Table Plus',  author: 'Community',     type: 'panel',      signed: false, installed: false, href: '#',                    emoji: '📋', color: '#64748b' },
  { id: 'candlestick', name: 'Candlestick', author: 'Community',     type: 'panel',      signed: false, installed: false, href: '#',                    emoji: '🕯',  color: '#a16207' },
];

type TypeFilter  = 'all' | 'datasource' | 'panel';
type StateFilter = 'all' | 'installed';

const IcoSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoShield   = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoGrid     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoDatabase = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;

export default function PluginsPage() {
  const router = useRouter();
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('all');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [installed, setInstalled] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vizora_installed_plugins');
        if (stored) return new Set<string>(JSON.parse(stored));
      } catch {}
    }
    return new Set<string>(PLUGINS.filter(p => p.installed).map(p => p.id));
  });
  const [dismissed, setDismissed] = useState(false);

  // Keep localStorage in sync whenever the installed set changes
  useEffect(() => {
    try {
      localStorage.setItem('vizora_installed_plugins', JSON.stringify([...installed]));
    } catch {}
  }, [installed]);

  const filtered = PLUGINS.filter(p =>
    (typeFilter === 'all' || p.type === typeFilter) &&
    (stateFilter === 'all' || installed.has(p.id)) &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstall = (p: typeof PLUGINS[0], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (installed.has(p.id)) {
      // Uninstall — remove from set; card becomes inactive immediately
      setInstalled(prev => { const n = new Set(prev); n.delete(p.id); return n; });
    } else {
      // Install → mark installed then redirect to config page (if one exists)
      setInstalled(prev => new Set([...prev, p.id]));
      if (p.href !== '#') router.push(p.href);
    }
  };

  const handleCardClick = (p: typeof PLUGINS[0]) => {
    // Only navigate if the plugin is currently installed AND has a real config page
    const isInstalled = installed.has(p.id);
    if (isInstalled && p.href !== '#') {
      router.push(p.href);
    }
    // If not installed → do nothing (card is inert)
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Plugins</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Extend Vizora with data source connectors and panel widgets.{' '}
            <Link href="/datasources" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Go to Data Sources →</Link>
          </p>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, color: 'var(--text-muted)' }}>
          No updates available
        </div>
      </div>

      {/* Advisor banner */}
      {!dismissed && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)', marginBottom: 20, marginTop: 16 }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
            Try the Advisor to uncover potential issues with your data sources and plugins.
          </p>
          <button style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            → Go to Advisor
          </button>
          <button onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
        </motion.div>
      )}

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'end', marginBottom: 24 }}>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Search</p>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><IcoSearch /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Vizora plugins"
              style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Type</p>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            style={{ padding: '9px 32px 9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 140 }}>
            <option value="all">All</option>
            <option value="datasource">Data source</option>
            <option value="panel">Panel</option>
          </select>
        </div>
        <div>
          <p style={{ margin: '0 0 5px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>State</p>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
            {(['all', 'installed'] as StateFilter[]).map(s => (
              <button key={s} onClick={() => setStateFilter(s)}
                style={{ padding: '8px 16px', background: stateFilter === s ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: stateFilter === s ? 600 : 400, color: stateFilter === s ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'inherit', borderRight: s === 'all' ? '1px solid var(--border)' : 'none', transition: 'all 0.12s', textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {filtered.map((p, i) => {
          const isInstalled = installed.has(p.id);
          // A card is interactive (hoverable + clickable) only when installed AND has a real page
          const isInteractive = isInstalled && p.href !== '#';

          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <div
                onClick={() => handleCardClick(p)}
                style={{
                  padding: '18px 18px 14px',
                  borderRadius: 12,
                  border: `1px solid ${isInstalled ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                  background: 'var(--surface)',
                  // Only show pointer cursor when the card will actually do something on click
                  cursor: isInteractive ? 'pointer' : 'default',
                  // Dim uninstalled cards slightly to reinforce their inactive state
                  opacity: isInstalled ? 1 : 0.72,
                  transition: 'all 0.15s',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => {
                  // Hover lift/glow only for installed+navigable cards
                  if (!isInteractive) return;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${p.color}20`;
                  (e.currentTarget as HTMLElement).style.borderColor = p.color + '60';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  if (!isInteractive) return;
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = isInstalled ? 'rgba(99,102,241,0.3)' : 'var(--border)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: p.color + '18',
                      border: `1px solid ${p.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                      // Desaturate icon area when not installed
                      filter: isInstalled ? 'none' : 'grayscale(0.4)',
                    }}>
                      {p.emoji}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{p.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>By {p.author}</p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                    {p.type === 'panel' ? <IcoGrid /> : <IcoDatabase />}
                  </span>
                </div>

                {/* Badges + button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {p.signed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#dcfce7', border: '1px solid #86efac', fontSize: 10, fontWeight: 700, color: '#16a34a' }}>
                      <IcoShield /> Signed
                    </span>
                  )}
                  {isInstalled && (
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: '#e0e7ff', border: '1px solid #a5b4fc', fontSize: 10, fontWeight: 700, color: '#4338ca' }}>
                      Installed
                    </span>
                  )}
                  <button
                    onClick={e => handleInstall(p, e)}
                    style={{
                      marginLeft: 'auto', padding: '4px 12px', borderRadius: 6,
                      border: `1px solid ${isInstalled ? '#fca5a5' : 'var(--accent)'}`,
                      background: isInstalled ? 'transparent' : 'var(--accent)',
                      color: isInstalled ? '#dc2626' : '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.12s',
                    }}>
                    {isInstalled ? 'Uninstall' : 'Install'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No plugins match your search.
        </div>
      )}
    </div>
  );
}