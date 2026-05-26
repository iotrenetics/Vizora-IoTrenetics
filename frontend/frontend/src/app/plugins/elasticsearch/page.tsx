// LOCATION: src/app/plugins/elasticsearch/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type TestState = 'idle' | 'loading' | 'ok' | 'error';
type AuthMode  = 'none' | 'basic' | 'apikey';
const F: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const H: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--border)');

interface ESCfg { name: string; url: string; index: string; username: string; password: string; apiKey: string; version: '7.x' | '8.x'; tlsSkipVerify: boolean; logMessageField: string; logLevelField: string; }
const DEFAULT: ESCfg = { name: 'Elasticsearch', url: 'http://localhost:9200', index: 'logs-*', username: '', password: '', apiKey: '', version: '8.x', tlsSkipVerify: false, logMessageField: 'message', logLevelField: 'level' };

export default function ElasticsearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { save, update, getById, setActive } = useDataSourcesStore();
  const existing = editId ? getById(editId) : undefined;
  const [cfg, setCfg] = useState<ESCfg>({ ...DEFAULT, ...(existing ?? {}) });
  const [test, setTest] = useState<TestState>('idle');
  const [msg, setMsg] = useState('');
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [authMode, setAuthMode] = useState<AuthMode>((existing as any)?.apiKey ? 'apikey' : (existing as any)?.username ? 'basic' : 'none');
  const set = <K extends keyof ESCfg>(k: K, v: ESCfg[K]) => setCfg(p => ({ ...p, [k]: v }));
  const isValid = !!(cfg.name && cfg.url);

  const runTest = async () => {
    setTest('loading'); setMsg('');
    try {
      const res = await fetch('/api/datasources/elasticsearch/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json(); setTest(data.ok ? 'ok' : 'error'); setMsg(data.message); return data.ok;
    } catch (e: any) { setTest('error'); setMsg(e.message); return false; }
  };

  const handleSave = async () => {
    const ok = await runTest();
    if (editId && savedId) update(savedId, { ...cfg, status: ok ? 'connected' : 'error' } as any);
    else { const id = save({ ...cfg, type: 'elasticsearch', status: ok ? 'connected' : 'error' } as any); setSavedId(id); setActive(id); }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#00bfb318', border: '1px solid #00bfb330', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔍</div>
        <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Elasticsearch</h1><p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Search & analytics · logs · Lucene queries · Kibana-compatible</p></div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 24 }}>
        <div style={{ marginBottom: 16 }}><label style={L}>Connection name <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
        <div style={{ marginBottom: 16 }}>
          <label style={L}>URL <span style={{ color: 'var(--red)' }}>*</span></label>
          <span style={H}>e.g. http://localhost:9200 or https://cluster.es.io</span>
          <input value={cfg.url} onChange={e => set('url', e.target.value)} onFocus={onF} onBlur={onB} placeholder="http://localhost:9200" style={F} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={L}>Default index</label><span style={H}>Wildcards supported: logs-*, *-2024</span><input value={cfg.index} onChange={e => set('index', e.target.value)} onFocus={onF} onBlur={onB} placeholder="logs-*" style={F} /></div>
          <div><label style={L}>Version</label><select value={cfg.version} onChange={e => set('version', e.target.value as '7.x' | '8.x')} onFocus={onF} onBlur={onB} style={F}><option value="7.x">7.x</option><option value="8.x">8.x</option></select></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={L}>Authentication</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['none', 'basic', 'apikey'] as AuthMode[]).map(m => (
              <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: `1px solid ${authMode === m ? 'var(--accent)' : 'var(--border)'}`, background: authMode === m ? 'var(--accent-soft)' : 'var(--surface-2)', color: authMode === m ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, fontWeight: authMode === m ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                {m === 'none' ? 'No auth' : m === 'basic' ? 'Basic' : 'API Key'}
              </button>
            ))}
          </div>
          {authMode === 'basic' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><label style={L}>Username</label><input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div><div><label style={L}>Password</label><input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div></div>}
          {authMode === 'apikey' && <div><label style={L}>API Key</label><span style={H}>base64(id:api_key)</span><input type="password" value={cfg.apiKey} onChange={e => set('apiKey', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={L}>Log message field</label><input value={cfg.logMessageField} onChange={e => set('logMessageField', e.target.value)} onFocus={onF} onBlur={onB} placeholder="message" style={F} /></div>
          <div><label style={L}>Log level field</label><input value={cfg.logLevelField} onChange={e => set('logLevelField', e.target.value)} onFocus={onF} onBlur={onB} placeholder="level" style={F} /></div>
        </div>
        {test !== 'idle' && <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}><span style={{ fontWeight: 700, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? '⟳' : test === 'ok' ? '✓' : '✕'}</span><span style={{ fontSize: 13, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? 'Testing…' : msg}</span></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => router.push('/plugins')} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={runTest} disabled={!isValid} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !isValid ? 0.5 : 1 }}>Test connection</button>
            <button onClick={handleSave} disabled={!isValid} style={{ padding: '9px 24px', borderRadius: 8, background: test === 'ok' ? '#16a34a' : 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}>{test === 'ok' && savedId ? '✓ Saved' : 'Save & test'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}