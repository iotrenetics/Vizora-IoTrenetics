// src/app/plugins/influxdb/page.tsx
'use client';
import { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type Version    = '1.x' | '2.x' | 'cloud';
type QueryLang  = 'flux' | 'influxql';
type StepId     = 0 | 1 | 2;
type TestState  = 'idle' | 'loading' | 'ok' | 'error';

interface Config {
  name: string;
  url: string;
  version: Version;
  queryLanguage: QueryLang;
  token: string;
  org: string;
  bucket: string;
  database: string;
  username: string;
  password: string;
  tlsSkipVerify: boolean;
  timeout: string;
  maxSeries: string;
}

const DEFAULT: Config = {
  name: 'InfluxDB',
  url: '', version: '2.x', queryLanguage: 'flux',
  token: '', org: '', bucket: '',
  database: '', username: '', password: '',
  tlsSkipVerify: false, timeout: '10', maxSeries: '1000',
};

const STEPS = ['URL and authentication', 'Database settings', 'Save & test'];

/* ── Shared styles ── */
const F: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  fontFamily: 'Syne, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const S: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--border)');

/* ── Icons ── */
const IcoCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevD = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoSpin  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'influx-spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes influx-spin{to{transform:rotate(360deg)}}`}</style></svg>;

export default function InfluxDBPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const editId       = searchParams.get('id'); // ?id=xxx to edit existing

  const { saveInfluxDB, updateInfluxDB, influxDBConfigs, setActiveInfluxDB } = useDataSourcesStore();

  // Pre-fill form if editing existing connection
  const [cfg, setCfg]     = useState<Config>(() => {
    if (editId) {
      const existing = influxDBConfigs.find(c => c.id === editId);
      if (existing) return { ...DEFAULT, ...existing };
    }
    return DEFAULT;
  });
  const [step, setStep]   = useState<StepId>(0);
  const [dir,  setDir]    = useState<1|-1>(1);
  const [test, setTest]   = useState<TestState>('idle');
  const [msg,  setMsg]    = useState('');
  const [adv,  setAdv]    = useState(false);
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [,startT]         = useTransition();

  const set = (k: keyof Config, v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  const go = (next: StepId) => {
    setDir(next > step ? 1 : -1);
    startT(() => setStep(next));
  };

  const runTest = async (): Promise<boolean> => {
    setTest('loading'); setMsg('');
    try {
      const res  = await fetch('/api/datasources/influxdb/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error');
      setMsg(data.message);
      return data.ok;
    } catch {
      setTest('error');
      setMsg('Network error — could not reach the server.');
      return false;
    }
  };

  const handleSave = async () => {
    const ok = await runTest();
    const status = ok ? 'connected' : 'error';

    if (editId && savedId) {
      updateInfluxDB(savedId, { ...cfg, status });
    } else {
      const newId = saveInfluxDB({ ...cfg, status });
      setSavedId(newId);
      setActiveInfluxDB(newId);
    }
  };

  const handleExplore = () => router.push('/metrics');
  const handleDashboard = () => router.push('/dashboards/new');

  /* ── Reusable version/lang toggle buttons ── */
  const VersionBtn = ({ v, label }: { v: Version; label: string }) => (
    <button onClick={() => { set('version', v); if (v === '1.x') set('queryLanguage', 'influxql'); }}
      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${cfg.version === v ? 'var(--accent)' : 'var(--border)'}`, background: cfg.version === v ? 'rgba(99,102,241,0.1)' : 'var(--surface-2)', color: cfg.version === v ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: cfg.version === v ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'Syne, sans-serif' }}>
      {label}
    </button>
  );

  const LangBtn = ({ l, label }: { l: QueryLang; label: string }) => {
    const disabled = cfg.version === '1.x' && l === 'flux';
    return (
      <button onClick={() => !disabled && set('queryLanguage', l)} disabled={disabled}
        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${cfg.queryLanguage === l ? 'var(--accent)' : 'var(--border)'}`, background: cfg.queryLanguage === l ? 'rgba(99,102,241,0.1)' : 'var(--surface-2)', color: disabled ? 'var(--text-muted)' : cfg.queryLanguage === l ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13, fontWeight: cfg.queryLanguage === l ? 700 : 400, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.12s', fontFamily: 'Syne, sans-serif' }}>
        {label}
      </button>
    );
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#22ADF618', border: '1px solid #22ADF630', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📊</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>InfluxDB</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Connect local or cloud InfluxDB — supports Flux and InfluxQL</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ label: 'Type', val: 'InfluxDB', bg: '#e0e7ff', color: '#4338ca' }, { label: 'Alerting', val: 'Supported', bg: '#dcfce7', color: '#16a34a' }].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '5px 12px', borderRadius: 7, background: bg, border: `1px solid ${color}30` }}>
              <p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 20, alignItems: 'start' }}>

        {/* Step sidebar */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connect data source</p>
          </div>
          {STEPS.map((label, i) => {
            const done   = step > i || (i === 2 && test === 'ok');
            const active = step === i;
            return (
              <button key={label} onClick={() => go(i as StepId)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: active ? 'rgba(99,102,241,0.08)' : 'transparent', border: 'none', borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? 'var(--accent)' : done ? '#10b981' : 'var(--border)'}`, background: done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {done   && <span style={{ color: '#fff', display: 'flex' }}><IcoCheck /></span>}
                  {active && !done && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
              </button>
            );
          })}

          {/* Saved connections list */}
          {influxDBConfigs.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved connections</p>
              {influxDBConfigs.map(c => (
                <button key={c.id}
                  onClick={() => router.push(`/plugins/influxdb?id=${c.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: c.id === savedId ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 'connected' ? '#10b981' : '#f43f5e', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form panel */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.18 }}
              style={{ padding: 24 }}
            >

              {/* ── Step 0: URL & Auth ── */}
              {step === 0 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>URL and authentication</p>
                <p style={{ ...S, marginBottom: 20 }}>Enter connection details for your InfluxDB instance.</p>

                {/* Connection name */}
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>Connection name <span style={{ color: '#f43f5e' }}>*</span></label>
                  <span style={S}>A friendly name to identify this data source</span>
                  <input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB}
                    placeholder="e.g. Production InfluxDB" style={F} />
                </div>

                {/* URL */}
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>URL <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input value={cfg.url} onChange={e => set('url', e.target.value)} onFocus={onF} onBlur={onB}
                    placeholder="http://localhost:8086" style={F} />
                  <span style={{ ...S, marginTop: 4 }}>InfluxDB Cloud: https://us-east-1-1.aws.cloud2.influxdata.com</span>
                </div>

                {/* Version */}
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>Product <span style={{ color: '#f43f5e' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <VersionBtn v="1.x"   label="InfluxDB 1.x" />
                    <VersionBtn v="2.x"   label="InfluxDB 2.x" />
                    <VersionBtn v="cloud" label="Cloud" />
                  </div>
                </div>

                {/* Query language */}
                <div style={{ marginBottom: 18 }}>
                  <label style={L}>Query language <span style={{ color: '#f43f5e' }}>*</span></label>
                  <span style={S}>
                    {cfg.version === '1.x'
                      ? 'InfluxDB 1.x only supports InfluxQL'
                      : 'Flux is recommended for InfluxDB 2.x and Cloud. InfluxQL is also supported via the compatibility API.'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <LangBtn l="flux"     label="Flux" />
                    <LangBtn l="influxql" label="InfluxQL" />
                  </div>
                </div>

                {/* Token (2.x / cloud) */}
                {(cfg.version === '2.x' || cfg.version === 'cloud') && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={L}>Token <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>API token with read/write access. Generate one in InfluxDB UI → Data → API Tokens.</span>
                    <input type="password" value={cfg.token} onChange={e => set('token', e.target.value)} onFocus={onF} onBlur={onB}
                      placeholder="your-influxdb-api-token" style={F} />
                  </div>
                )}

                {/* Basic auth (1.x) */}
                {cfg.version === '1.x' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    <div>
                      <label style={L}>Username</label>
                      <input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onF} onBlur={onB} placeholder="admin" style={F} />
                    </div>
                    <div>
                      <label style={L}>Password</label>
                      <input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onF} onBlur={onB} placeholder="••••••••" style={F} />
                    </div>
                  </div>
                )}

                {/* Advanced */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  <button onClick={() => setAdv(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Advanced HTTP Settings</span>
                    <span style={{ color: 'var(--text-muted)', transform: adv ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}><IcoChevD /></span>
                  </button>
                  <AnimatePresence>
                    {adv && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div><label style={L}>Timeout (s)</label><input type="number" value={cfg.timeout} onChange={e => set('timeout', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
                          <div><label style={L}>Max series</label><input type="number" value={cfg.maxSeries} onChange={e => set('maxSeries', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
                          <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={cfg.tlsSkipVerify} onChange={e => set('tlsSkipVerify', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Skip TLS certificate verification</span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => go(1)} disabled={!cfg.url || !cfg.name}
                    style={{ padding: '9px 24px', borderRadius: 8, background: (!cfg.url || !cfg.name) ? 'var(--surface-2)' : 'var(--accent)', border: 'none', color: (!cfg.url || !cfg.name) ? 'var(--text-muted)' : '#fff', fontSize: 13, fontWeight: 600, cursor: (!cfg.url || !cfg.name) ? 'not-allowed' : 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.15s' }}>
                    Next →
                  </button>
                </div>
              </>)}

              {/* ── Step 1: Database settings ── */}
              {step === 1 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Database settings</p>
                <p style={{ ...S, marginBottom: 20 }}>{cfg.version === '1.x' ? 'Configure your InfluxDB 1.x database.' : 'Configure your InfluxDB organization and bucket.'}</p>

                {(cfg.version === '2.x' || cfg.version === 'cloud') && (<>
                  <div style={{ marginBottom: 18 }}>
                    <label style={L}>Organization <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>The name of your InfluxDB organization (find it in InfluxDB UI → Settings)</span>
                    <input value={cfg.org} onChange={e => set('org', e.target.value)} onFocus={onF} onBlur={onB} placeholder="my-org" style={F} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={L}>Default bucket <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>The default bucket to query. You can override this per query using Flux's <code style={{ background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>bucket:</code> parameter.</span>
                    <input value={cfg.bucket} onChange={e => set('bucket', e.target.value)} onFocus={onF} onBlur={onB} placeholder="my-bucket" style={F} />
                  </div>
                </>)}

                {cfg.version === '1.x' && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={L}>Database <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input value={cfg.database} onChange={e => set('database', e.target.value)} onFocus={onF} onBlur={onB} placeholder="mydb" style={F} />
                  </div>
                )}

                {/* Info box */}
                <div style={{ padding: 14, borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                    <strong>Query language:</strong> You selected <strong>{cfg.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL'}</strong>.
                    {cfg.queryLanguage === 'flux'
                      ? ' Flux lets you query across buckets, join streams, and run aggregations in one expression.'
                      : ' InfluxQL is SQL-like — use SELECT, WHERE, and GROUP BY time() for time-series data.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => go(0)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>← Back</button>
                  <button onClick={() => go(2)} style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Next →</button>
                </div>
              </>)}

              {/* ── Step 2: Save & test ── */}
              {step === 2 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Save & test</p>
                <p style={{ ...S, marginBottom: 20 }}>Review your configuration and test the connection.</p>

                {/* Summary */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  {[
                    { k: 'Name',          v: cfg.name || '—' },
                    { k: 'URL',           v: cfg.url  || '—' },
                    { k: 'Product',       v: cfg.version === 'cloud' ? 'InfluxDB Cloud' : `InfluxDB ${cfg.version}` },
                    { k: 'Query language',v: cfg.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL' },
                    { k: cfg.version === '1.x' ? 'Database' : 'Org',    v: cfg.version === '1.x' ? (cfg.database || '—') : (cfg.org    || '—') },
                    ...(cfg.version !== '1.x' ? [{ k: 'Bucket', v: cfg.bucket || '—' }] : []),
                    { k: 'Auth',          v: cfg.version === '1.x' ? (cfg.username ? `Basic (${cfg.username})` : 'None') : (cfg.token ? 'Token ••••••••' : 'No token') },
                  ].map(({ k, v }, i, arr) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: k === 'URL' ? 'IBM Plex Mono, monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Test result */}
                <AnimatePresence>
                  {test !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}>
                      <span style={{ color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-muted)', display: 'flex', marginTop: 1 }}>
                        {test === 'loading' ? <IcoSpin /> : test === 'ok' ? <IcoCheck /> : <IcoX />}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-primary)', flex: 1 }}>
                        {test === 'loading' ? 'Testing connection…' : msg}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Post-save actions */}
                {test === 'ok' && savedId && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button onClick={handleExplore}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                      🔍 Explore data
                    </button>
                    <button onClick={handleDashboard}
                      style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'rgba(99,102,241,0.08)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                      📊 Build dashboard
                    </button>
                  </motion.div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button onClick={() => go(1)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>← Back</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={runTest} disabled={test === 'loading'}
                      style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: test === 'loading' ? 0.6 : 1 }}>
                      Test connection
                    </button>
                    <button onClick={handleSave} disabled={test === 'loading'}
                      style={{ padding: '9px 24px', borderRadius: 8, background: test === 'ok' ? '#16a34a' : 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: test === 'loading' ? 0.6 : 1, transition: 'background 0.2s' }}>
                      {test === 'ok' && savedId ? '✓ Saved' : 'Save & test'}
                    </button>
                  </div>
                </div>
              </>)}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}