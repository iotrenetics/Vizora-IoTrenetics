// LOCATION: src/app/plugins/mqtt/page.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDataSourcesStore } from '@/store/datasources';

type TestState = 'idle' | 'loading' | 'ok' | 'error';

const F: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface-2)',
  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const L: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 };
const H: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 };
const onF = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--accent)');
const onB = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => (e.target.style.borderColor = 'var(--border)');

interface MQTTCfg {
  name: string; host: string; port: string; clientId: string;
  username: string; password: string; useTLS: boolean;
  caCert: string; clientCert: string; clientKey: string;
  keepAlive: string; qos: '0' | '1' | '2'; cleanSession: boolean;
  subscribeTopics: string;
}

const DEFAULT: MQTTCfg = {
  name: 'MQTT Broker', host: '', port: '1883', clientId: '',
  username: '', password: '', useTLS: false,
  caCert: '', clientCert: '', clientKey: '',
  keepAlive: '60', qos: '1', cleanSession: true,
  subscribeTopics: '#',
};

export default function MQTTPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { save, update, getById, setActive, configs } = useDataSourcesStore();

  const existing = editId ? getById(editId) : undefined;
  const [cfg, setCfg] = useState<MQTTCfg>({ ...DEFAULT, ...(existing ?? {}) });
  const [test, setTest] = useState<TestState>('idle');
  const [msg, setMsg] = useState('');
  const [savedId, setSavedId] = useState<string | null>(editId);
  const [showCerts, setShowCerts] = useState(false);

  const set = <K extends keyof MQTTCfg>(k: K, v: MQTTCfg[K]) => setCfg(p => ({ ...p, [k]: v }));
  const isValid = !!(cfg.name && cfg.host);

  const runTest = async (): Promise<boolean> => {
    setTest('loading'); setMsg('');
    try {
      const res = await fetch('/api/datasources/mqtt/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      setTest(data.ok ? 'ok' : 'error'); setMsg(data.message);
      return data.ok;
    } catch (e: any) { setTest('error'); setMsg(e.message); return false; }
  };

  const handleSave = async () => {
    const ok = await runTest();
    const status = ok ? 'connected' : 'error';
    if (editId && savedId) {
      update(savedId, { ...cfg, status } as any);
    } else {
      const id = save({ ...cfg, type: 'mqtt', status } as any);
      setSavedId(id); setActive(id);
    }
  };

  const savedConnections = configs.filter(c => c.type === 'mqtt');

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f59e0b18', border: '1px solid #f59e0b30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📡</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>MQTT Broker</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Subscribe to MQTT topics · real-time IoT data streaming</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {[{ label: 'Type', val: 'MQTT', bg: '#fef3c7', color: '#92400e' }, { label: 'Protocol', val: 'MQTT 3.1.1 / 5', bg: '#ede9fe', color: '#5b21b6' }].map(({ label, val, bg, color }) => (
            <div key={label} style={{ padding: '5px 12px', borderRadius: 7, background: bg, border: `1px solid ${color}30` }}>
              <p style={{ margin: 0, fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <p style={{ margin: '1px 0 0', fontSize: 12, color, fontWeight: 700 }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Form */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: 24 }}>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Connection name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input value={cfg.name} onChange={e => set('name', e.target.value)} onFocus={onF} onBlur={onB} placeholder="e.g. HiveMQ Cloud" style={F} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={L}>Broker host <span style={{ color: 'var(--red)' }}>*</span></label>
              <span style={H}>Hostname without protocol</span>
              <input value={cfg.host} onChange={e => set('host', e.target.value)} onFocus={onF} onBlur={onB} placeholder="broker.hivemq.com" style={F} />
            </div>
            <div>
              <label style={L}>Port</label>
              <input type="number" value={cfg.port} onChange={e => set('port', e.target.value)} onFocus={onF} onBlur={onB} style={F} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Client ID</label>
            <span style={H}>Leave blank to auto-generate</span>
            <input value={cfg.clientId} onChange={e => set('clientId', e.target.value)} onFocus={onF} onBlur={onB} placeholder="vizora-client-001" style={F} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={L}>Username</label><input value={cfg.username} onChange={e => set('username', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
            <div><label style={L}>Password</label><input type="password" value={cfg.password} onChange={e => set('password', e.target.value)} onFocus={onF} onBlur={onB} style={F} /></div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={L}>Subscribe topics</label>
            <span style={H}>Comma-separated. Use # for all, + for single-level wildcard</span>
            <input value={cfg.subscribeTopics} onChange={e => set('subscribeTopics', e.target.value)} onFocus={onF} onBlur={onB} placeholder="sensors/#, devices/+/status" style={F} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={L}>QoS level</label>
              <select value={cfg.qos} onChange={e => set('qos', e.target.value as '0' | '1' | '2')} onFocus={onF} onBlur={onB} style={F}>
                <option value="0">0 — At most once</option>
                <option value="1">1 — At least once</option>
                <option value="2">2 — Exactly once</option>
              </select>
            </div>
            <div>
              <label style={L}>Keep-alive (seconds)</label>
              <input type="number" value={cfg.keepAlive} onChange={e => set('keepAlive', e.target.value)} onFocus={onF} onBlur={onB} style={F} />
            </div>
          </div>

          {/* Toggles */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
            <div onClick={() => { set('useTLS', !cfg.useTLS); set('port', !cfg.useTLS ? '8883' : '1883'); }}
              style={{ width: 36, height: 20, borderRadius: 10, background: cfg.useTLS ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: cfg.useTLS ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Use TLS/SSL encryption</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <div onClick={() => set('cleanSession', !cfg.cleanSession)}
              style={{ width: 36, height: 20, borderRadius: 10, background: cfg.cleanSession ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: cfg.cleanSession ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Clean session</span>
          </label>

          {/* TLS certs */}
          {cfg.useTLS && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setShowCerts(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                {showCerts ? '▾ Hide' : '▸ Show'} TLS certificates
              </button>
              {showCerts && (
                <div>
                  {(['caCert', 'clientCert', 'clientKey'] as const).map(k => (
                    <div key={k} style={{ marginBottom: 12 }}>
                      <label style={L}>{k === 'caCert' ? 'CA Certificate' : k === 'clientCert' ? 'Client Certificate' : 'Client Private Key'}</label>
                      <textarea value={cfg[k]} onChange={e => set(k, e.target.value)} rows={4}
                        placeholder="-----BEGIN CERTIFICATE-----"
                        style={{ ...F, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test banner */}
          {test !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              background: test === 'ok' ? '#dcfce7' : test === 'error' ? '#fee2e2' : 'var(--surface-2)',
              border: `1px solid ${test === 'ok' ? '#86efac' : test === 'error' ? '#fca5a5' : 'var(--border)'}`,
            }}>
              <span style={{ fontWeight: 700, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-muted)' }}>
                {test === 'loading' ? '⟳' : test === 'ok' ? '✓' : '✕'}
              </span>
              <span style={{ fontSize: 13, color: test === 'ok' ? '#16a34a' : test === 'error' ? '#dc2626' : 'var(--text-primary)' }}>
                {test === 'loading' ? 'Testing connection…' : msg}
              </span>
            </div>
          )}

          {/* Post-save actions */}
          {test === 'ok' && savedId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button onClick={() => router.push('/metrics')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔍 Explore data</button>
              <button onClick={() => router.push('/dashboards/new')} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>📊 Build dashboard</button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <button onClick={() => router.push('/plugins')} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={runTest} disabled={!isValid || test === 'loading'}
                style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: !isValid ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: !isValid ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: test === 'loading' ? 0.6 : 1 }}>
                Test connection
              </button>
              <button onClick={handleSave} disabled={!isValid || test === 'loading'}
                style={{ padding: '9px 24px', borderRadius: 8, background: test === 'ok' ? '#16a34a' : 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: !isValid ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: test === 'loading' ? 0.6 : 1, transition: 'background 0.2s' }}>
                {test === 'ok' && savedId ? '✓ Saved' : 'Save & test'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common brokers</div>
            <div style={{ padding: '12px 14px' }}>
              {[
                { name: 'HiveMQ Cloud',      host: '<id>.s1.eu.hivemq.cloud', port: '8883', tls: true  },
                { name: 'EMQX Cloud',        host: '<id>.emqxsl.com',         port: '8883', tls: true  },
                { name: 'Mosquitto (public)',host: 'test.mosquitto.org',       port: '1883', tls: false },
                { name: 'Local Mosquitto',   host: 'localhost',                port: '1883', tls: false },
              ].map(b => (
                <div key={b.name} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{b.host}:{b.port}{b.tls ? ' (TLS)' : ''}</div>
                </div>
              ))}
            </div>
          </div>

          {savedConnections.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved brokers</div>
              <div style={{ padding: '8px 14px' }}>
                {savedConnections.map(c => (
                  <button key={c.id} onClick={() => router.push(`/plugins/mqtt?id=${c.id}`)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: c.id === savedId ? 'var(--accent-soft)' : 'transparent', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.status === 'connected' ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}