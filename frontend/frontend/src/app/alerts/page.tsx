'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Bell, Plus, Search, Filter, RefreshCw, ChevronDown,
  ChevronRight, MoreVertical, AlertTriangle, CheckCircle2,
  Clock, XCircle, Pause, Play, Trash2, Eye, VolumeX,
  ArrowUpRight, Settings, Copy, Edit3, Layers,
  Activity, BarChart3, History, SlidersHorizontal,
  Shield, Zap, TrendingUp, Info,
} from 'lucide-react';
import { useAlertingStore } from '@/store/alerting';
import type { AlertInstance, AlertRule, AlertState, Severity } from '@/store/alerting';

/* ═══════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════ */
const STATE_CFG: Record<AlertState, { label: string; color: string; bg: string; icon: React.FC<{ size?: number }> }> = {
  firing:   { label: 'Firing',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: ({ size = 14 }) => <AlertTriangle size={size} /> },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: ({ size = 14 }) => <Clock size={size} /> },
  resolved: { label: 'Resolved', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: ({ size = 14 }) => <CheckCircle2 size={size} /> },
  no_data:  { label: 'No data',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: ({ size = 14 }) => <Info size={size} /> },
  error:    { label: 'Error',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   icon: ({ size = 14 }) => <XCircle size={size} /> },
};

const SEV_CFG: Record<Severity, { color: string; bg: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  info:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
};

function StateBadge({ state }: { state: AlertState }) {
  const cfg = STATE_CFG[state];
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

function SevBadge({ severity }: { severity: Severity }) {
  const cfg = SEV_CFG[severity];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg, textTransform: 'uppercase',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {severity}
    </span>
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 10, height: 10, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'ping 1.6s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: on ? 'var(--accent)' : 'var(--surface-3)',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
        border: '1px solid var(--border-2)',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, left: on ? 18 : 2,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

/* ── Kebab menu ── */
function KebabMenu({ items }: { items: Array<{ label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid transparent',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
      >
        <MoreVertical size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border-2)',
              borderRadius: 8, boxShadow: 'var(--shadow-lg)',
              minWidth: 160, padding: '4px 0', overflow: 'hidden',
            }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => { item.onClick(); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', background: 'transparent', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  color: item.danger ? 'var(--red)' : 'var(--text-primary)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = item.danger ? 'var(--red-soft)' : 'var(--surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ count, label, folder }: { count: number; label: string; folder: string }) {
  const [open, setOpen] = useState(true);
  return { open, setOpen, node: (
    <div
      onClick={() => setOpen(v => !v)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        marginBottom: open ? 8 : 0, transition: 'background 0.12s',
        userSelect: 'none',
      }}
    >
      <ChevronRight size={14} color="var(--text-muted)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      <Layers size={14} color="var(--text-muted)" />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{folder}</span>
      <ChevronRight size={12} color="var(--text-muted)" />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 11, padding: '1px 7px', borderRadius: 20, background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600 }}>{count}</span>
    </div>
  )};
}

/* ═══════════════════════════════════════════
   SUB-VIEWS
═══════════════════════════════════════════ */

/* ── Alert Instances view ── */
function AlertInstances() {
  const { instances, silenceAlert, resolveAlert } = useAlertingStore();
  const [filter, setFilter] = useState<'all' | AlertState>('all');
  const [search, setSearch] = useState('');

  const filtered = instances.filter(a => {
    if (filter !== 'all' && a.state !== filter) return false;
    if (search && !a.ruleName.toLowerCase().includes(search.toLowerCase()) && !a.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    firing:   instances.filter(a => a.state === 'firing').length,
    pending:  instances.filter(a => a.state === 'pending').length,
    resolved: instances.filter(a => a.state === 'resolved').length,
  };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts..."
            style={{
              width: '100%', padding: '7px 10px 7px 30px',
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-2)', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            ['all',      'All',                counts.firing + counts.pending + counts.resolved],
            ['firing',   'Firing',             counts.firing],
            ['pending',  'Pending',            counts.pending],
            ['resolved', 'Resolved',           counts.resolved],
          ] as const).map(([f, label, n]) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', border: '1px solid',
                borderColor: filter === f ? STATE_CFG[f === 'all' ? 'no_data' : f]?.color ?? 'var(--accent)' : 'var(--border)',
                background: filter === f ? (f === 'all' ? 'var(--accent-soft)' : STATE_CFG[f]?.bg ?? 'var(--accent-soft)') : 'var(--surface-2)',
                color: filter === f ? (f === 'all' ? 'var(--accent)' : STATE_CFG[f]?.color ?? 'var(--accent)') : 'var(--text-muted)',
                transition: 'all 0.12s', fontFamily: 'inherit',
              }}
            >
              {label} {n > 0 && <span style={{ fontWeight: 700 }}>({n})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AnimatePresence mode="popLayout">
          {filtered.map((alert, i) => {
            const sc = STATE_CFG[alert.state];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                style={{
                  display: 'grid', gridTemplateColumns: '20px 1fr auto',
                  gap: 12, padding: '14px 16px', borderRadius: 10,
                  border: `1px solid ${alert.state === 'firing' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                  background: alert.state === 'firing' ? 'rgba(239,68,68,0.03)' : 'var(--surface)',
                  alignItems: 'center',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
              >
                {/* Dot */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {alert.state === 'firing'
                    ? <PulsingDot color={sc.color} />
                    : <span style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, display: 'block' }} />
                  }
                </div>

                {/* Body */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.ruleName}</span>
                    <SevBadge severity={alert.severity} />
                    <StateBadge state={alert.state} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', fontSize: 11 }}>{alert.source}</span>
                    <span>Value: <strong style={{ color: 'var(--text-primary)' }}>{alert.value}</strong></span>
                    <span>Threshold: <strong style={{ color: 'var(--text-primary)' }}>{alert.threshold}</strong></span>
                    <span style={{ color: 'var(--text-muted)' }}>Fired {alert.firedAt}</span>
                  </div>
                  {/* Labels */}
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Object.entries(alert.labels).map(([k, v]) => (
                      <span key={k} style={{
                        fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                        padding: '1px 6px', borderRadius: 4,
                        background: 'var(--surface-3)', color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}>
                        {k}=<span style={{ color: 'var(--accent)' }}>{v}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Link href={`/alerts/silences/new?alert=${alert.id}`}>
                    <button style={{
                      padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
                      background: 'var(--surface-2)', fontSize: 12, cursor: 'pointer',
                      color: 'var(--text-secondary)', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                    >
                      <VolumeX size={12} /> Silence
                    </button>
                  </Link>
                  <KebabMenu items={[
                    { label: 'View details',    icon: <Eye size={13} />,          onClick: () => {} },
                    { label: 'View rule',       icon: <Bell size={13} />,         onClick: () => {} },
                    { label: 'Mark resolved',   icon: <CheckCircle2 size={13} />, onClick: () => resolveAlert(alert.id) },
                    { label: 'Silence alert',   icon: <VolumeX size={13} />,      onClick: () => silenceAlert(alert.id) },
                  ]} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No alerts match your filter</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Try adjusting the filters above</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Alert Rules view ── */
function AlertRulesView() {
  const { rules, toggleRule, deleteRule, updateRule } = useAlertingStore();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | string>('all');

  const folders = [...new Set(rules.map(r => r.folder))];

  const filtered = rules.filter(r => {
    if (stateFilter !== 'all' && r.state !== stateFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byFolder = folders.map(f => ({
    folder: f,
    groups: [...new Set(filtered.filter(r => r.folder === f).map(r => r.group))].map(g => ({
      group: g,
      rules: filtered.filter(r => r.folder === f && r.group === g),
    })).filter(g => g.rules.length > 0),
  })).filter(f => f.groups.length > 0);

  return (
    <div>
      {/* Search + filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rules..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'firing', 'pending', 'resolved', 'no_data'] as const).map(s => (
            <button key={s} onClick={() => setStateFilter(s)}
              style={{
                padding: '6px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                border: '1px solid var(--border)', fontFamily: 'inherit',
                background: stateFilter === s ? 'var(--accent-soft)' : 'var(--surface-2)',
                color: stateFilter === s ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: stateFilter === s ? 600 : 400,
                transition: 'all 0.12s', textTransform: 'capitalize',
              }}>
              {s === 'all' ? 'All' : STATE_CFG[s].label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <Link href="/alerts/new" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              transition: 'background 0.12s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}
            >
              <Plus size={14} /> New alert rule
            </button>
          </Link>
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 180px 120px 100px 80px 90px 60px',
        gap: 12, padding: '8px 14px',
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border)',
      }}>
        <span>Rule</span>
        <span>Condition</span>
        <span>Contact point</span>
        <span>State</span>
        <span>Last eval</span>
        <span>Enabled</span>
        <span />
      </div>

      {/* Grouped rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        {byFolder.map(({ folder, groups }) =>
          groups.map(({ group, rules: grpRules }) => {
            const [groupOpen, setGroupOpen] = useState(true);
            return (
              <div key={`${folder}-${group}`}>
                {/* Group header */}
                <div
                  onClick={() => setGroupOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    marginBottom: groupOpen ? 4 : 0,
                    transition: 'background 0.12s', userSelect: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                >
                  <ChevronRight size={13} color="var(--text-muted)" style={{ transform: groupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                  <Layers size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{folder}</span>
                  <ChevronRight size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{group}</span>
                  <span style={{
                    marginLeft: 6, fontSize: 11, padding: '1px 7px', borderRadius: 20,
                    background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600,
                  }}>{grpRules.length} rule{grpRules.length !== 1 ? 's' : ''}</span>
                  {grpRules.some(r => r.state === 'firing') && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 600 }}>
                      {grpRules.filter(r => r.state === 'firing').length} firing
                    </span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {groupOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
                        {grpRules.map((rule, i) => (
                          <div
                            key={rule.id}
                            style={{
                              display: 'grid', gridTemplateColumns: '1fr 180px 120px 100px 80px 90px 60px',
                              gap: 12, padding: '13px 14px', alignItems: 'center',
                              borderBottom: i < grpRules.length - 1 ? '1px solid var(--border)' : 'none',
                              transition: 'background 0.12s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            {/* Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              {rule.state === 'firing'
                                ? <PulsingDot color={STATE_CFG.firing.color} />
                                : <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATE_CFG[rule.state].color, flexShrink: 0, display: 'block' }} />
                              }
                              <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.name}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>{rule.target}</p>
                              </div>
                            </div>

                            {/* Condition */}
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.condition}</span>

                            {/* Contact */}
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.contactPoint}</span>

                            {/* State */}
                            <StateBadge state={rule.state} />

                            {/* Last eval */}
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rule.lastEval}</span>

                            {/* Toggle */}
                            <Toggle on={rule.enabled} onChange={(v) => updateRule(rule.id, { enabled: v })} />

                            {/* Actions */}
                            <KebabMenu items={[
                              { label: 'Edit',           icon: <Edit3 size={13} />,       onClick: () => {} },
                              { label: 'Duplicate',      icon: <Copy size={13} />,        onClick: () => {} },
                              { label: rule.enabled ? 'Pause' : 'Enable', icon: rule.enabled ? <Pause size={13} /> : <Play size={13} />, onClick: () => toggleRule(rule.id) },
                              { label: 'View instances', icon: <Eye size={13} />,         onClick: () => {} },
                              { label: 'Delete',         icon: <Trash2 size={13} />,      onClick: () => deleteRule(rule.id), danger: true },
                            ]} />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {byFolder.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>No alert rules found</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Create your first alert rule to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Alert Groups view (like Grafana's Grouping view) ── */
function AlertGroupsView() {
  const { instances } = useAlertingStore();
  const grouped = instances.reduce((acc, a) => {
    const key = a.ruleName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, AlertInstance[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(grouped).map(([name, alerts]) => {
        const [open, setOpen] = useState(false);
        const hasFiring = alerts.some(a => a.state === 'firing');
        return (
          <div key={name} style={{ border: `1px solid ${hasFiring ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', background: 'var(--surface)' }}>
            <div
              onClick={() => setOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                cursor: 'pointer', background: hasFiring ? 'rgba(239,68,68,0.04)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = hasFiring ? 'rgba(239,68,68,0.07)' : 'var(--surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = hasFiring ? 'rgba(239,68,68,0.04)' : 'transparent'}
            >
              <ChevronRight size={13} color="var(--text-muted)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              {hasFiring ? <PulsingDot color="#ef4444" /> : <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', display: 'block' }} />}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{name}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {alerts.map(a => <StateBadge key={a.id} state={a.state} />)}
              </div>
            </div>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  {alerts.map((a, i) => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px 10px 38px',
                      borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)',
                    }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', fontSize: 11 }}>{a.source}</span>
                      <span>Value: <strong style={{ color: 'var(--text-primary)' }}>{a.value}</strong></span>
                      <span>Threshold: {a.threshold}</span>
                      <span style={{ marginLeft: 'auto' }}>Fired {a.firedAt}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
type Tab = 'alerts' | 'rules' | 'groups' | 'history';

export default function AlertsPage() {
  const { rules, instances } = useAlertingStore();
  const [tab, setTab] = useState<Tab>('alerts');

  const firing   = instances.filter(a => a.state === 'firing').length;
  const pending  = instances.filter(a => a.state === 'pending').length;
  const resolved = instances.filter(a => a.state === 'resolved').length;
  const noData   = instances.filter(a => a.state === 'no_data').length;

  const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: 'alerts', label: 'Alert instances', icon: <Bell size={14} /> },
    { id: 'rules',  label: 'Alert rules',     icon: <Settings size={14} /> },
    { id: 'groups', label: 'Alert groups',    icon: <Layers size={14} /> },
    { id: 'history',label: 'History',         icon: <History size={14} /> },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {/* Ping animation global style */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Alerts & IRM
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Incident response and alert rule management
          </p>
        </div>
        <Link href="/alerts/new" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: 'var(--shadow-accent)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}
          >
            <Plus size={15} /> New alert rule
          </button>
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Firing',       value: firing,          ...STATE_CFG.firing   },
          { label: 'Pending',      value: pending,         ...STATE_CFG.pending  },
          { label: 'Resolved',     value: resolved,        ...STATE_CFG.resolved },
          { label: 'Alert rules',  value: rules.length,    color: 'var(--accent)', bg: 'var(--accent-soft)', icon: Bell },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            style={{
              padding: '16px 18px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              transition: 'box-shadow 0.15s', cursor: 'default',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: color,
                display: 'block', flexShrink: 0,
                boxShadow: label === 'Firing' && firing > 0 ? `0 0 0 3px ${color}30` : 'none',
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 30, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick nav links ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Contact points',        href: '/alerts/contacts',  icon: <Bell size={13} /> },
          { label: 'Notification policies', href: '/alerts/policies',  icon: <SlidersHorizontal size={13} /> },
          { label: 'Silences',              href: '/alerts/silences',  icon: <VolumeX size={13} /> },
          { label: 'IRM',                   href: '/alerts/irm',       icon: <Shield size={13} /> },
        ].map(({ label, href, icon }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 7,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.12s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              {icon} {label} <ArrowUpRight size={11} color="var(--text-muted)" />
            </button>
          </Link>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20, gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'inherit', transition: 'color 0.12s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            {t.icon} {t.label}
            {t.id === 'alerts' && firing > 0 && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, marginLeft: 2 }}>
                {firing}
              </span>
            )}
            {tab === t.id && (
              <motion.div
                layoutId="alert-main-tab"
                style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'alerts'  && <AlertInstances />}
          {tab === 'rules'   && <AlertRulesView />}
          {tab === 'groups'  && <AlertGroupsView />}
          {tab === 'history' && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
              <History size={36} style={{ marginBottom: 12, opacity: 0.35 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Alert history coming soon</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>State change log will appear here</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}