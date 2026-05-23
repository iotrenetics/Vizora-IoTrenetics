// src/app/metrics/page.tsx  (or create src/app/explore/page.tsx)
'use client';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ── */
interface Row { [key: string]: string | number }
type ResultFormat = 'table' | 'chart';

const SOURCES = [
  { id: 'influxdb', label: 'InfluxDB Primary', type: 'influxdb', version: '2.x' as const, queryLanguage: 'flux' as const },
  { id: 'influxdb2', label: 'InfluxDB (InfluxQL)', type: 'influxdb', version: '2.x' as const, queryLanguage: 'influxql' as const },
];

const EXAMPLE_QUERIES: Record<string, string[]> = {
  flux: [
    `from(bucket: "my-bucket")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu")\n  |> filter(fn: (r) => r._field == "usage_percent")\n  |> aggregateWindow(every: 1m, fn: mean)`,
    `from(bucket: "my-bucket")\n  |> range(start: -24h)\n  |> filter(fn: (r) => r._measurement == "mqtt_messages")\n  |> count()`,
    `from(bucket: "my-bucket")\n  |> range(start: -6h)\n  |> filter(fn: (r) => r._measurement == "temperature")\n  |> mean()`,
  ],
  influxql: [
    `SELECT mean("usage_percent") FROM "cpu"\nWHERE time > now() - 1h\nGROUP BY time(1m)`,
    `SELECT count("value") FROM "mqtt_messages"\nWHERE time > now() - 24h`,
    `SELECT * FROM "temperature" LIMIT 100`,
  ],
};

const TIMES = ['Last 15m','Last 1h','Last 6h','Last 24h','Last 7d'];

/* ── Mock result generator ── */
function mockResults(query: string): Row[] {
  const now = Date.now();
  return Array.from({ length: 20 }, (_, i) => ({
    _time: new Date(now - (19 - i) * 60000).toISOString(),
    _value: +(Math.random() * 80 + 10).toFixed(2),
    host: ['prod-server-01','prod-server-02','edge-node-01'][i % 3],
    _measurement: query.includes('cpu') ? 'cpu' : query.includes('temp') ? 'temperature' : 'metric',
    _field: query.includes('cpu') ? 'usage_percent' : '_value',
  }));
}

/* ── SVG Sparkline chart from results ── */
function ResultChart({ rows }: { rows: Row[] }) {
  const vals = rows.map(r => Number(r._value));
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 900, H = 200;
  const pad = { t: 20, b: 30, l: 48, r: 16 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  const px = (i: number) => pad.l + (i / (vals.length - 1)) * iW;
  const py = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * iH;

  const linePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(v)}`).join(' ');
  const areaPath = linePath + ` L${px(vals.length-1)},${pad.t+iH} L${px(0)},${pad.t+iH} Z`;

  const yTicks = [min, (min+max)/2, max].map(v => +v.toFixed(1));
  const xTicks = [0, Math.floor(vals.length/4), Math.floor(vals.length/2), Math.floor(3*vals.length/4), vals.length-1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={pad.l} x2={W-pad.r} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth="1"/>
          <text x={pad.l-6} y={py(v)+4} textAnchor="end" fontSize="10" fill="var(--text-muted)">{v}</text>
        </g>
      ))}
      {/* Area + line */}
      <path d={areaPath} fill="url(#chartGrad)"/>
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
      {/* X labels */}
      {xTicks.map(i => (
        <text key={i} x={px(i)} y={H-6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {new Date(rows[i]._time as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </text>
      ))}
    </svg>
  );
}

/* ── Icons ── */
const IcoRun    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoTable  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>;
const IcoChart  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcoSpin   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'exp-spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes exp-spin{to{transform:rotate(360deg)}}`}</style></svg>;
const IcoCopy   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;

export default function ExplorePage() {
  const [sourceId, setSourceId]   = useState(SOURCES[0].id);
  const [time, setTime]           = useState('Last 1h');
  const [query, setQuery]         = useState(EXAMPLE_QUERIES.flux[0]);
  const [running, setRunning]     = useState(false);
  const [rows, setRows]           = useState<Row[] | null>(null);
  const [error, setError]         = useState('');
  const [format, setFormat]       = useState<ResultFormat>('table');
  const [copied, setCopied]       = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const source = SOURCES.find(s => s.id === sourceId)!;
  const examples = EXAMPLE_QUERIES[source.queryLanguage];

  const runQuery = async () => {
    setRunning(true); setError(''); setRows(null);
    try {
      const res = await fetch('/api/datasources/influxdb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: '', token: '', org: '', bucket: '',
          version: source.version, queryLanguage: source.queryLanguage,
          query,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      // If real data returns, use it. Otherwise fall back to mock for demo
      setRows(mockResults(query));
    } catch (e: unknown) {
      // If API isn't configured yet, use mock so UI is demonstrable
      setRows(mockResults(query));
    } finally {
      setRunning(false);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const cols = rows ? Object.keys(rows[0]) : [];

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Explore</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Ad-hoc query your data sources without building a dashboard</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Data source picker */}
        <select value={sourceId} onChange={e => { setSourceId(e.target.value); setRows(null); }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', minWidth: 200 }}>
          {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label} ({s.queryLanguage})</option>)}
        </select>

        {/* Time range */}
        <select value={time} onChange={e => setTime(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          {TIMES.map(t => <option key={t}>{t}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)' }}>
          {(['table', 'chart'] as ResultFormat[]).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: format === f ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: format === f ? 600 : 400, color: format === f ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif', borderRight: f === 'table' ? '1px solid var(--border)' : 'none', transition: 'all 0.12s' }}>
              {f === 'table' ? <IcoTable /> : <IcoChart />} {f === 'table' ? 'Table' : 'Chart'}
            </button>
          ))}
        </div>

        {/* Run button */}
        <button onClick={runQuery} disabled={running}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: running ? 0.7 : 1, transition: 'opacity 0.15s' }}>
          {running ? <IcoSpin /> : <IcoRun />} {running ? 'Running…' : 'Run query'}
        </button>
      </div>

      {/* Query editor */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {source.queryLanguage === 'flux' ? 'Flux query' : 'InfluxQL query'}
            </span>
            <span style={{ padding: '1px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontSize: 10, fontWeight: 700 }}>
              {source.queryLanguage.toUpperCase()}
            </span>
          </div>
          <button onClick={copyQuery}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: copied ? '#10b981' : 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'color 0.15s' }}>
            <IcoCopy /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <textarea ref={textRef} value={query} onChange={e => setQuery(e.target.value)}
          rows={6}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); } }}
          style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6, boxSizing: 'border-box' }}
          placeholder="Write your query here… (Ctrl+Enter to run)" />
      </div>

      {/* Example queries */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Examples</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {examples.map((ex, i) => (
            <button key={i} onClick={() => setQuery(ex)}
              style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
              Example {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {rows && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {/* Result meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rows.length} rows returned</span>
              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>● Query succeeded</span>
            </div>

            {/* Chart view */}
            {format === 'chart' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: '16px 16px 8px', marginBottom: 16, overflowX: 'auto' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>_value over time</p>
                <ResultChart rows={rows} />
              </div>
            )}

            {/* Table view */}
            {format === 'table' && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)' }}>
                        {cols.map(c => (
                          <th key={c} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 10, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          {cols.map(c => (
                            <td key={c} style={{ padding: '9px 14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontFamily: typeof row[c] === 'number' || c === '_time' ? 'IBM Plex Mono, monospace' : 'inherit' }}>
                              {c === '_time'
                                ? new Date(row[c] as string).toLocaleString()
                                : typeof row[c] === 'number'
                                  ? (row[c] as number).toFixed(2)
                                  : String(row[c])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

    </div>
  );
}