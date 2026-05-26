// LOCATION: src/app/plugins/postgresql/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type TestState = 'idle' | 'loading' | 'ok' | 'error';
type SSLMode   = 'disable' | 'require' | 'verify-ca' | 'verify-full';

const F: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const H: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'var(--border)');

interface PGCfg {
  name: string; host: string; port: string; database: string;
  username: string; password: string; sslMode: SSLMode;
  maxOpenConns: string; maxIdleConns: string; connMaxLifetime: string; timezone: string;
}

const DEFAULT: PGCfg = {
  name: 'PostgreSQL', host: 'localhost', port: '5432',
  database: '', username: 'postgres', password: '',
  sslMode: 'disable', maxOpenConns: '10', maxIdleConns: '5',
  connMaxLifetime: '14400', timezone: 'UTC',
};

export default function PostgreSQLPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { save, update, getById, setActive, configs } = useDataSourcesStore();

  const existing = editId ? getById(editId) : undefined;
  const [cfg, setCfg] = useState<PGCfg>({ ...DEFAULT, ...(existing ?? {}) });
  const [test, setTest] = useState<TestState>('idle');
  const [msg, setMsg]   = useState('');
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [showAdv, setShowAdv] = useState(false);

  const set = <K extends keyof PGCfg>(k: K, v: PGCfg[K]) => setCfg(p => ({ ...p, [k]: v }));
  const isValid = !!(cfg.name && cfg.host && cfg.database && cfg.username);

  const runTest = async (): Promise<boolean> => {
    setTest('loading'); setMsg('');
    try {
      const res  = await fetch('/api/datasources/postgresql/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error'); setMsg(data.message);
      return data.ok;
    } catch (e: any) { setTest('error'); setMsg(e.message); return false; }
  };

  const handleSave = async () => {
    const ok = await runTest();
    const status = ok ? 'connected' : 'error';
    if (editId && savedId) { update(savedId, { ...cfg, status } as any); }
    else { const id = save({ ...cfg, type: 'postgresql', status } as any); setSavedId(id); setActive(id); }
  };

  const saved = configs.filter(c => c.type === 'postgresql');

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#33679118', border: '1px solid #33679130', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🐘</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>PostgreSQL</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Relational database · SQL queries · TimescaleDB compatible</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ label: 'Type', val: 'SQL', bg: '#dbeafe', color: '#1d4ed8' }, { label: 'Alerting', val: 'Supported', bg: '#dcfce7', color: '#16a34a' }].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '5px 12px', borderRadius: 7, background: bg, border: `1px solid ${color}30` }}>
              <p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 24 }}>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Connection name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB} placeholder="e.g. Production DB" style={F} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={L}>Host <span style={{ color: 'var(--red)' }}>*</span></label>
              <input value={cfg.host} onChange={e => set('host', e.target.value)} onFocus={onF} onBlur={onB} placeholder="localhost" style={F} />
            </div>
            <div>
              <label style={L}>Port</label>
              <input type="number" value={cfg.port} onChange={e => set('port', e.target.value)} onFocus={onF} onBlur={onB} style={F} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Database <span style={{ color: 'var(--red)' }}>*</span></label>
            <input value={cfg.database} onChange={e => set('database', e.target.value)} onFocus={onF} onBlur={onB} placeholder="mydb" style={F} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={L}>Username <span style={{ color: 'var(--red)' }}>*</span></label>
              <input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onF} onBlur={onB} style={F} />
            </div>
            <div>
              <label style={L}>Password</label>
              <input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onF} onBlur={onB} style={F} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>SSL mode</label>
            <span style={H}>Use 'require' for cloud databases, 'disable' for local</span>
            <select value={cfg.sslMode} onChange={e => set('sslMode', e.target.value as SSLMode)} onFocus={onF} onBlur={onB} style={F}>
              <option value="disable">disable — No SSL</option>
              <option value="require">require — SSL required</option>
              <option value="verify-ca">verify-ca — Verify CA certificate</option>
              <option value="verify-full">verify-full — Full verification</option>
            </select>
          </div>

          {/* Advanced */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
            <button onClick={() => setShowAdv(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Advanced connection pool</span>
              <span style={{ color: 'var(--text-muted)' }}>{showAdv ? '▲' : '▼'}</span>
            </button>
            {showAdv && (
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={L}>Max open conns</label><input type="number" value={cfg.maxOpenConns} onChange={e => set('maxOpenConns', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
                <div><label style={L}>Max idle conns</label><input type="number" value={cfg.maxIdleConns} onChange={e => set('maxIdleConns', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
                <div><label style={L}>Lifetime (s)</label><input type="number" value={cfg.connMaxLifetime} onChange={e => set('connMaxLifetime', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
              </div>
            )}
          </div>

          {test !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16, background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)', border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}` }}>
              <span style={{ fontWeight: 700, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-muted)' }}>{test === 'loading' ? '⟳' : test === 'ok' ? '✓' : '✕'}</span>
              <span style={{ fontSize: 13, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-primary)' }}>{test === 'loading' ? 'Testing…' : msg}</span>
            </div>
          )}

          {test === 'ok' && savedId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => router.push('/metrics')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔍 Explore data</button>
              <button onClick={() => router.push('/dashboards/new')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📊 Build dashboard</button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={() => router.push('/plugins')} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={runTest} disabled={!isValid || test === 'loading'} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !isValid || test === 'loading' ? 0.5 : 1 }}>Test connection</button>
              <button onClick={handleSave} disabled={!isValid || test === 'loading'} style={{ padding: '9px 24px', borderRadius: 8, background: test === 'ok' ? '#16a34a' : 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !isValid || test === 'loading' ? 0.5 : 1, transition: 'background 0.2s' }}>{test === 'ok' && savedId ? '✓ Saved' : 'Save & test'}</button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: '#336791', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick connect</div>
          <div style={{ padding: '12px 14px' }}>
            {[
              { name: 'Supabase',   host: 'db.<ref>.supabase.co',   ssl: 'require'  },
              { name: 'Neon',       host: '<ep>.neon.tech',           ssl: 'require'  },
              { name: 'TimescaleDB',host: '<host>.timescaledb.io',    ssl: 'require'  },
              { name: 'Local',      host: 'localhost',                ssl: 'disable'  },
            ].map(b => (
              <div key={b.name} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{b.host}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>SSL: {b.ssl}</div>
              </div>
            ))}
            {saved.length > 0 && saved.map(c => (
              <button key={c.id} onClick={() => router.push(`/plugins/postgresql?id=${c.id}`)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: c.id === savedId ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer', marginBottom: 2 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'connected' ? 'var(--green)' : 'var(--red)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}