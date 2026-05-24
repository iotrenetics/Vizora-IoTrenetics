// src/app/dashboards/new/page.tsx
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useDataSourcesStore } from '@/store/datasources';

// ─── Types ───────────────────────────────────────────────────────────────────
type PanelType = 'timeseries' | 'bar' | 'stat' | 'table' | 'gauge' | 'logs' | 'map';

interface Panel {
  id: string;
  type: PanelType;
  title: string;
  query: string;
  unit: string;
  color: string;
  // grid position
  x: number; y: number; w: number; h: number;
  // data
  data: any[];
  loading: boolean;
  error: string | null;
}

const PANEL_TYPES: { type: PanelType; label: string; icon: string; desc: string }[] = [
  { type: 'timeseries', label: 'Time series', icon: '📈', desc: 'Line/area chart over time' },
  { type: 'bar',        label: 'Bar chart',   icon: '📊', desc: 'Grouped or stacked bars' },
  { type: 'stat',       label: 'Stat',        icon: '🔢', desc: 'Single big value + sparkline' },
  { type: 'table',      label: 'Table',       icon: '📋', desc: 'Raw tabular data' },
  { type: 'gauge',      label: 'Gauge',       icon: '🎯', desc: 'Donut / radial gauge' },
  { type: 'logs',       label: 'Logs',        icon: '📜', desc: 'Scrollable log stream' },
  { type: 'map',        label: 'Geo map',     icon: '🗺️', desc: 'Coming soon' },
];

const COLORS = ['#3d71e8','#10b981','#f59e0b','#f43f5e','#8b5cf6','#06b6d4','#ec4899'];
const UNITS  = ['none','ms','s','%','bytes','KB','MB','GB','req/s','rpm','°C'];

function newPanel(type: PanelType, count: number): Panel {
  const col = count % 2;
  const row = Math.floor(count / 2);
  return {
    id: `panel-${Date.now()}`,
    type,
    title: `Panel ${count + 1}`,
    query: '',
    unit: 'none',
    color: COLORS[count % COLORS.length],
    x: col * 6, y: row * 4, w: 6, h: 4,
    data: [],
    loading: false,
    error: null,
  };
}

// ─── CSV → array parser (InfluxDB Flux CSV) ──────────────────────────────────
function parseFluxCSV(csv: string): Record<string, any>[] {
  const lines = csv.split('\n').filter(l => l && !l.startsWith('#'));
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => { obj[h] = vals[i]?.trim() ?? ''; });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ''));
}

function toChartData(raw: Record<string, any>[]): { time: string; value: number }[] {
  return raw.map(r => ({
    time: r._time ? new Date(r._time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : r.time ?? '',
    value: parseFloat(r._value ?? r.value ?? 0),
  })).filter(r => !isNaN(r.value));
}

// ─── Individual panel renderers ───────────────────────────────────────────────
function TimeSeriesPanel({ panel }: { panel: Panel }) {
  if (!panel.data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={panel.data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`g${panel.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={panel.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={panel.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gf-border)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: 'var(--gf-surface)', border: '1px solid var(--gf-border)', borderRadius: 6, fontSize: 12 }} />
        <Area type="monotone" dataKey="value" stroke={panel.color} strokeWidth={2} fill={`url(#g${panel.id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BarPanel({ panel }: { panel: Panel }) {
  if (!panel.data.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={panel.data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gf-border)" />
        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: 'var(--gf-surface)', border: '1px solid var(--gf-border)', borderRadius: 6, fontSize: 12 }} />
        <Bar dataKey="value" fill={panel.color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatPanel({ panel }: { panel: Panel }) {
  const last = panel.data[panel.data.length - 1]?.value ?? 0;
  const prev = panel.data[panel.data.length - 2]?.value ?? 0;
  const delta = last - prev;
  const spark = panel.data.slice(-20);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 8px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: panel.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {last.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 3, color: 'var(--gf-text-muted)' }}>{panel.unit !== 'none' ? panel.unit : ''}</span>
          </div>
          <div style={{ fontSize: 11, color: delta >= 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)} vs prev
          </div>
        </div>
        {spark.length > 1 && (
          <div style={{ flex: 1, height: 48 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line type="monotone" dataKey="value" stroke={panel.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function GaugePanel({ panel }: { panel: Panel }) {
  const last = panel.data[panel.data.length - 1]?.value ?? 0;
  const max  = Math.max(...panel.data.map(d => d.value), 100);
  const pct  = Math.min((last / max) * 100, 100);
  const slices = [
    { name: 'value', value: pct,       color: panel.color },
    { name: 'rest',  value: 100 - pct, color: 'var(--gf-hover)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <PieChart width={120} height={120}>
          <Pie data={slices} cx={55} cy={55} innerRadius={38} outerRadius={55} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            {slices.map((s, i) => <Cell key={i} fill={i === 0 ? panel.color : '#2a2d36'} />)}
          </Pie>
        </PieChart>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: panel.color }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)', marginTop: 4 }}>
        {last.toFixed(1)} {panel.unit !== 'none' ? panel.unit : ''}
      </div>
    </div>
  );
}

function TablePanel({ panel }: { panel: Panel }) {
  if (!panel.data.length) return <EmptyState />;
  const cols = Object.keys(panel.data[0]);
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--gf-border)', background: 'var(--gf-hover)' }}>
            {cols.map(c => <th key={c} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--gf-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {panel.data.slice(0, 50).map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--gf-border)', background: i % 2 === 0 ? 'transparent' : 'var(--gf-hover)' }}>
              {cols.map(c => <td key={c} style={{ padding: '5px 10px', color: 'var(--gf-text)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(row[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsPanel({ panel }: { panel: Panel }) {
  if (!panel.data.length) return <EmptyState />;
  return (
    <div style={{ height: '100%', overflow: 'auto', fontFamily: 'monospace', fontSize: 11 }}>
      {panel.data.map((row, i) => (
        <div key={i} style={{ padding: '2px 8px', borderBottom: '1px solid var(--gf-border)', display: 'flex', gap: 10 }}>
          <span style={{ color: 'var(--gf-text-muted)', flexShrink: 0 }}>{row.time}</span>
          <span style={{ color: 'var(--gf-text)' }}>{row.value ?? JSON.stringify(row)}</span>
        </div>
      ))}
    </div>
  );
}

function MapPanel() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--gf-text-muted)' }}>
      <span style={{ fontSize: 32 }}>🗺️</span>
      <span style={{ fontSize: 13 }}>Geo map — coming soon</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gf-text-muted)', fontSize: 13, flexDirection: 'column', gap: 6 }}>
      <span style={{ opacity: 0.4, fontSize: 24 }}>◌</span>
      <span>No data — run a query to populate</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gf-text-muted)', fontSize: 13 }}>
      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PanelRenderer({ panel }: { panel: Panel }) {
  if (panel.loading) return <LoadingState />;
  if (panel.error)   return <div style={{ color: '#f87171', fontSize: 12, padding: 12 }}>⚠ {panel.error}</div>;
  switch (panel.type) {
    case 'timeseries': return <TimeSeriesPanel panel={panel} />;
    case 'bar':        return <BarPanel panel={panel} />;
    case 'stat':       return <StatPanel panel={panel} />;
    case 'gauge':      return <GaugePanel panel={panel} />;
    case 'table':      return <TablePanel panel={panel} />;
    case 'logs':       return <LogsPanel panel={panel} />;
    case 'map':        return <MapPanel />;
    default:           return <EmptyState />;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NewDashboardPage() {
  const router = useRouter();
  const { getActiveInfluxDB } = useDataSourcesStore();
  const ds = getActiveInfluxDB();

  const [title,      setTitle]    = useState('New dashboard');
  const [editTitle,  setEditTitle]= useState(false);
  const [panels,     setPanels]   = useState<Panel[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPanel,  setEditPanel] = useState<Panel | null>(null);
  const [addStep,    setAddStep]  = useState<'type' | 'config'>('type');
  const [draftType,  setDraftType]= useState<PanelType>('timeseries');
  const [saved,      setSaved]    = useState(false);

  // Drag state
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const openAddDrawer = () => { setEditPanel(null); setAddStep('type'); setDrawerOpen(true); };

  const openEditDrawer = (p: Panel) => { setEditPanel({ ...p }); setAddStep('config'); setDrawerOpen(true); };

  const closeDrawer = () => { setDrawerOpen(false); setEditPanel(null); };

  const updateEditPanel = (k: keyof Panel, v: any) =>
    setEditPanel(prev => prev ? { ...prev, [k]: v } : prev);

  const runQuery = useCallback(async (panel: Panel) => {
    if (!ds || !panel.query.trim()) return panel;
    setPanels(ps => ps.map(p => p.id === panel.id ? { ...p, loading: true, error: null } : p));
    try {
      const res  = await fetch('/api/datasources/influxdb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ds, query: panel.query }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      let data: any[] = [];
      if (json.format === 'csv') {
        const raw = parseFluxCSV(json.data);
        data = panel.type === 'table' ? raw : toChartData(raw);
      } else if (json.format === 'influxql') {
        const rows = json.data?.results?.[0]?.series?.[0];
        if (rows) {
          const cols = rows.columns as string[];
          data = rows.values.map((vals: any[]) => {
            const obj: Record<string, any> = {};
            cols.forEach((c, i) => obj[c] = vals[i]);
            return { time: new Date(obj.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: parseFloat(obj.value ?? obj[cols[1]] ?? 0) };
          });
        }
      }
      setPanels(ps => ps.map(p => p.id === panel.id ? { ...p, data, loading: false } : p));
      return { ...panel, data };
    } catch (err: any) {
      setPanels(ps => ps.map(p => p.id === panel.id ? { ...p, loading: false, error: err.message } : p));
      return panel;
    }
  }, [ds]);

  const addPanel = () => {
    if (!editPanel) {
      // brand new panel from type selection
      const p = newPanel(draftType, panels.length);
      setPanels(ps => [...ps, p]);
      setEditPanel(p);
      setAddStep('config');
    }
  };

  const savePanel = async () => {
    if (!editPanel) { closeDrawer(); return; }
    // upsert
    setPanels(ps => {
      const exists = ps.find(p => p.id === editPanel.id);
      return exists ? ps.map(p => p.id === editPanel.id ? editPanel : p) : [...ps, editPanel];
    });
    closeDrawer();
    // run query after state settles
    setTimeout(() => runQuery(editPanel), 50);
  };

  const deletePanel = (id: string) => {
    setPanels(ps => ps.filter(p => p.id !== id));
    if (editPanel?.id === id) closeDrawer();
  };

  const duplicatePanel = (p: Panel) => {
    const clone: Panel = { ...p, id: `panel-${Date.now()}`, title: p.title + ' (copy)', x: (p.x + 1) % 10, y: p.y + p.h, data: [...p.data] };
    setPanels(ps => [...ps, clone]);
  };

  const handleSaveDashboard = () => { setSaved(true); setTimeout(() => router.push('/dashboards'), 800); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gf-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Dashboard top bar ── */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--gf-border)', background: 'var(--gf-topnav)', position: 'sticky', top: 0, zIndex: 20 }}>
        {editTitle ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditTitle(false)} onKeyDown={e => e.key === 'Enter' && setEditTitle(false)}
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--gf-text)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--gf-accent)', outline: 'none', fontFamily: 'inherit', minWidth: 200 }} />
        ) : (
          <span onClick={() => setEditTitle(true)} style={{ fontSize: 15, fontWeight: 700, color: 'var(--gf-text)', cursor: 'text', padding: '2px 4px', borderRadius: 4 }}
            title="Click to rename">{title} ✎</span>
        )}

        {ds && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(61,113,232,0.12)', color: 'var(--gf-accent)', border: '1px solid rgba(61,113,232,0.25)' }}>
            📊 {ds.url}
          </span>
        )}
        {!ds && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(244,63,94,0.12)', color: '#f87171', border: '1px solid rgba(244,63,94,0.25)', cursor: 'pointer' }}
            onClick={() => router.push('/plugins/influxdb')}>
            ⚠ No data source — click to connect
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={openAddDrawer}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 5, background: 'var(--gf-hover)', border: '1px solid var(--gf-border)', color: 'var(--gf-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add panel
          </button>
          <button onClick={handleSaveDashboard}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 5, background: saved ? '#16a34a' : 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>
            {saved ? '✓ Saved' : '💾 Save dashboard'}
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, padding: 16, position: 'relative' }}>
        {panels.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
            <div style={{ fontSize: 48, opacity: 0.3 }}>⊞</div>
            <p style={{ color: 'var(--gf-text-muted)', fontSize: 15, margin: 0 }}>Dashboard is empty</p>
            <button onClick={openAddDrawer}
              style={{ padding: '10px 24px', borderRadius: 6, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add your first panel
            </button>
          </div>
        )}

        {/* Simple CSS grid layout — 12 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8, gridAutoRows: '80px' }}>
          {panels.map(panel => (
            <motion.div key={panel.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                gridColumn: `${panel.x + 1} / span ${panel.w}`,
                gridRow: `${panel.y + 1} / span ${panel.h}`,
                background: 'var(--gf-surface)',
                border: '1px solid var(--gf-border)',
                borderRadius: 6,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={e => (e.currentTarget.querySelector('.panel-actions') as HTMLElement)?.style && ((e.currentTarget.querySelector('.panel-actions') as HTMLElement).style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.querySelector('.panel-actions') as HTMLElement)?.style && ((e.currentTarget.querySelector('.panel-actions') as HTMLElement).style.opacity = '0')}
            >
              {/* Panel header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid var(--gf-border)', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{panel.title}</span>
                <div className="panel-actions" style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s' }}>
                  <button onClick={() => runQuery(panel)} title="Refresh" style={actionBtn}>⟳</button>
                  <button onClick={() => openEditDrawer(panel)} title="Edit" style={actionBtn}>✎</button>
                  <button onClick={() => duplicatePanel(panel)} title="Duplicate" style={actionBtn}>⧉</button>
                  <button onClick={() => deletePanel(panel.id)} title="Remove" style={{ ...actionBtn, color: '#f87171' }}>✕</button>
                </div>
              </div>
              {/* Panel body */}
              <div style={{ flex: 1, overflow: 'hidden', padding: panel.type === 'table' || panel.type === 'logs' ? 0 : '4px 8px 8px' }}>
                <PanelRenderer panel={panel} />
              </div>

              {/* Resize handle hint */}
              <div style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 10, color: 'var(--gf-text-muted)', opacity: 0.4, userSelect: 'none' }}>⤡</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeDrawer}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />

            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, background: 'var(--gf-surface)', borderLeft: '1px solid var(--gf-border)', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Drawer header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--gf-text)' }}>
                  {editPanel ? 'Edit panel' : addStep === 'type' ? 'Add panel' : 'Configure panel'}
                </span>
                <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: 'var(--gf-text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
              </div>

              {/* Drawer body */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>

                {/* Step 1: pick type (only for new panels) */}
                {!editPanel && addStep === 'type' && (
                  <div>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--gf-text-muted)' }}>Choose a visualization type:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {PANEL_TYPES.map(pt => {
                        const disabled = pt.type === 'map';
                        return (
                          <button key={pt.type} onClick={() => !disabled && setDraftType(pt.type)} disabled={disabled}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 6, border: `1px solid ${draftType === pt.type ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: draftType === pt.type ? 'rgba(61,113,232,0.1)' : 'var(--gf-hover)', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: disabled ? 0.5 : 1, fontFamily: 'inherit' }}>
                            <span style={{ fontSize: 22 }}>{pt.icon}</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>{pt.label}</div>
                              <div style={{ fontSize: 11, color: 'var(--gf-text-muted)' }}>{pt.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: configure (new or edit) */}
                {(editPanel || addStep === 'config') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Panel type (edit mode) */}
                    {editPanel && (
                      <div>
                        <label style={drawerLabel}>Visualization</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                          {PANEL_TYPES.filter(pt => pt.type !== 'map').map(pt => (
                            <button key={pt.type}
                              onClick={() => updateEditPanel('type', pt.type)}
                              style={{ padding: '8px 4px', borderRadius: 5, border: `1px solid ${editPanel.type === pt.type ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: editPanel.type === pt.type ? 'rgba(61,113,232,0.1)' : 'var(--gf-hover)', cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit' }}>
                              <div style={{ fontSize: 18 }}>{pt.icon}</div>
                              <div style={{ fontSize: 10, color: 'var(--gf-text-secondary)', marginTop: 2 }}>{pt.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label style={drawerLabel}>Title</label>
                      <input value={(editPanel ?? { title: '' }).title}
                        onChange={e => updateEditPanel('title', e.target.value)}
                        style={drawerInput} />
                    </div>

                    {/* Query */}
                    <div>
                      <label style={drawerLabel}>
                        Query {ds ? <span style={{ color: 'var(--gf-text-muted)', fontWeight: 400 }}>({ds.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL'} · {ds.url})</span> : <span style={{ color: '#f87171' }}>— no data source</span>}
                      </label>
                      {ds?.queryLanguage === 'flux' ? (
                        <div style={{ fontSize: 11, color: 'var(--gf-text-muted)', marginBottom: 6 }}>
                          Example: <code style={{ background: 'var(--gf-hover)', padding: '1px 5px', borderRadius: 3 }}>from(bucket: "{ds.bucket}") |&gt; range(start: -1h) |&gt; filter(fn: (r) =&gt; r._measurement == "cpu")</code>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--gf-text-muted)', marginBottom: 6 }}>
                          Example: <code style={{ background: 'var(--gf-hover)', padding: '1px 5px', borderRadius: 3 }}>SELECT mean("value") FROM "cpu" WHERE time &gt; now() - 1h GROUP BY time(1m)</code>
                        </div>
                      )}
                      <textarea value={(editPanel ?? { query: '' }).query}
                        onChange={e => updateEditPanel('query', e.target.value)}
                        rows={5}
                        placeholder={ds ? (ds.queryLanguage === 'flux' ? `from(bucket: "${ds.bucket || 'my-bucket'}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")` : `SELECT mean("value") FROM "cpu" WHERE time > now() - 1h GROUP BY time(1m)`) : 'Connect a data source first'}
                        style={{ ...drawerInput, fontFamily: 'monospace', fontSize: 12, resize: 'vertical', minHeight: 100 }} />
                    </div>

                    {/* Color + Unit */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={drawerLabel}>Color</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {COLORS.map(c => (
                            <button key={c} onClick={() => updateEditPanel('color', c)}
                              style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${(editPanel?.color ?? '') === c ? '#fff' : 'transparent'}`, cursor: 'pointer', padding: 0 }} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={drawerLabel}>Unit</label>
                        <select value={(editPanel ?? { unit: 'none' }).unit}
                          onChange={e => updateEditPanel('unit', e.target.value)}
                          style={{ ...drawerInput, padding: '7px 10px' }}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Grid size */}
                    <div>
                      <label style={drawerLabel}>Panel size (columns × rows)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--gf-text-muted)' }}>Width (1–12)</label>
                          <input type="range" min={2} max={12} value={(editPanel ?? { w: 6 }).w}
                            onChange={e => updateEditPanel('w', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--gf-accent)' }} />
                          <span style={{ fontSize: 11, color: 'var(--gf-text)' }}>{(editPanel ?? { w: 6 }).w} cols</span>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: 'var(--gf-text-muted)' }}>Height (rows)</label>
                          <input type="range" min={2} max={12} value={(editPanel ?? { h: 4 }).h}
                            onChange={e => updateEditPanel('h', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--gf-accent)' }} />
                          <span style={{ fontSize: 11, color: 'var(--gf-text)' }}>{(editPanel ?? { h: 4 }).h} rows</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Drawer footer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gf-border)', display: 'flex', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
                {editPanel && (
                  <button onClick={() => deletePanel(editPanel.id)}
                    style={{ padding: '8px 14px', borderRadius: 5, border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete panel
                  </button>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={closeDrawer}
                    style={{ padding: '8px 16px', borderRadius: 5, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                  {!editPanel && addStep === 'type' ? (
                    <button onClick={() => { addPanel(); }}
                      style={{ padding: '8px 16px', borderRadius: 5, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={savePanel}
                      style={{ padding: '8px 16px', borderRadius: 5, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Apply
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
  color: 'var(--gf-text-muted)', padding: '2px 4px', borderRadius: 3,
  transition: 'color 0.1s',
};

const drawerLabel: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gf-text)', marginBottom: 6,
};

const drawerInput: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 5, border: '1px solid var(--gf-border)',
  background: 'var(--gf-input)', color: 'var(--gf-text)', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
};