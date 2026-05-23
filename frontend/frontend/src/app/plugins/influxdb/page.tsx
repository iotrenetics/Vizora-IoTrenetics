// src/app/plugins/influxdb/page.tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Version = '1.x' | '2.x' | 'cloud';
type QueryLang = 'flux' | 'influxql';
type Step = 'url' | 'database' | 'save';

interface Config {
  url: string;
  version: Version;
  queryLanguage: QueryLang;
  // 2.x / cloud
  token: string;
  org: string;
  bucket: string;
  // 1.x
  database: string;
  username: string;
  password: string;
  // advanced
  tlsSkipVerify: boolean;
  timeout: string;
  maxSeries: string;
}

const DEFAULT: Config = {
  url: '', version: '2.x', queryLanguage: 'flux',
  token: '', org: '', bucket: '',
  database: '', username: '', password: '',
  tlsSkipVerify: false, timeout: '10', maxSeries: '1000',
};

type TestState = 'idle' | 'loading' | 'ok' | 'error';

const IcoInflux = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#22ADF6"/>
    <path d="M8 22l6-12 4 8 3-5 3 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevDown = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoLoader = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

const STEPS: { id: Step; label: string }[] = [
  { id: 'url',      label: 'URL and authentication' },
  { id: 'database', label: 'Database settings' },
  { id: 'save',     label: 'Save & test' },
];

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  fontFamily: 'Syne, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 };
const subStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, display: 'block' };
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, marginTop: 0 };

export default function InfluxDBConfigPage() {
  const [cfg, setCfg] = useState<Config>(DEFAULT);
  const [step, setStep] = useState<Step>('url');
  const [test, setTest] = useState<TestState>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof Config, v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));

  const runTest = async () => {
    setTest('loading'); setTestMsg('');
    try {
      const res = await fetch('/api/datasources/influxdb/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error');
      setTestMsg(data.message);
    } catch {
      setTest('error');
      setTestMsg('Network error — could not reach the server.');
    }
  };

  const handleSave = async () => {
    await runTest();
    setSaved(true);
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = 'var(--accent)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = 'var(--border)';
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <IcoInflux />
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>InfluxDB</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Connect local or cloud InfluxDB instances</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[
            { label: 'Type',     val: 'InfluxDB',  bg: '#e0e7ff', color: '#4338ca' },
            { label: 'Alerting', val: 'Supported', bg: '#dcfce7', color: '#16a34a' },
          ].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '4px 12px', borderRadius: 6, background: bg, border: `1px solid ${color}30` }}>
              <p style={{ margin: 0, fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body: sidebar + form */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Step sidebar */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connect data source</p>
          </div>
          {STEPS.map((s, i) => {
            const done = STEPS.findIndex(x => x.id === step) > i;
            const active = s.id === step;
            return (
              <button key={s.id} onClick={() => setStep(s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: active ? 'rgba(99,102,241,0.08)' : 'transparent', border: 'none', borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${active ? 'var(--accent)' : done ? '#10b981' : 'var(--border)'}`, background: done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {done && <span style={{ color: '#fff', display: 'flex' }}><IcoCheck /></span>}
                  {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}
            style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>

            {/* ── Step 1: URL & Auth ──────────────────────────────────── */}
            {step === 'url' && (
              <div style={{ padding: 24 }}>
                <p style={sectionTitle}>URL and authentication</p>
                <p style={{ ...subStyle, marginBottom: 20 }}>Enter the URL of your InfluxDB instance, then select your product and query language.</p>

                {/* URL */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>URL <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input value={cfg.url} onChange={e => set('url', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}
                    placeholder="http://localhost:8086" style={fieldStyle} />
                  <span style={{ ...subStyle, marginTop: 4 }}>For InfluxDB Cloud use your cloud URL e.g. https://us-east-1-1.aws.cloud2.influxdata.com</span>
                </div>

                {/* Version */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Product <span style={{ color: '#f43f5e' }}>*</span></label>
                  <span style={subStyle}>Select your InfluxDB version</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['1.x', '2.x', 'cloud'] as Version[]).map(v => (
                      <button key={v} onClick={() => { set('version', v); set('queryLanguage', v === '1.x' ? 'influxql' : 'flux'); }}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${cfg.version === v ? 'var(--accent)' : 'var(--border)'}`, background: cfg.version === v ? 'rgba(99,102,241,0.08)' : 'var(--surface)', color: cfg.version === v ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: cfg.version === v ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'Syne, sans-serif' }}>
                        {v === 'cloud' ? 'InfluxDB Cloud' : `InfluxDB ${v}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Query language */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Query language <span style={{ color: '#f43f5e' }}>*</span></label>
                  <span style={subStyle}>{cfg.version === '1.x' ? 'InfluxDB 1.x only supports InfluxQL' : 'Flux is recommended for InfluxDB 2.x and Cloud'}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['flux', 'influxql'] as QueryLang[]).map(l => {
                      const disabled = cfg.version === '1.x' && l === 'flux';
                      return (
                        <button key={l} onClick={() => !disabled && set('queryLanguage', l)} disabled={disabled}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${cfg.queryLanguage === l ? 'var(--accent)' : 'var(--border)'}`, background: cfg.queryLanguage === l ? 'rgba(99,102,241,0.08)' : 'var(--surface)', color: disabled ? 'var(--text-muted)' : cfg.queryLanguage === l ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13, fontWeight: cfg.queryLanguage === l ? 700 : 400, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.12s', fontFamily: 'Syne, sans-serif' }}>
                          {l === 'flux' ? 'Flux' : 'InfluxQL'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Token (2.x / cloud) */}
                {(cfg.version === '2.x' || cfg.version === 'cloud') && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Token <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={subStyle}>Your InfluxDB API token with read/write access to the target bucket</span>
                    <input type="password" value={cfg.token} onChange={e => set('token', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}
                      placeholder="your-influxdb-api-token" style={fieldStyle} />
                  </div>
                )}

                {/* Username / password (1.x) */}
                {cfg.version === '1.x' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    <div>
                      <label style={labelStyle}>Username</label>
                      <input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={inputFocus} onBlur={inputBlur} placeholder="admin" style={fieldStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Password</label>
                      <input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={inputFocus} onBlur={inputBlur} placeholder="••••••••" style={fieldStyle} />
                    </div>
                  </div>
                )}

                {/* Advanced HTTP */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setAdvOpen(v => !v)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Advanced HTTP Settings</span>
                    <span style={{ color: 'var(--text-muted)', transform: advOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}><IcoChevDown /></span>
                  </button>
                  <AnimatePresence>
                    {advOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={labelStyle}>Timeout (seconds)</label>
                            <input type="number" value={cfg.timeout} onChange={e => set('timeout', e.target.value)} onFocus={inputFocus} onBlur={inputBlur} style={fieldStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Max series</label>
                            <input type="number" value={cfg.maxSeries} onChange={e => set('maxSeries', e.target.value)} onFocus={inputFocus} onBlur={inputBlur} style={fieldStyle} />
                          </div>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" id="tls" checked={cfg.tlsSkipVerify} onChange={e => set('tlsSkipVerify', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                            <label htmlFor="tls" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>Skip TLS certificate verification</label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button onClick={() => setStep('database')}
                    style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Database settings ───────────────────────────── */}
            {step === 'database' && (
              <div style={{ padding: 24 }}>
                <p style={sectionTitle}>Database settings</p>
                <p style={{ ...subStyle, marginBottom: 20 }}>
                  {cfg.version === '1.x' ? 'Configure your InfluxDB 1.x database and retention policy.' : 'Configure your InfluxDB organization and bucket.'}
                </p>

                {(cfg.version === '2.x' || cfg.version === 'cloud') && (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <label style={labelStyle}>Organization <span style={{ color: '#f43f5e' }}>*</span></label>
                      <span style={subStyle}>The name of your InfluxDB organization</span>
                      <input value={cfg.org} onChange={e => set('org', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}
                        placeholder="my-org" style={fieldStyle} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <label style={labelStyle}>Default bucket <span style={{ color: '#f43f5e' }}>*</span></label>
                      <span style={subStyle}>The default bucket to query. You can override this per query.</span>
                      <input value={cfg.bucket} onChange={e => set('bucket', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}
                        placeholder="my-bucket" style={fieldStyle} />
                    </div>
                  </>
                )}

                {cfg.version === '1.x' && (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <label style={labelStyle}>Database <span style={{ color: '#f43f5e' }}>*</span></label>
                      <input value={cfg.database} onChange={e => set('database', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}
                        placeholder="mydb" style={fieldStyle} />
                    </div>
                  </>
                )}

                {/* Info box */}
                <div style={{ padding: 14, borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    <strong>Tip:</strong> {cfg.queryLanguage === 'flux'
                      ? 'With Flux you can query across multiple buckets and perform joins, aggregations, and transformations in a single query.'
                      : 'InfluxQL is SQL-like and familiar if you are coming from a relational database background. Use SELECT, WHERE, GROUP BY time() for time-series queries.'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                  <button onClick={() => setStep('url')}
                    style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep('save')}
                    style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Save & test ─────────────────────────────────── */}
            {step === 'save' && (
              <div style={{ padding: 24 }}>
                <p style={sectionTitle}>Save & test</p>
                <p style={{ ...subStyle, marginBottom: 20 }}>Review your configuration and test the connection before saving.</p>

                {/* Summary */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                  {[
                    { k: 'URL',           v: cfg.url || '—' },
                    { k: 'Product',       v: cfg.version === 'cloud' ? 'InfluxDB Cloud' : `InfluxDB ${cfg.version}` },
                    { k: 'Query language',v: cfg.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL' },
                    { k: cfg.version === '1.x' ? 'Database' : 'Org', v: cfg.version === '1.x' ? (cfg.database || '—') : (cfg.org || '—') },
                    ...(cfg.version !== '1.x' ? [{ k: 'Bucket', v: cfg.bucket || '—' }] : []),
                    { k: 'Auth',          v: cfg.version === '1.x' ? (cfg.username ? `Basic (${cfg.username})` : 'None') : (cfg.token ? 'Token ••••••••' : 'No token') },
                  ].map(({ k, v }, i, arr) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: k === 'URL' ? 'IBM Plex Mono, monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Test result banner */}
                <AnimatePresence>
                  {test !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}>
                      <span style={{ color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-muted)', display: 'flex' }}>
                        {test === 'loading' ? <IcoLoader /> : test === 'ok' ? <IcoCheck /> : <IcoX />}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-primary)' }}>
                        {test === 'loading' ? 'Testing connection…' : testMsg}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                  <button onClick={() => setStep('database')}
                    style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
                    ← Back
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={runTest} disabled={test === 'loading'}
                      style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: test === 'loading' ? 0.6 : 1 }}>
                      Test connection
                    </button>
                    <button onClick={handleSave} disabled={test === 'loading'}
                      style={{ padding: '9px 24px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif', opacity: test === 'loading' ? 0.6 : 1 }}>
                      {saved ? '✓ Saved' : 'Save & test'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}