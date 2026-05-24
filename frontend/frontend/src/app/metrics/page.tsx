// src/app/metrics/page.tsx
'use client';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSourcesStore } from '@/store/datasources';

type ResultFormat = 'table' | 'chart';
interface Row { [key: string]: string | number }

const TIMES = ['Last 5m','Last 15m','Last 1h','Last 6h','Last 24h','Last 7d'];

const TIME_FLUX: Record<string, string> = {
  'Last 5m': '-5m','Last 15m': '-15m','Last 1h': '-1h',
  'Last 6h': '-6h','Last 24h': '-24h','Last 7d': '-7d',
};

/* ── Parse Flux CSV → rows ── */
function parseFluxCSV(csv: string): Row[] {
  const blocks = csv.split(/\r?\n\r?\n/).filter(Boolean);
  const out: Row[] = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter(l => l && !l.startsWith('#'));
    if (lines.length < 2) continue;
    const headers = lines[0].split(',').map(h => h.trim());
    for (const line of lines.slice(1)) {
      const vals = line.split(',');
      if (vals.length < 2) continue;
      const obj: Row = {};
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() ?? ''; });
      out.push(obj);
    }
  }
  return out;
}

/* ── Parse InfluxQL JSON → rows ── */
function parseInfluxQL(json: any): Row[] {
  const series = json?.results?.[0]?.series;
  if (!series?.length) return [];
  const out: Row[] = [];
  for (const s of series) {
    const cols = s.columns as string[];
    for (const vals of (s.values ?? [])) {
      const obj: Row = {};
      cols.forEach((c, i) => { obj[c] = vals[i] ?? ''; });
      if (s.name) obj._measurement = s.name;
      out.push(obj);
    }
  }
  return out;
}

/* ── SVG line chart ── */
function ResultChart({ rows }: { rows: Row[] }) {
  const timeKey = rows[0] && ('_time' in rows[0] ? '_time' : 'time' in rows[0] ? 'time' : null);
  const valKey  = rows[0] && ('_value' in rows[0] ? '_value' : 'value' in rows[0] ? 'value' : null);
  if (!timeKey || !valKey) return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Cannot render chart — no time or value column detected.</div>;

  const vals = rows.map(r => Number(r[valKey])).filter(v => !isNaN(v));
  if (!vals.length) return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>No numeric values to chart.</div>;

  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 860, H = 200, pad = { t: 20, b: 32, l: 52, r: 16 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const px = (i: number) => pad.l + (i / (Math.max(vals.length - 1, 1))) * iW;
  const py = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * iH;

  const linePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${px(vals.length-1).toFixed(1)},${(pad.t+iH).toFixed(1)} L${pad.l},${(pad.t+iH).toFixed(1)} Z`;

  const yTicks = [min, (min+max)/2, max];
  const xStep  = Math.max(1, Math.floor(rows.length / 5));
  const xTicks = Array.from({ length: Math.ceil(rows.length / xStep) }, (_, i) => i * xStep).filter(i => i < rows.length);

  const fmtTime = (raw: string | number) => {
    try { return new Date(String(raw)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return String(raw).slice(0, 5); }
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W-pad.r} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth="1"/>
          <text x={pad.l-6} y={py(v)+4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v.toFixed(1)}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#expGrad)"/>
      <path d={linePath}  fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
      {xTicks.map(i => (
        <text key={i} x={px(i)} y={H-6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {fmtTime(rows[i][timeKey])}
        </text>
      ))}
    </svg>
  );
}

/* ── Icons ── */
const IcoRun   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoTable = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>;
const IcoChart = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcoSpin  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'exp-s 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes exp-s{to{transform:rotate(360deg)}}`}</style></svg>;
const IcoCopy  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IcoWarn  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

export default function ExplorePage() {
  const { influxDBConfigs, getActiveInfluxDB } = useDataSourcesStore();
  const [sourceId, setSourceId] = useState(() => getActiveInfluxDB()?.id ?? '');
  const [time,     setTime]     = useState('Last 1h');
  const [query,    setQuery]    = useState('');
  const [running,  setRunning]  = useState(false);
  const [rows,     setRows]     = useState<Row[] | null>(null);
  const [error,    setError]    = useState('');
  const [format,   setFormat]   = useState<ResultFormat>('table');
  const [copied,   setCopied]   = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [elapsed,  setElapsed]  = useState(0);

  const ds = influxDBConfigs.find(c => c.id === sourceId) ?? getActiveInfluxDB();

  /* Auto-populate example query when source changes */
  const getExampleQuery = useCallback((lang: 'flux' | 'influxql', bucket = 'my-bucket', timeRange = '-1h') => {
    if (lang === 'flux') return `from(bucket: "${bucket}")\n  |> range(start: ${timeRange})\n  |> filter(fn: (r) => r._measurement == "cpu")\n  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)`;
    return `SELECT mean("value") FROM "cpu"\nWHERE time > now() - 1h\nGROUP BY time(1m) fill(none)`;
  }, []);

  const loadExample = () => {
    if (!ds) return;
    const timeRange = TIME_FLUX[time] ?? '-1h';
    setQuery(getExampleQuery(ds.queryLanguage, ds.bucket || 'my-bucket', timeRange));
  };

  const runQuery = async () => {
    if (!ds) { setError('No data source selected. Connect one in Plugins → InfluxDB.'); return; }
    if (!query.trim()) { setError('Query is empty.'); return; }
    setRunning(true); setError(''); setRows(null);
    const t0 = Date.now();
    try {
      const res  = await fetch('/api/datasources/influxdb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ds, query }),
      });
      const data = await res.json();
      setElapsed(Date.now() - t0);

      if (!data.ok) { setError(data.message); setRunning(false); return; }

      let parsed: Row[] = [];
      if (data.format === 'csv')      parsed = parseFluxCSV(data.data);
      if (data.format === 'influxql') parsed = parseInfluxQL(data.data);

      setRows(parsed);
      setRowCount(parsed.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setRunning(false);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const cols = rows?.length ? Object.keys(rows[0]) : [];

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Explore</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Ad-hoc query your data sources — no dashboard needed</p>
      </div>

      {/* No data source warning */}
      {!ds && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: '#fef9c3', border: '1px solid #fde047', marginBottom: 20 }}>
          <span style={{ color: '#b45309' }}><IcoWarn /></span>
          <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
            No data source connected.{' '}
            <a href="/plugins/influxdb" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Connect InfluxDB →</a>
          </p>
        </motion.div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Source picker */}
        <select value={sourceId} onChange={e => { setSourceId(e.target.value); setRows(null); setError(''); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', minWidth: 200 }}>
          {influxDBConfigs.length === 0 && <option value="">No data sources</option>}
          {influxDBConfigs.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.queryLanguage})</option>
          ))}
        </select>

        {/* Time range */}
        <select value={time} onChange={e => setTime(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          {TIMES.map(t => <option key={t}>{t}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
          {(['table','chart'] as ResultFormat[]).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: format === f ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: format === f ? 600 : 400, color: format === f ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif', borderRight: f === 'table' ? '1px solid var(--border)' : 'none', transition: 'all 0.12s' }}>
              {f === 'table' ? <IcoTable /> : <IcoChart />}
              {f === 'table' ? 'Table' : 'Chart'}
            </button>
          ))}
        </div>

        {/* Run */}
        <button onClick={runQuery} disabled={running || !ds}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: running || !ds ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', opacity: running || !ds ? 0.6 : 1, transition: 'opacity 0.15s' }}>
          {running ? <IcoSpin /> : <IcoRun />}
          {running ? 'Running…' : 'Run  ⌘↵'}
        </button>
      </div>

      {/* Query editor */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {ds?.queryLanguage === 'flux' ? 'Flux query' : 'InfluxQL query'}
            </span>
            {ds && (
              <span style={{ padding: '1px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                {ds.queryLanguage}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {ds && (
              <button onClick={loadExample}
                style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                Load example
              </button>
            )}
            <button onClick={copyQuery}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: copied ? '#10b981' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
              <IcoCopy /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <textarea value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); } }}
          rows={7}
          placeholder={ds
            ? (ds.queryLanguage === 'flux'
              ? `from(bucket: "${ds.bucket || 'my-bucket'}")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")\n  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)`
              : `SELECT mean("value") FROM "cpu"\nWHERE time > now() - 1h\nGROUP BY time(1m) fill(none)`)
            : 'Connect a data source first (Plugins → InfluxDB)'}
          style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.65, boxSizing: 'border-box', minHeight: 140 }} />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13, marginBottom: 12, fontFamily: 'IBM Plex Mono, monospace' }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><IcoWarn /></span>
            <span style={{ wordBreak: 'break-word' }}>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {rows && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {/* Result meta bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, padding: '6px 2px' }}>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>● Query succeeded</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rowCount} rows</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{elapsed}ms</span>
            </div>

            {/* Chart */}
            {format === 'chart' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: '16px 16px 8px', marginBottom: 12, overflowX: 'auto' }}>
                <ResultChart rows={rows} />
              </div>
            )}

            {/* Table */}
            {format === 'table' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)' }}>
                        {cols.map(c => (
                          <th key={c} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 200).map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          {cols.map(c => {
                            const v = row[c];
                            const isTime = c === '_time' || c === 'time';
                            const isNum  = typeof v === 'number' || (!isTime && !isNaN(Number(v)) && String(v).trim() !== '');
                            return (
                              <td key={c} style={{ padding: '7px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontFamily: isNum || isTime ? 'IBM Plex Mono, monospace' : 'inherit' }}>
                                {isTime
                                  ? (() => { try { return new Date(String(v)).toLocaleString(); } catch { return String(v); } })()
                                  : isNum ? Number(v).toFixed(4).replace(/\.?0+$/, '')
                                  : String(v)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 200 && (
                    <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      Showing 200 of {rows.length} rows
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}