// LOCATION: src/app/plugins/prometheus/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type TestState = 'idle' | 'loading' | 'ok' | 'error';
type AuthMode  = 'none' | 'basic' | 'bearer';

const F: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const H: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--border)');

interface PromCfg { name: string; url: string; scrapeInterval: string; queryTimeout: string; httpMethod: 'GET' | 'POST'; basicAuthUser: string; basicAuthPassword: string; bearerToken: string; tlsSkipVerify: boolean; }
const DEFAULT: PromCfg = { name: 'Prometheus', url: 'http://localhost:9090', scrapeInterval: '15', queryTimeout: '30', httpMethod: 'POST', basicAuthUser: '', basicAuthPassword: '', bearerToken: '', tlsSkipVerify: false };

export default function PrometheusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { save, update, getById, setActive, configs } = useDataSourcesStore();
  const existing = editId ? getById(editId) : undefined;
  const [cfg, setCfg] = useState<PromCfg>({ ...DEFAULT, ...(existing ?? {}) });
  const [test, setTest] = useState<TestState>('idle');
  const [msg, setMsg] = useState('');
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [authMode, setAuthMode] = useState<AuthMode>(
    (existing as any)?.bearerToken ? 'bearer' : (existing as any)?.basicAuthUser ? 'basic' : 'none'
  );
  const set = <K extends keyof PromCfg>(k: K, v: PromCfg[K]) => setCfg(p => ({ ...p, [k]: v }));
  const isValid = !!(cfg.name && cfg.url);

  const runTest = async () => {
    setTest('loading'); setMsg('');
    try {
      const res = await fetch('/api/datasources/prometheus/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error'); setMsg(data.message); return data.ok;
    } catch (e: any) { setTest('error'); setMsg(e.message); return false; }
  };

  const handleSave = async () => {
    const ok = await runTest();
    if (editId && savedId) update(savedId, { ...cfg, status: ok ? 'connected' : 'error' } as any);
    else { const id = save({ ...cfg, type: 'prometheus', status: ok ? 'connected' : 'error' } as any); setSavedId(id); setActive(id); }
  };

  const saved = configs.filter(c => c.type === 'prometheus');

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e6522c18', border: '1px solid #e6522c30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔥</div>
        <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Prometheus</h1><p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Pull-based metrics · PromQL · alerting rules</p></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ label: 'Type', val: 'Metrics', bg: '#fee2e2', color: '#b91c1c' }, { label: 'Query', val: 'PromQL', bg: '#fef3c7', color: '#92400e' }].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '5px 12px', borderRadius: 7, background: bg }}><p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase' }}>{label}</p><p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p></div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 24 }}>
          <div style={{ marginBottom: 16 }}><label style={L}>Connection name <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
          <div style={{ marginBottom: 16 }}>
            <label style={L}>Prometheus URL <span style={{ color: 'var(--red)' }}>*</span></label>
            <span style={H}>URL of your Prometheus instance including port</span>
            <input value={cfg.url} onChange={e => set('url', e.target.value)} onFocus={onF} onBlur={onB} placeholder="http://localhost:9090" style={F} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={L}>Scrape interval (s)</label><input type="number" value={cfg.scrapeInterval} onChange={e => set('scrapeInterval', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
            <div><label style={L}>Query timeout (s)</label><input type="number" value={cfg.queryTimeout} onChange={e => set('queryTimeout', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
            <div><label style={L}>HTTP method</label><select value={cfg.httpMethod} onChange={e => set('httpMethod', e.target.value as 'GET' | 'POST')} onFocus={onF} onBlur={onB} style={F}><option value="POST">POST</option><option value="GET">GET</option></select></div>
          </div>

          {/* Auth mode */}
          <div style={{ marginBottom: 16 }}>
            <label style={L}>Authentication</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['none', 'basic', 'bearer'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${authMode === m ? 'var(--accent)' : 'var(--border)'}`, background: authMode === m ? 'var(--accent-soft)' : 'var(--surface-2)', color: authMode === m ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, fontWeight: authMode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {m === 'none' ? 'No auth' : m === 'basic' ? 'Basic auth' : 'Bearer token'}
                </button>
              ))}
            </div>
            {authMode === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={L}>Username</label><input value={cfg.basicAuthUser} onChange={e => set('basicAuthUser', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
                <div><label style={L}>Password</label><input type="password" value={cfg.basicAuthPassword} onChange={e => set('basicAuthPassword', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
              </div>
            )}
            {authMode === 'bearer' && (
              <div><label style={L}>Bearer token</label><input type="password" value={cfg.bearerToken} onChange={e => set('bearerToken', e.target.value)} onFocus={onF} onBlur={onB} placeholder="eyJhbGci..." style={F} /></div>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <div onClick={() => set('tlsSkipVerify', !cfg.tlsSkipVerify)} style={{ width: 36, height: 20, borderRadius: 10, background: cfg.tlsSkipVerify ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: cfg.tlsSkipVerify ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Skip TLS certificate verification</span>
          </label>

          {test !== 'idle' && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}>
              <span style={{ fontWeight: 700, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? '⟳' : test === 'ok' ? '✓' : '✕'}</span>
              <span style={{ fontSize: 13, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? 'Testing…' : msg}</span>
            </div>
          )}
          {test === 'ok' && savedId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => router.push('/metrics')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔍 Explore</button>
              <button onClick={() => router.push('/dashboards/new')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📊 Dashboard</button>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/plugins')} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={runTest} disabled={!isValid} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !isValid ? 0.5 : 1 }}>Test connection</button>
              <button onClick={handleSave} disabled={!isValid} style={{ padding: '9px 24px', borderRadius: 8, background: test === 'ok' ? '#16a34a' : 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>{test === 'ok' && savedId ? '✓ Saved' : 'Save & test'}</button>
            </div>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: '#e6522c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example PromQL</div>
          <div style={{ padding: 14 }}>
            {['up', 'rate(http_requests_total[5m])', 'node_cpu_seconds_total', 'process_resident_memory_bytes'].map(q => (
              <div key={q} style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{q}</div>
            ))}
            {saved.length > 0 && <div style={{ marginTop: 12 }}>{saved.map(c => <button key={c.id} onClick={() => router.push(`/plugins/prometheus?id=${c.id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: c.id === savedId ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer', marginBottom: 2 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'connected' ? 'var(--green)' : 'var(--red)' }} /><span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{c.name}</span></button>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}