'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const FOLDERS = ['All', 'Production', 'IoT Platform', 'Infrastructure', 'Monitoring'];

const DASHBOARDS = [
  { id: 'd1', title: 'System Overview',      folder: 'Production',     updated: '2m ago',    panels: 7,  starred: true,  tags: ['system', 'cpu'] },
  { id: 'd2', title: 'MQTT Device Fleet',    folder: 'IoT Platform',   updated: '1h ago',    panels: 5,  starred: false, tags: ['mqtt', 'iot'] },
  { id: 'd3', title: 'CPU & Memory',         folder: 'Infrastructure', updated: '3h ago',    panels: 4,  starred: true,  tags: ['cpu', 'memory'] },
  { id: 'd4', title: 'Network I/O',          folder: 'Infrastructure', updated: 'Yesterday', panels: 3,  starred: false, tags: ['network'] },
  { id: 'd5', title: 'Active Alerts Board',  folder: 'Monitoring',     updated: '2d ago',    panels: 6,  starred: false, tags: ['alerts'] },
  { id: 'd6', title: 'Sensor Analytics',     folder: 'IoT Platform',   updated: '3d ago',    panels: 9,  starred: false, tags: ['sensors', 'iot'] },
  { id: 'd7', title: 'API Gateway Metrics',  folder: 'Production',     updated: '1w ago',    panels: 4,  starred: false, tags: ['api', 'gateway'] },
  { id: 'd8', title: 'Database Performance', folder: 'Infrastructure', updated: '1w ago',    panels: 5,  starred: false, tags: ['database'] },
];

const IcoGrid = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoList = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IcoStar = ({ filled }: { filled?: boolean }) => <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoFolder = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IcoLayout = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;

export default function DashboardsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [folder, setFolder] = useState('All');
  const [search, setSearch] = useState('');
  const [starred, setStarred] = useState<Set<string>>(new Set(DASHBOARDS.filter(d => d.starred).map(d => d.id)));

  const filtered = DASHBOARDS.filter(d =>
    (folder === 'All' || d.folder === folder) &&
    (search === '' || d.title.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t => t.includes(search.toLowerCase())))
  );

  const toggleStar = (id: string) => setStarred(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const S = {
    pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as React.CSSProperties,
    h1: { margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' } as React.CSSProperties,
    toolbar: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' as const } as React.CSSProperties,
    searchWrap: { position: 'relative', flex: 1, minWidth: 200 } as React.CSSProperties,
    searchInput: { width: '100%', padding: '7px 10px 7px 32px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'Syne, sans-serif' } as React.CSSProperties,
    iconBtn: { width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.12s' } as React.CSSProperties,
    addBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' } as React.CSSProperties,
    folderBar: { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' as const } as React.CSSProperties,
    tag: { padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.12s' } as React.CSSProperties,
    card: { borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' } as React.CSSProperties,
    cardPreview: { height: 100, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const } as React.CSSProperties,
    cardBody: { padding: '12px 14px 14px' } as React.CSSProperties,
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Dashboards</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{DASHBOARDS.length} dashboards across {FOLDERS.length - 1} folders</p>
        </div>
        <button style={S.addBtn}><IcoPlus /> New dashboard</button>
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.searchWrap}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><IcoSearch /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dashboards, tags..." style={S.searchInput} />
        </div>
        <button style={{ ...S.iconBtn, ...(view === 'grid' ? { background: 'var(--surface-2)', color: 'var(--text-primary)' } : {}) }} onClick={() => setView('grid')}><IcoGrid /></button>
        <button style={{ ...S.iconBtn, ...(view === 'list' ? { background: 'var(--surface-2)', color: 'var(--text-primary)' } : {}) }} onClick={() => setView('list')}><IcoList /></button>
      </div>

      {/* Folder pills */}
      <div style={S.folderBar}>
        {FOLDERS.map(f => (
          <button key={f} onClick={() => setFolder(f)} style={{ ...S.tag, background: folder === f ? 'var(--accent)' : 'var(--surface)', color: folder === f ? '#fff' : 'var(--text-muted)', borderColor: folder === f ? 'var(--accent)' : 'var(--border)' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={S.card}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              {/* Mini preview */}
              <div style={S.cardPreview}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 12, width: '100%' }}>
                  {Array.from({ length: Math.min(d.panels, 4) }).map((_, j) => (
                    <div key={j} style={{ height: 28, borderRadius: 4, background: `rgba(99,102,241,${0.06 + j * 0.04})`, border: '1px solid rgba(99,102,241,0.1)' }} />
                  ))}
                </div>
                <button onClick={e => { e.stopPropagation(); toggleStar(d.id); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: starred.has(d.id) ? '#f59e0b' : 'var(--text-muted)' }}>
                  <IcoStar filled={starred.has(d.id)} />
                </button>
              </div>
              <div style={S.cardBody}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}><IcoFolder /> {d.folder}</span>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}><IcoLayout /> {d.panels} panels</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {d.tags.map(t => (
                    <span key={t} style={{ padding: '1px 7px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 10, color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Updated {d.updated}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* List view */}
      {view === 'list' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 40px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            {['Name', 'Folder', 'Updated', 'Panels', ''].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 80px 40px', gap: 12, padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}><IcoGrid /></span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.title}</p>
                  <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>{d.tags.map(t => <span key={t} style={{ padding: '0px 5px', borderRadius: 3, background: 'var(--surface-2)', fontSize: 10, color: 'var(--text-muted)' }}>{t}</span>)}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.folder}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.updated}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.panels}</span>
              <button onClick={() => toggleStar(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: starred.has(d.id) ? '#f59e0b' : 'var(--text-muted)' }}>
                <IcoStar filled={starred.has(d.id)} />
              </button>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No dashboards match your search.</div>
          )}
        </motion.div>
      )}
    </div>
  );
}