// src/app/plugins/influxdb/page.tsx
'use client';
import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSourcesStore } from '@/store/datasources';

type Version = '1.x' | '2.x' | 'cloud';
type QueryLang = 'flux' | 'influxql';
type StepId = 0 | 1 | 2;

interface Config {
  url: string; version: Version; queryLanguage: QueryLang;
  token: string; org: string; bucket: string;
  database: string; username: string; password: string;
  tlsSkipVerify: boolean; timeout: string; maxSeries: string;
}

const DEFAULT: Config = {
  url: '', version: '2.x', queryLanguage: 'flux',
  token: '', org: '', bucket: '',
  database: '', username: '', password: '',
  tlsSkipVerify: false, timeout: '10', maxSeries: '1000',
};

type TestState = 'idle' | 'loading' | 'ok' | 'error';
const STEPS = ['URL and authentication', 'Database settings', 'Save & test'];

const IcoCheck = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevD = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoSpin  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>;

const F: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gf-border)', background: 'var(--gf-input)', color: 'var(--gf-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gf-text)', marginBottom: 4 };
const S: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--gf-text-muted)', marginBottom: 6, lineHeight: 1.5 };
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--gf-accent)');
const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--gf-border)');

export default function InfluxDBPage() {
  const { saveInfluxDB } = useDataSourcesStore();
  const [cfg, setCfg]   = useState<Config>(DEFAULT);
  const [step, setStep] = useState<StepId>(0);
  const [dir,  setDir]  = useState<1 | -1>(1);
  const [test, setTest] = useState<TestState>('idle');
  const [msg,  setMsg]  = useState('');
  const [adv,  setAdv]  = useState(false);
  const [saved, setSaved] = useState(false);
  const [, startT] = useTransition();

  const set = (k: keyof Config, v: string | boolean) => setCfg(p => ({ ...p, [k]: v }));
  const go  = (next: StepId) => { setDir(next > step ? 1 : -1); startT(() => setStep(next)); };

  const runTest = async () => {
    setTest('loading'); setMsg('');
    try {
      const res  = await fetch('/api/datasources/influxdb/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error');
      setMsg(data.message);
      return data.ok as boolean;
    } catch {
      setTest('error'); setMsg('Network error — could not reach the server.');
      return false;
    }
  };

  const handleSave = async () => {
    const ok = await runTest();
    saveInfluxDB({
      name: `InfluxDB (${cfg.url || 'local'})`,
      ...cfg,
      status: ok ? 'connected' : 'error',
    });
    setSaved(true);
  };

  const VersionBtn = ({ v, label }: { v: Version; label: string }) => (
    <button onClick={() => { set('version', v); set('queryLanguage', v === '1.x' ? 'influxql' : 'flux'); }}
      style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: `1px solid ${cfg.version === v ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: cfg.version === v ? 'rgba(61,113,232,0.1)' : 'var(--gf-input)', color: cfg.version === v ? 'var(--gf-accent)' : 'var(--gf-text-secondary)', fontSize: 13, fontWeight: cfg.version === v ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
      {label}
    </button>
  );

  const LangBtn = ({ l, label }: { l: QueryLang; label: string }) => {
    const disabled = cfg.version === '1.x' && l === 'flux';
    return (
      <button onClick={() => !disabled && set('queryLanguage', l)} disabled={disabled}
        style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: `1px solid ${cfg.queryLanguage === l ? 'var(--gf-accent)' : 'var(--gf-border)'}`, background: cfg.queryLanguage === l ? 'rgba(61,113,232,0.1)' : 'var(--gf-input)', color: disabled ? 'var(--gf-text-muted)' : cfg.queryLanguage === l ? 'var(--gf-accent)' : 'var(--gf-text)', fontSize: 13, fontWeight: cfg.queryLanguage === l ? 700 : 400, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, transition: 'all 0.12s', fontFamily: 'inherit' }}>
        {label}
      </button>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#22ADF618', border: '1px solid #22ADF630', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📊</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--gf-text)', letterSpacing: '-0.02em' }}>InfluxDB</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gf-text-muted)' }}>Connect local or cloud InfluxDB instances</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ label: 'TYPE', val: 'InfluxDB', color: '#3d71e8' }, { label: 'ALERTING', val: 'Supported', color: '#10b981' }].map(({ label, val, color }) => (
            <div key={label} style={{ padding: '4px 10px', borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30` }}>
              <p style={{ margin: 0, fontSize: 9, color, fontWeight: 700, letterSpacing: '0.08em' }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Step sidebar */}
        <div style={{ border: '1px solid var(--gf-border)', borderRadius: 8, background: 'var(--gf-surface)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--gf-border)', background: 'var(--gf-hover)' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--gf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connect data source</p>
          </div>
          {STEPS.map((label, i) => {
            const done = step > i, active = step === i;
            return (
              <button key={label} onClick={() => go(i as StepId)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: active ? 'rgba(61,113,232,0.08)' : 'transparent', border: 'none', borderBottom: i < STEPS.length - 1 ? '1px solid var(--gf-border)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'var(--gf-accent)' : done ? '#10b981' : 'var(--gf-border)'}`, background: done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {done && <span style={{ color: '#fff', display: 'flex' }}><IcoCheck /></span>}
                  {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gf-accent)' }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--gf-text)' : done ? 'var(--gf-text)' : 'var(--gf-text-secondary)' }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div style={{ border: '1px solid var(--gf-border)', borderRadius: 8, background: 'var(--gf-surface)', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir}
              initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.18 }} style={{ padding: 24 }}>

              {step === 0 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--gf-text)' }}>URL and authentication</p>
                <p style={{ ...S, marginBottom: 20 }}>Enter the URL of your InfluxDB instance, then select version and query language.</p>
                <div style={{ marginBottom: 16 }}>
                  <label style={L}>URL <span style={{ color: '#f43f5e' }}>*</span></label>
                  <input value={cfg.url} onChange={e => set('url', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="http://localhost:8086" style={F} />
                  <span style={{ ...S, marginTop: 4 }}>InfluxDB Cloud: https://us-east-1-1.aws.cloud2.influxdata.com</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={L}>Product <span style={{ color: '#f43f5e' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <VersionBtn v="1.x" label="InfluxDB 1.x" /><VersionBtn v="2.x" label="InfluxDB 2.x" /><VersionBtn v="cloud" label="Cloud" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={L}>Query language <span style={{ color: '#f43f5e' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <LangBtn l="flux" label="Flux" /><LangBtn l="influxql" label="InfluxQL" />
                  </div>
                </div>
                {(cfg.version === '2.x' || cfg.version === 'cloud') && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={L}>Token <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>API token with read access to your bucket</span>
                    <input type="password" value={cfg.token} onChange={e => set('token', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="your-influxdb-api-token" style={F} />
                  </div>
                )}
                {cfg.version === '1.x' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div><label style={L}>Username</label><input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="admin" style={F} /></div>
                    <div><label style={L}>Password</label><input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="••••••••" style={F} /></div>
                  </div>
                )}
                <div style={{ border: '1px solid var(--gf-border)', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
                  <button onClick={() => setAdv(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--gf-hover)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gf-text)' }}>Advanced HTTP Settings</span>
                    <span style={{ color: 'var(--gf-text-muted)', transform: adv ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}><IcoChevD /></span>
                  </button>
                  <AnimatePresence>
                    {adv && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div><label style={L}>Timeout (s)</label><input type="number" value={cfg.timeout} onChange={e => set('timeout', e.target.value)} onFocus={onFocus} onBlur={onBlur} style={F} /></div>
                          <div><label style={L}>Max series</label><input type="number" value={cfg.maxSeries} onChange={e => set('maxSeries', e.target.value)} onFocus={onFocus} onBlur={onBlur} style={F} /></div>
                          <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input type="checkbox" checked={cfg.tlsSkipVerify} onChange={e => set('tlsSkipVerify', e.target.checked)} style={{ width: 14, height: 14, accentColor: 'var(--gf-accent)', cursor: 'pointer' }} />
                            <span style={{ fontSize: 13, color: 'var(--gf-text)' }}>Skip TLS certificate verification</span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => go(1)} style={{ padding: '8px 20px', borderRadius: 6, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
                </div>
              </>)}

              {step === 1 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--gf-text)' }}>Database settings</p>
                <p style={{ ...S, marginBottom: 20 }}>{cfg.version === '1.x' ? 'Configure your InfluxDB 1.x database.' : 'Configure your InfluxDB organization and bucket.'}</p>
                {(cfg.version === '2.x' || cfg.version === 'cloud') && (<>
                  <div style={{ marginBottom: 16 }}>
                    <label style={L}>Organization <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>The name of your InfluxDB organization</span>
                    <input value={cfg.org} onChange={e => set('org', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="my-org" style={F} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={L}>Default bucket <span style={{ color: '#f43f5e' }}>*</span></label>
                    <span style={S}>Default bucket to query — can be overridden per panel</span>
                    <input value={cfg.bucket} onChange={e => set('bucket', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="my-bucket" style={F} />
                  </div>
                </>)}
                {cfg.version === '1.x' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={L}>Database <span style={{ color: '#f43f5e' }}>*</span></label>
                    <input value={cfg.database} onChange={e => set('database', e.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="mydb" style={F} />
                  </div>
                )}
                <div style={{ padding: 12, borderRadius: 6, background: 'rgba(61,113,232,0.06)', border: '1px solid rgba(61,113,232,0.2)', marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gf-text)', lineHeight: 1.6 }}>
                    <strong>Tip:</strong> {cfg.queryLanguage === 'flux' ? 'Flux lets you query across buckets, join streams, and run aggregations in one expression.' : 'InfluxQL is SQL-like — use SELECT, WHERE, and GROUP BY time() for time-series data.'}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={() => go(0)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <button onClick={() => go(2)} style={{ padding: '8px 20px', borderRadius: 6, background: 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
                </div>
              </>)}

              {step === 2 && (<>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--gf-text)' }}>Save & test</p>
                <p style={{ ...S, marginBottom: 20 }}>Review your configuration and test the connection before saving.</p>
                <div style={{ border: '1px solid var(--gf-border)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
                  {[
                    { k: 'URL', v: cfg.url || '—' },
                    { k: 'Product', v: cfg.version === 'cloud' ? 'InfluxDB Cloud' : `InfluxDB ${cfg.version}` },
                    { k: 'Query language', v: cfg.queryLanguage === 'flux' ? 'Flux' : 'InfluxQL' },
                    { k: cfg.version === '1.x' ? 'Database' : 'Org', v: cfg.version === '1.x' ? (cfg.database || '—') : (cfg.org || '—') },
                    ...(cfg.version !== '1.x' ? [{ k: 'Bucket', v: cfg.bucket || '—' }] : []),
                    { k: 'Auth', v: cfg.version === '1.x' ? (cfg.username ? `Basic (${cfg.username})` : 'None') : (cfg.token ? 'Token ••••••••' : 'No token') },
                  ].map(({ k, v }, i, arr) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', padding: '9px 12px', borderBottom: i < arr.length - 1 ? '1px solid var(--gf-border)' : 'none', background: i % 2 === 0 ? 'var(--gf-surface)' : 'var(--gf-hover)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gf-text-muted)' }}>{k}</span>
                      <span style={{ fontSize: 12, color: 'var(--gf-text)', fontFamily: k === 'URL' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <AnimatePresence>
                  {test !== 'idle' && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6, marginBottom: 14, background: test === 'ok' ? '#dcfce720' : test === 'error' ? '#fee2e220' : 'var(--gf-hover)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--gf-border)'}` }}>
                      <span style={{ color: test === 'ok' ? '#4ade80' : test === 'error' ? '#f87171' : 'var(--gf-text-muted)', display: 'flex' }}>
                        {test === 'loading' ? <IcoSpin /> : test === 'ok' ? <IcoCheck /> : <IcoX />}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: test === 'ok' ? '#4ade80' : test === 'error' ? '#f87171' : 'var(--gf-text)' }}>
                        {test === 'loading' ? 'Testing connection…' : msg}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button onClick={() => go(1)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={runTest} disabled={test === 'loading'} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--gf-border)', background: 'var(--gf-hover)', color: 'var(--gf-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: test === 'loading' ? 0.6 : 1 }}>Test connection</button>
                    <button onClick={handleSave} disabled={test === 'loading'} style={{ padding: '8px 20px', borderRadius: 6, background: saved && test === 'ok' ? '#16a34a' : 'var(--gf-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: test === 'loading' ? 0.6 : 1, transition: 'background 0.2s' }}>
                      {saved && test === 'ok' ? '✓ Saved' : 'Save & test'}
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