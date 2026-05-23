'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALERTS = [
  { id: 'a1', name: 'High CPU Usage',       state: 'firing',   severity: 'critical', source: 'prod-server-01', value: '93.4%',  threshold: '>90%',  fired: '12m ago',   rule: 'cpu_critical'  },
  { id: 'a2', name: 'Memory Pressure',       state: 'firing',   severity: 'warning',  source: 'prod-server-02', value: '87.1%',  threshold: '>85%',  fired: '34m ago',   rule: 'mem_warning'   },
  { id: 'a3', name: 'MQTT Broker Down',      state: 'firing',   severity: 'critical', source: 'mqtt-broker-01', value: 'offline',threshold: 'online',fired: '1h ago',    rule: 'mqtt_health'   },
  { id: 'a4', name: 'Disk Space Low',        state: 'pending',  severity: 'warning',  source: 'prod-server-01', value: '91%',    threshold: '>90%',  fired: '3m ago',    rule: 'disk_warning'  },
  { id: 'a5', name: 'API Latency High',      state: 'resolved', severity: 'warning',  source: 'api-gateway',    value: '340ms',  threshold: '>300ms',fired: '2h ago',    rule: 'api_latency'   },
  { id: 'a6', name: 'Sensor Node Offline',   state: 'resolved', severity: 'critical', source: 'sensor-node-04', value: 'offline',threshold: 'online',fired: '4h ago',    rule: 'device_health' },
  { id: 'a7', name: 'Network Packet Loss',   state: 'pending',  severity: 'warning',  source: 'edge-router-01', value: '4.2%',   threshold: '>3%',   fired: '8m ago',    rule: 'net_loss'      },
];

const RULES = [
  { id: 'r1', name: 'CPU Critical',    condition: 'cpu > 90% for 5m',  target: 'All servers',     enabled: true,  lastEval: '30s ago' },
  { id: 'r2', name: 'Memory Warning',  condition: 'mem > 85% for 2m',  target: 'All servers',     enabled: true,  lastEval: '30s ago' },
  { id: 'r3', name: 'MQTT Health',     condition: 'broker_up == 0',    target: 'MQTT brokers',    enabled: true,  lastEval: '1m ago'  },
  { id: 'r4', name: 'Device Offline',  condition: 'device_up == 0',    target: 'All IoT devices', enabled: true,  lastEval: '30s ago' },
  { id: 'r5', name: 'API Latency',     condition: 'p99_latency > 300', target: 'API gateway',     enabled: false, lastEval: 'Paused'  },
];

const STATE_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  firing:   { bg: '#fee2e2', color: '#dc2626', dot: '#f43f5e' },
  pending:  { bg: '#fef9c3', color: '#b45309', dot: '#f59e0b' },
  resolved: { bg: '#dcfce7', color: '#16a34a', dot: '#10b981' },
};
const SEV_STYLE: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#fee2e2', color: '#dc2626' },
  warning:  { bg: '#fef9c3', color: '#b45309' },
  info:     { bg: '#dbeafe', color: '#2563eb' },
};

const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoBell = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoToggle = ({ on }: { on: boolean }) => (
  <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: on ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
  </div>
);

export default function AlertsPage() {
  const [tab, setTab] = useState<'active' | 'rules'>('active');
  const [filter, setFilter] = useState<'all' | 'firing' | 'pending' | 'resolved'>('all');

  const firing = ALERTS.filter(a => a.state === 'firing').length;
  const pending = ALERTS.filter(a => a.state === 'pending').length;

  const filtered = ALERTS.filter(a => filter === 'all' || a.state === filter);

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Alerts & IRM</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Incident response and alert rule management</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>
          <IcoPlus /> New alert rule
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Firing',    value: firing,                                     color: '#f43f5e', bg: '#fee2e2' },
          { label: 'Pending',   value: pending,                                    color: '#f59e0b', bg: '#fef9c3' },
          { label: 'Resolved',  value: ALERTS.filter(a => a.state === 'resolved').length, color: '#10b981', bg: '#dcfce7' },
          { label: 'Alert rules', value: RULES.length,                              color: '#6366f1', bg: '#ede9fe' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ padding: '16px 18px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: label === 'Firing' && firing > 0 ? `0 0 0 3px ${color}30` : 'none' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {(['active', 'rules'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ position: 'relative', padding: '8px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'Syne, sans-serif' }}>
            {t === 'active' ? 'Active alerts' : 'Alert rules'}
            {tab === t && <motion.div layoutId="alert-tab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: 2 }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'active' && (
          <motion.div key="active" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['all', 'firing', 'pending', 'resolved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)', background: filter === f ? 'var(--accent)' : 'var(--surface)', color: filter === f ? '#fff' : 'var(--text-muted)', transition: 'all 0.12s', fontFamily: 'Syne, sans-serif', textTransform: 'capitalize' }}>
                  {f} {f !== 'all' && <span style={{ fontWeight: 700 }}>({ALERTS.filter(a => a.state === f).length})</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((alert, i) => {
                const ss = STATE_STYLE[alert.state];
                const sv = SEV_STYLE[alert.severity];
                return (
                  <motion.div key={alert.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 14, padding: '14px 16px', borderRadius: 10, border: `1px solid ${alert.state === 'firing' ? '#fca5a5' : 'var(--border)'}`, background: 'var(--surface)', alignItems: 'start', transition: 'box-shadow 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                  >
                    {/* State dot */}
                    <div style={{ marginTop: 3 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: ss.dot, ...(alert.state === 'firing' ? { animation: 'pulse 2s infinite' } : {}) }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.name}</p>
                        <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sv.bg, color: sv.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{alert.severity}</span>
                        <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>{alert.state}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text-primary)' }}>{alert.source}</span>
                        {' · '}{alert.value} (threshold: {alert.threshold})
                        {' · '}Fired {alert.fired}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>Silence</button>
                      <button style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'Syne, sans-serif' }}>View</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === 'rules' && (
          <motion.div key="rules" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px 90px 80px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                {['Rule name', 'Condition', 'Target', 'Last eval', 'Enabled'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {RULES.map((rule, i) => (
                <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 200px 160px 90px 80px', gap: 12, padding: '13px 16px', borderBottom: i < RULES.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IcoBell />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{rule.name}</p>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>{rule.condition}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rule.target}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rule.lastEval}</span>
                  <IcoToggle on={rule.enabled} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}