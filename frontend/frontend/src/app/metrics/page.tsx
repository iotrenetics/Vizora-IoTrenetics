'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const METRICS = [
  { name: 'cpu_usage_percent',    type: 'gauge',   source: 'Prometheus', lastValue: '42.9',  unit: '%'  },
  { name: 'memory_used_bytes',    type: 'gauge',   source: 'InfluxDB',   lastValue: '8.0',   unit: 'GB' },
  { name: 'mqtt_messages_total',  type: 'counter', source: 'MQTT',       lastValue: '14,291',unit: 'msg'},
  { name: 'network_rx_bytes',     type: 'counter', source: 'Prometheus', lastValue: '89',    unit: 'MB/s'},
  { name: 'device_temperature',   type: 'gauge',   source: 'MQTT',       lastValue: '42',    unit: '°C' },
  { name: 'api_request_duration', type: 'histogram',source:'Prometheus', lastValue: '340',   unit: 'ms' },
];

const IcoSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoRun = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;

const TIMES = ['Last 15m','Last 1h','Last 6h','Last 24h','Last 7d'];

// Fake sparkline points
function Sparkline({ color }: { color: string }) {
  const pts = Array.from({length: 20}, (_, i) => ({ x: i, y: 20 + Math.random() * 60 }));
  const w = 200, h = 60;
  const xs = pts.map(p => (p.x / 19) * w);
  const ys = pts.map(p => h - (p.y / 80) * h);
  const d = pts.map((_, i) => `${i === 0 ? 'M' : 'L'}${xs[i]},${ys[i]}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={d + ` L${w},${h} L0,${h} Z`} fill={`url(#g-${color})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export default function MetricsPage() {
  const [query, setQuery] = useState('');
  const [time, setTime] = useState('Last 1h');
  const [ran, setRan] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Metrics Explorer</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Ad-hoc query across all connected data sources</p>
      </div>

      {/* Query bar */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><IcoSearch /></span>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder='e.g. cpu_usage_percent{host="prod-server-01"}'
              style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'IBM Plex Mono, monospace', boxSizing: 'border-box' }} />
          </div>
          <select value={time} onChange={e => setTime(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => setRan(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
            <IcoRun /> Run
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['cpu_usage_percent','memory_used_bytes','mqtt_messages_total','device_temperature'].map(s => (
            <button key={s} onClick={() => setQuery(s)}
              style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results / metric list */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Metric browser */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available metrics</p>
          </div>
          {METRICS.map((m, i) => (
            <motion.div key={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => setQuery(m.name)}
              style={{ padding: '10px 14px', borderBottom: i < METRICS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontWeight: 600 }}>{m.type}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.source}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart panel */}
        <div>
          {METRICS.slice(0, 3).map((m, i) => {
            const colors = ['#6366f1','#10b981','#f59e0b'];
            const c = colors[i % colors.length];
            return (
              <motion.div key={m.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>{m.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{m.source} · {time}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: c, fontFamily: 'IBM Plex Mono, monospace' }}>{m.lastValue}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{m.unit}</span></p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>current</p>
                  </div>
                </div>
                <div style={{ padding: '12px 16px 8px', overflowX: 'auto' }}>
                  <Sparkline color={c} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    {['min','avg','max','p95'].map(stat => (
                      <div key={stat} style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                          {(Math.random() * 80 + 10).toFixed(1)}{m.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}