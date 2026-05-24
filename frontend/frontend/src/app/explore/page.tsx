// src/app/explore/page.tsx
'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDataSourcesStore, InfluxDBConfig } from '@/store/datasources';

// ─── Types ───────────────────────────────────────────────────────────────────
type ViewMode = 'Lines' | 'Bars' | 'Points' | 'Stacked lines';
type Tab = 'Queries' | 'Graph' | 'Table';

interface QueryResult {
  raw: Record<string, any>[];
  chart: { time: string; value: number; series: string }[];
  error: string | null;
  duration: number;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────
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

function toChartData(raw: Record<string, any>[]): { time: string; value: number; series: string }[] {
  return raw.map(r => ({
    time: r._time ? new Date(r._time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '',
    value: parseFloat(r._value ?? r.value ?? 0),
    series: r._field ?? r._measurement ?? 'value',
  })).filter(r => !isNaN(r.value));
}

function toInfluxQLChart(data: any): { time: string; value: number; series: string }[] {
  const result = data?.results?.[0]?.series?.[0];
  if (!result) return [];
  const cols = result.columns as string[];
  return result.values.map((vals: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((c, i) => { obj[c] = vals[i]; });
    return {
      time: new Date(obj.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: parseFloat(obj.value ?? obj[cols[1]] ?? 0),
      series: result.name ?? 'series',
    };
  });
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const IcoPlay    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoPlus    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoHistory = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>;
const IcoInfo    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const IcoSplit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>;
const IcoChevD   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoTrash   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
const IcoCopy    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;

const SERIES_COLORS = ['#4ade80','#3d71e8','#f59e0b','#f43f5e','#a78bfa','#06b6d4'];

// ─── Query row ───────────────────────────────────────────────────────────────
interface QueryRow {
  id: string;
  label: string;
  query: string;
  enabled: boolean;
  result: QueryResult | null;
  loading: boolean;
}

function newRow(label: string): QueryRow {
  return { id: `q-${Date.now()}-${Math.random()}`, label, query: '', enabled: true, result: null, loading: false };
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const { influxDBConfigs, activeInfluxDBId, setActiveInfluxDB, getActiveInfluxDB } = useDataSourcesStore();
  const ds = getActiveInfluxDB();

  const [rows, setRows]         = useState<QueryRow[]>([newRow('A')]);
  const [activeTab, setActiveTab] = useState<Tab>('Queries');
  const [viewMode, setViewMode] = useState<ViewMode>('Lines');
  const [dsOpen, setDsOpen]     = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [runningAll, setRunningAll] = useState(false);

  const updateRow = (id: string, patch: Partial<QueryRow>) =>
    setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));

  const runQuery = useCallback(async (row: QueryRow, dsOverride?: InfluxDBConfig) => {
    const source = dsOverride ?? ds;
    if (!source || !row.query.trim()) return;
    updateRow(row.id, { loading: true, result: null });
    const t0 = Date.now();
    try {
      const res  = await fetch('/api/datasources/influxdb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...source, query: row.query }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      let raw: Record<string, any>[] = [];
      let chart: { time: string; value: number; series: string }[] = [];
      if (json.format === 'csv') {
        raw   = parseFluxCSV(json.data);
        chart = toChartData(raw);
      } else {
        raw   = json.data?.results?.[0]?.series?.[0]?.values ?? [];
        chart = toInfluxQLChart(json.data);
      }
      const result: QueryResult = { raw, chart, error: null, duration: Date.now() - t0 };
      updateRow(row.id, { loading: false, result });
      setQueryHistory(h => [row.query, ...h.filter(q => q !== row.query)].slice(0, 20));
    } catch (err: any) {
      updateRow(row.id, { loading: false, result: { raw: [], chart: [], error: err.message, duration: Date.now() - t0 } });
    }
  }, [ds]);

  const runAll = async () => {
    setRunningAll(true);
    await Promise.all(rows.filter(r => r.enabled && r.query.trim()).map(r => runQuery(r)));
    setRunningAll(false);
  };

  const addRow = () => {
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    setRows(rs => [...rs, newRow(labels[rs.length % 26])]);
  };

  const deleteRow = (id: string) => setRows(rs => rs.filter(r => r.id !== id));
  const duplicateRow = (row: QueryRow) => setRows(rs => [...rs, { ...row, id: `q-${Date.now()}`, label: row.label + "'" }]);

  // Merge all chart data for graph view
  const allChartData = (() => {
    const times = new Set<string>();
    rows.forEach(r => r.result?.chart.forEach(d => times.add(d.time)));
    const sorted = [...times].sort();
    return sorted.map(time => {
      const point: Record<string, any> = { time };
      rows.forEach((r, i) => {
        const d = r.result?.chart.find(d => d.time === time);
        point[r.label] = d?.value ?? null;
      });
      return point;
    });
  })();

  const hasData = rows.some(r => r.result?.chart.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 41px)', background: 'var(--gf-bg)', overflow: 'hidden' }}>

      {/* ── Top toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--gf-border)', background: 'var(--gf-topnav)', flexShrink: 0, flexWrap: 'wrap' }}>

        {/* Outline label */}
        <button style={toolBtn}>
          <span style={{ fontSize: 11 }}>☰</span> Outline
        </button>

        {/* Data source selector */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setDsOpen(v => !v)} style={{ ...toolBtn, minWidth: 200, justifyContent: 'space-between', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>📊</span>
              <span style={{ fontSize: 13, color: 'var(--gf-text)' }}>
                {ds ? ds.url : '-- Select data source --'}
              </span>
            </span>
            <span style={{ color: 'var(--gf-text-muted)', transform: dsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'flex' }}><IcoChevD /></span>
          </button>
          <AnimatePresence>
            {dsOpen && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
                style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 280, background: 'var(--gf-surface)', border: '1px solid var(--gf-border)', borderRadius: 6, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--gf-border)', fontSize: 11, fontWeight: 700, color: 'var(--gf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Connected data sources
                </div>
                {influxDBConfigs.length === 0 && (
                  <div style={{ padding: '16px 12px', fontSize: 13, color: 'var(--gf-text-muted)', textAlign: 'center' }}>
                    No data sources configured.<br />
                    <a href="/plugins/influxdb" style={{ color: 'var(--gf-accent)', textDecoration: 'none' }}>+ Connect InfluxDB</a>
                  </div>
                )}
                {influxDBConfigs.map(cfg => (
                  <button key={cfg.id} onClick={() => { setActiveInfluxDB(cfg.id); setDsOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: cfg.id === activeInfluxDBId ? 'rgba(61,113,232,0.1)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--gf-border)', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 18 }}>📊</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gf-text-muted)' }}>{cfg.url} · {cfg.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL'}</div>
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.status === 'connected' ? '#4ade80' : '#f87171', flexShrink: 0 }} />
                    {cfg.id === activeInfluxDBId && <span style={{ color: 'var(--gf-accent)', fontSize: 12 }}>✓</span>}
                  </button>
                ))}
                <a href="/plugins/influxdb" style={{ display: 'block', padding: '10px 12px', fontSize: 12, color: 'var(--gf-accent)', textDecoration: 'none', borderTop: influxDBConfigs.length > 0 ? '1px solid var(--gf-border)' : 'none' }}>
                  + Add new InfluxDB connection
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right toolbar */}
        <button style={toolBtn}><IcoSplit /> Split</button>
        <div style={{ width: 1, height: 20, background: 'var(--gf-border)' }} />
        <button style={toolBtn} title="Zoom out">«</button>
        <button style={toolBtn} title="Time back">‹</button>
        <button style={toolBtn} title="Time forward">›</button>
        <button style={toolBtn} title="Zoom in">»</button>
        <div style={{ width: 1, height: 20, background: 'var(--gf-border)' }} />
        <button onClick={runAll} disabled={runningAll || !ds}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 5, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: ds ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: !ds ? 0.5 : 1 }}>
          {runningAll ? <span style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>⟳</span> : <IcoPlay />}
          Run
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </div>

      {/* ── Main layout: left panel + right result ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: queries panel ── */}
        <div style={{ width: 380, borderRight: '1px solid var(--gf-border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--gf-surface)' }}>

          {/* Left tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gf-border)', flexShrink: 0 }}>
            {(['Queries', 'Graph', 'Table'] as Tab[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: '9px 0', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === t ? 'var(--gf-accent)' : 'transparent'}`, fontSize: 12, fontWeight: 600, color: activeTab === t ? 'var(--gf-text)' : 'var(--gf-text-secondary)', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.15s' }}>
                {t === 'Queries' && '⟨⟩ '}{t === 'Graph' && '▦ '}{t === 'Table' && '⊞ '}{t}
              </button>
            ))}
          </div>

          {/* Left panel content */}
          <div style={{ flex: 1, overflow: 'auto' }}>

            {activeTab === 'Queries' && (
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* No DS warning */}
                {!ds && (
                  <div style={{ padding: '12px', borderRadius: 6, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 13, color: '#f87171' }}>
                    ⚠ No data source selected. <a href="/plugins/influxdb" style={{ color: '#f87171', fontWeight: 600 }}>Connect InfluxDB →</a>
                  </div>
                )}

                {/* Query rows */}
                {rows.map((row, idx) => (
                  <motion.div key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ border: '1px solid var(--gf-border)', borderRadius: 6, overflow: 'hidden', background: 'var(--gf-bg)' }}>

                    {/* Row header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--gf-hover)', borderBottom: '1px solid var(--gf-border)' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 4, background: SERIES_COLORS[idx % SERIES_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--gf-text-secondary)', flex: 1 }}>{ds ? `(${ds.url})` : '--'}</span>
                      <button onClick={() => duplicateRow(row)} style={iconBtn} title="Duplicate"><IcoCopy /></button>
                      <button onClick={() => deleteRow(row.id)} style={{ ...iconBtn, color: '#f87171' }} title="Delete" disabled={rows.length === 1}><IcoTrash /></button>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input type="checkbox" checked={row.enabled} onChange={e => updateRow(row.id, { enabled: e.target.checked })} style={{ accentColor: 'var(--gf-accent)', cursor: 'pointer' }} />
                        <span style={{ fontSize: 11, color: 'var(--gf-text-muted)' }}>on</span>
                      </label>
                    </div>

                    {/* Query textarea */}
                    <div style={{ padding: 10 }}>
                      <textarea
                        value={row.query}
                        onChange={e => updateRow(row.id, { query: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runQuery(row); } }}
                        placeholder={ds?.queryLanguage === 'flux'
                          ? `from(bucket: "${ds?.bucket || 'my-bucket'}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")`
                          : 'SELECT mean("value") FROM "cpu" WHERE time > now() - 1h GROUP BY time(1m)'}
                        rows={4}
                        style={{ width: '100%', background: 'var(--gf-input)', border: '1px solid var(--gf-border)', borderRadius: 4, color: 'var(--gf-text)', fontSize: 12, fontFamily: 'monospace', padding: '8px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor = 'var(--gf-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--gf-border)'}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--gf-text-muted)' }}>Ctrl+Enter to run</span>
                        <button onClick={() => runQuery(row)} disabled={!ds || !row.query.trim() || row.loading}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!ds || !row.query.trim()) ? 0.5 : 1 }}>
                          {row.loading ? '⟳' : <IcoPlay />} Run
                        </button>
                      </div>

                      {/* Per-query result summary */}
                      {row.result?.error && (
                        <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 4, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', fontSize: 12, color: '#f87171' }}>
                          ⚠ {row.result.error}
                        </div>
                      )}
                      {row.result && !row.result.error && (
                        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--gf-text-muted)', display: 'flex', gap: 10 }}>
                          <span>✓ {row.result.chart.length} points</span>
                          <span>{row.result.duration}ms</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 5, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <IcoPlus /> Add query
                  </button>
                  <button onClick={() => setHistoryOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 5, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <IcoHistory /> Query history
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 5, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <IcoInfo /> Inspector
                  </button>
                </div>

                {/* Query history */}
                <AnimatePresence>
                  {historyOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ border: '1px solid var(--gf-border)', borderRadius: 6, overflow: 'hidden', background: 'var(--gf-bg)' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--gf-border)', fontSize: 11, fontWeight: 700, color: 'var(--gf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Query history
                      </div>
                      {queryHistory.length === 0 && <div style={{ padding: '16px 12px', fontSize: 13, color: 'var(--gf-text-muted)', textAlign: 'center' }}>No queries run yet</div>}
                      {queryHistory.map((q, i) => (
                        <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid var(--gf-border)', display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                          onClick={() => updateRow(rows[rows.length - 1].id, { query: q })}>
                          <code style={{ flex: 1, fontSize: 11, color: 'var(--gf-text)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{q.slice(0, 120)}{q.length > 120 ? '…' : ''}</code>
                          <span style={{ fontSize: 10, color: 'var(--gf-accent)', flexShrink: 0 }}>↵ use</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'Graph' && (
              <div style={{ padding: 12 }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--gf-text-muted)' }}>View mode</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['Lines','Bars','Points','Stacked lines'] as ViewMode[]).map(m => (
                    <button key={m} onClick={() => setViewMode(m)}
                      style={{ padding: '5px 10px', borderRadius: 4, border: `1px solid ${viewMode === m ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: viewMode === m ? 'rgba(61,113,232,0.1)' : 'var(--gf-hover)', color: viewMode === m ? 'var(--gf-accent)' : 'var(--gf-text-secondary)', fontSize: 12, fontWeight: viewMode === m ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Table' && (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--gf-text-muted)' }}>
                Table view shows in the right panel after running a query.
              </div>
            )}
          </div>
        </div>

        {/* ── Right: results ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Graph section */}
          <div style={{ flex: '0 0 55%', borderBottom: '1px solid var(--gf-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--gf-border)', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>Graph</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Lines','Bars','Points','Stacked lines'] as ViewMode[]).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    style={{ padding: '3px 8px', borderRadius: 3, border: 'none', background: viewMode === m ? 'var(--gf-hover)' : 'transparent', color: viewMode === m ? 'var(--gf-text)' : 'var(--gf-text-muted)', fontSize: 12, fontWeight: viewMode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden' }}>
              {!hasData && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gf-text-muted)', gap: 10 }}>
                  <div style={{ fontSize: 40, opacity: 0.2 }}>◌</div>
                  <div style={{ fontSize: 14 }}>Run a query to see results</div>
                  {!ds && <a href="/plugins/influxdb" style={{ fontSize: 13, color: 'var(--gf-accent)', textDecoration: 'none' }}>Connect a data source first →</a>}
                </div>
              )}
              {hasData && (
                <ResponsiveContainer width="100%" height="100%">
                  {viewMode === 'Bars' ? (
                    <BarChart data={allChartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gf-border)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--gf-surface)', border: '1px solid var(--gf-border)', borderRadius: 6, fontSize: 12 }} />
                      {rows.map((r, i) => <Bar key={r.id} dataKey={r.label} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[2,2,0,0]} />)}
                    </BarChart>
                  ) : (
                    <AreaChart data={allChartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                      <defs>
                        {rows.map((r, i) => (
                          <linearGradient key={r.id} id={`grad-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={viewMode === 'Lines' ? 0.1 : 0.3} />
                            <stop offset="95%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--gf-border)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--gf-text-muted)' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--gf-surface)', border: '1px solid var(--gf-border)', borderRadius: 6, fontSize: 12 }} />
                      {rows.map((r, i) => (
                        <Area key={r.id} type="monotone" dataKey={r.label} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={viewMode === 'Points' ? 0 : 2} fill={`url(#grad-${r.id})`} dot={viewMode === 'Points' ? { r: 2, fill: SERIES_COLORS[i % SERIES_COLORS.length] } : false} connectNulls />
                      ))}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            {hasData && (
              <div style={{ display: 'flex', gap: 14, padding: '6px 16px 10px', flexShrink: 0, flexWrap: 'wrap' }}>
                {rows.filter(r => r.result?.chart.length).map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gf-text-secondary)' }}>
                    <span style={{ width: 24, height: 2, background: SERIES_COLORS[i % SERIES_COLORS.length], borderRadius: 1, display: 'inline-block' }} />
                    {r.label}-series
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--gf-border)', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>Table</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {rows.map(r => {
                if (!r.result?.raw.length) return null;
                const cols = Object.keys(r.result.raw[0]);
                return (
                  <div key={r.id}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--gf-hover)', position: 'sticky', top: 0, zIndex: 1 }}>
                          {cols.map(c => <th key={c} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--gf-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--gf-border)' }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {r.result.raw.slice(0, 100).map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--gf-border)', background: i % 2 === 0 ? 'transparent' : 'var(--gf-hover)' }}>
                            {cols.map(c => <td key={c} style={{ padding: '5px 12px', color: 'var(--gf-text)', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>{String(row[c])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {!rows.some(r => r.result?.raw.length) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gf-text-muted)', fontSize: 13 }}>
                  No data yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const toolBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
  borderRadius: 5, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)',
  color: 'var(--gf-text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  fontFamily: 'inherit', whiteSpace: 'nowrap',
};

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gf-text-muted)',
  padding: '2px 4px', borderRadius: 3, display: 'flex', alignItems: 'center',
};