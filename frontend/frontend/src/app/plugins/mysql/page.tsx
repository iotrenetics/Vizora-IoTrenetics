// ═══════════════════════════════════════════════════════════
// LOCATION: src/app/plugins/mysql/page.tsx
// ═══════════════════════════════════════════════════════════
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type TestState = 'idle' | 'loading' | 'ok' | 'error';
const F: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--border)');

interface MySQLCfg { name: string; host: string; port: string; database: string; username: string; password: string; useTLS: boolean; maxOpenConns: string; maxIdleConns: string; }
const DEFAULT: MySQLCfg = { name: 'MySQL', host: 'localhost', port: '3306', database: '', username: 'root', password: '', useTLS: false, maxOpenConns: '10', maxIdleConns: '5' };

export default function MySQLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { save, update, getById, setActive } = useDataSourcesStore();
  const existing = editId ? getById(editId) : undefined;
  const [cfg, setCfg] = useState<MySQLCfg>({ ...DEFAULT, ...(existing ?? {}) });
  const [test, setTest] = useState<TestState>('idle');
  const [msg, setMsg] = useState('');
  const [savedId, setSavedId] = useState<string | null>(editId);
  const set = <K extends keyof MySQLCfg>(k: K, v: MySQLCfg[K]) => setCfg(p => ({ ...p, [k]: v }));
  const isValid = !!(cfg.name && cfg.host && cfg.database && cfg.username);

  const runTest = async () => {
    setTest('loading'); setMsg('');
    try {
      const res = await fetch('/api/datasources/mysql/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error'); setMsg(data.message); return data.ok;
    } catch (e: any) { setTest('error'); setMsg(e.message); return false; }
  };

  const handleSave = async () => {
    const ok = await runTest();
    if (editId && savedId) update(savedId, { ...cfg, status: ok ? 'connected' : 'error' } as any);
    else { const id = save({ ...cfg, type: 'mysql', status: ok ? 'connected' : 'error' } as any); setSavedId(id); setActive(id); }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#4479A118', border: '1px solid #4479A130', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🐬</div>
        <div><h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MySQL</h1><p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Relational database · SQL · MariaDB compatible</p></div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 24 }}>
        <div style={{ marginBottom: 16 }}><label style={L}>Connection name <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 16 }}>
          <div><label style={L}>Host <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.host} onChange={e => set('host', e.target.value)} onFocus={onF} onBlur={onB} placeholder="localhost" style={F} /></div>
          <div><label style={L}>Port</label><input type="number" value={cfg.port} onChange={e => set('port', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
        </div>
        <div style={{ marginBottom: 16 }}><label style={L}>Database <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.database} onChange={e => set('database', e.target.value)} onFocus={onF} onBlur={onB} placeholder="mydb" style={F} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><label style={L}>Username <span style={{ color: 'var(--red)' }}>*</span></label><input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
          <div><label style={L}>Password</label><input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <div onClick={() => set('useTLS', !cfg.useTLS)} style={{ width: 36, height: 20, borderRadius: 10, background: cfg.useTLS ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: cfg.useTLS ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Use TLS</span>
        </label>
        {test !== 'idle' && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}>
            <span style={{ fontWeight: 700, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? '⟳' : test === 'ok' ? '✓' : '✕'}</span>
            <span style={{ fontSize: 13, color: test === 'ok' ? '#16a34a' : '#dc2626' }}>{test === 'loading' ? 'Testing…' : msg}</span>
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
    </div>
  );
}