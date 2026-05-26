'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Check, Plus, X,
  Bell, Database, SlidersHorizontal, Tag,
  AlertTriangle, Clock, Zap, BookOpen,
  HelpCircle, Code, Play, Info,
} from 'lucide-react';
import { useAlertingStore } from '@/store/alerting';
import type { AlertRule, Severity, EvalInterval } from '@/store/alerting';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface FormState {
  // Step 1 — Query
  name:        string;
  folder:      string;
  group:       string;
  datasource:  string;
  query:       string;
  target:      string;

  // Step 2 — Condition
  condition:     string;
  threshold:     string;
  evalInterval:  EvalInterval;
  pendingPeriod: string;
  noDataState:   'no_data' | 'alerting' | 'ok';
  execErrState:  'error' | 'alerting' | 'ok';

  // Step 3 — Labels & annotations
  severity:    Severity;
  labels:      Array<{ key: string; value: string }>;
  annotations: Array<{ key: string; value: string }>;
  summary:     string;
  description: string;
  runbook:     string;

  // Step 4 — Notifications
  contactPoint:   string;
  overridePolicy: boolean;
}

/* ═══════════════════════════════════════════
   STEP CONFIG
═══════════════════════════════════════════ */
const STEPS = [
  { id: 1, label: 'Define query',     icon: Database },
  { id: 2, label: 'Set conditions',   icon: SlidersHorizontal },
  { id: 3, label: 'Labels & details', icon: Tag },
  { id: 4, label: 'Notifications',    icon: Bell },
];

/* ═══════════════════════════════════════════
   UI ATOMS
═══════════════════════════════════════════ */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, letterSpacing: '0.01em' }}>
      {children} {required && <span style={{ color: 'var(--red)' }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, mono, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder}
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: 'var(--surface-2)',
        color: 'var(--text-primary)', fontSize: 13,
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        outline: 'none', transition: 'border-color 0.15s',
        ...(rest.style ?? {}),
      }}
      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
    />
  );
}

function Select({ value, onChange, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      value={value} onChange={onChange} {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: 'var(--surface-2)',
        color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit',
        outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s',
        appearance: 'none',
      }}
      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
    >
      {children}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, mono, rows = 4, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      value={value as string} onChange={onChange} placeholder={placeholder} rows={rows}
      {...rest}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--border)', background: 'var(--surface-2)',
        color: 'var(--text-primary)', fontSize: 13,
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        outline: 'none', resize: 'vertical', transition: 'border-color 0.15s',
      }}
      onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
      onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
    />
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 8,
      background: 'var(--blue-soft)', border: '1px solid rgba(59,130,246,0.2)',
      marginBottom: 20,
    }}>
      <Info size={14} color="var(--blue)" style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: 12, color: 'var(--blue)', lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{children}</h3>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  );
}

function KVPairs({
  pairs, onChange, addLabel = 'Add',
}: {
  pairs: Array<{ key: string; value: string }>;
  onChange: (pairs: Array<{ key: string; value: string }>) => void;
  addLabel?: string;
}) {
  return (
    <div>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 6, marginBottom: 6 }}>
          <Input value={p.key}   onChange={e => { const n = [...pairs]; n[i] = { ...n[i], key: e.target.value };   onChange(n); }} placeholder="key"   mono />
          <Input value={p.value} onChange={e => { const n = [...pairs]; n[i] = { ...n[i], value: e.target.value }; onChange(n); }} placeholder="value" mono />
          <button onClick={() => onChange(pairs.filter((_, j) => j !== i))}
            style={{ width: 28, height: 36, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          ><X size={13} /></button>
        </div>
      ))}
      <button
        onClick={() => onChange([...pairs, { key: '', value: '' }])}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 7,
          border: '1px dashed var(--border)', background: 'transparent',
          color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
      >
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STEP COMPONENTS
═══════════════════════════════════════════ */
function Step1({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <SectionTitle subtitle="Give your rule a name and connect it to a data source">
        1. Set rule name & data source
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <FieldGroup>
          <Label required>Rule name</Label>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. High CPU Usage" />
        </FieldGroup>
        <FieldGroup>
          <Label required>Folder</Label>
          <Select value={form.folder} onChange={set('folder')}>
            <option value="">Select folder</option>
            <option>Infrastructure</option>
            <option>IoT Platform</option>
            <option>Application</option>
            <option>Network</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label required>Evaluation group</Label>
          <Input value={form.group} onChange={set('group')} placeholder="e.g. servers" />
        </FieldGroup>
      </div>

      <SectionTitle subtitle="Select the data source to query">
        Data source
      </SectionTitle>

      <FieldGroup>
        <Label required>Data source</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { name: 'InfluxDB Primary', icon: '🗄️', type: 'InfluxDB' },
            { name: 'Prometheus',       icon: '📊', type: 'Prometheus' },
            { name: 'MQTT Broker',      icon: '📡', type: 'MQTT' },
            { name: 'PostgreSQL',       icon: '🐘', type: 'PostgreSQL' },
          ].map(ds => (
            <div
              key={ds.name}
              onClick={() => setForm({ ...form, datasource: ds.name })}
              style={{
                padding: '12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${form.datasource === ds.name ? 'var(--accent)' : 'var(--border)'}`,
                background: form.datasource === ds.name ? 'var(--accent-soft)' : 'var(--surface-2)',
                transition: 'all 0.15s', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{ds.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: form.datasource === ds.name ? 'var(--accent)' : 'var(--text-primary)' }}>{ds.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{ds.type}</div>
            </div>
          ))}
        </div>
      </FieldGroup>

      {form.datasource && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
          <SectionTitle subtitle="Write your query to retrieve metric data">
            Query
          </SectionTitle>

          <FieldGroup>
            <Label>Query</Label>
            <Textarea
              value={form.query}
              onChange={set('query')}
              placeholder={
                form.datasource === 'Prometheus'
                  ? 'e.g. rate(http_requests_total[5m])'
                  : 'e.g. SELECT mean("cpu_usage") FROM "servers" WHERE time > now()-5m GROUP BY host'
              }
              mono rows={4}
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Target / Label matcher</Label>
            <Input value={form.target} onChange={set('target')} placeholder="e.g. {env='prod', job='node-exporter'}" mono />
          </FieldGroup>

          {/* Fake preview panel */}
          <div style={{ padding: '14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query preview</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'var(--surface-3)',
                fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Play size={11} /> Run query
              </button>
            </div>
            <div style={{
              height: 80, borderRadius: 6, background: 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: 12,
            }}>
              {form.query ? 'Query preview will appear here after running' : 'Enter a query above to preview results'}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Step2({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const EvalIntervals: EvalInterval[] = ['10s', '30s', '1m', '2m', '5m', '10m'];
  const PendingPeriods = ['0s', '30s', '1m', '2m', '5m', '10m', '15m', '30m', '1h'];

  return (
    <div>
      <SectionTitle subtitle="Define when the alert should fire and how it evaluates">
        2. Configure conditions
      </SectionTitle>

      <InfoBox>
        An alert fires when the query result meets the condition for at least the pending period.
        Set pending period to 0s to fire immediately.
      </InfoBox>

      <FieldGroup>
        <Label required>Condition expression</Label>
        <Input
          value={form.condition}
          onChange={set('condition')}
          placeholder="e.g. cpu_usage > 90  or  last() > 300"
          mono
        />
        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
          Supported: <code>last()</code>, <code>mean()</code>, <code>max()</code>, <code>min()</code>, <code>sum()</code>, <code>count()</code> with comparison operators
        </p>
      </FieldGroup>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FieldGroup>
          <Label required>Evaluation interval</Label>
          <Select value={form.evalInterval} onChange={set('evalInterval') as React.ChangeEventHandler<HTMLSelectElement>}>
            {EvalIntervals.map(i => <option key={i} value={i}>{i}</option>)}
          </Select>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>How often the rule is evaluated</p>
        </FieldGroup>
        <FieldGroup>
          <Label required>Pending period</Label>
          <Select value={form.pendingPeriod} onChange={set('pendingPeriod') as React.ChangeEventHandler<HTMLSelectElement>}>
            {PendingPeriods.map(p => <option key={p} value={p}>{p === '0s' ? '0s (fire immediately)' : p}</option>)}
          </Select>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>How long condition must be true before firing</p>
        </FieldGroup>
      </div>

      <SectionTitle subtitle="What state to set when there's no data or an evaluation error">
        No data & error handling
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FieldGroup>
          <Label>No data state</Label>
          <Select value={form.noDataState} onChange={set('noDataState') as React.ChangeEventHandler<HTMLSelectElement>}>
            <option value="no_data">No data</option>
            <option value="alerting">Alerting</option>
            <option value="ok">OK</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label>Execution error state</Label>
          <Select value={form.execErrState} onChange={set('execErrState') as React.ChangeEventHandler<HTMLSelectElement>}>
            <option value="error">Error</option>
            <option value="alerting">Alerting</option>
            <option value="ok">OK</option>
          </Select>
        </FieldGroup>
      </div>

      {/* Visual threshold preview */}
      <SectionTitle subtitle="Visual preview of your threshold">Threshold preview</SectionTitle>
      <div style={{ padding: '16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ position: 'relative', height: 100, borderRadius: 6, background: 'var(--surface-3)', overflow: 'hidden' }}>
          {/* Fake sparkline */}
          <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <polyline
              points="0,70 40,65 80,50 120,30 160,45 200,80 240,20 280,35 320,60 360,40 400,55"
              fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.8"
            />
            {/* Threshold line */}
            <line x1="0" y1="35" x2="400" y2="35" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" />
            <rect x="0" y="0" width="400" height="35" fill="rgba(239,68,68,0.06)" />
          </svg>
          <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>
            Threshold: {form.condition || '—'}
          </div>
          <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'var(--text-muted)' }}>
            Sample data (not real)
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <SectionTitle subtitle="Labels control routing. Annotations provide human-readable context.">
        3. Labels & annotations
      </SectionTitle>

      <FieldGroup>
        <Label required>Severity</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['critical', 'warning', 'info'] as const).map(s => {
            const colors = { critical: { c: '#ef4444', bg: 'rgba(239,68,68,0.12)' }, warning: { c: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }, info: { c: '#3b82f6', bg: 'rgba(59,130,246,0.12)' } };
            const { c, bg } = colors[s];
            return (
              <div
                key={s}
                onClick={() => setForm({ ...form, severity: s })}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${form.severity === s ? c : 'var(--border)'}`,
                  background: form.severity === s ? bg : 'var(--surface-2)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: form.severity === s ? c : 'var(--text-muted)', textTransform: 'capitalize' }}>{s}</div>
              </div>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup>
        <Label>Custom labels</Label>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)' }}>
          Labels are used to route alerts to contact points via notification policies.
        </p>
        <KVPairs
          pairs={form.labels}
          onChange={labels => setForm({ ...form, labels })}
          addLabel="Add label"
        />
      </FieldGroup>

      <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

      <SectionTitle subtitle="Annotations provide human-readable information attached to each alert">
        Annotations
      </SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FieldGroup>
          <Label>Summary</Label>
          <Input value={form.summary} onChange={set('summary')} placeholder="Brief human-readable alert summary" />
        </FieldGroup>
        <FieldGroup>
          <Label>Runbook URL</Label>
          <Input value={form.runbook} onChange={set('runbook')} placeholder="https://wiki/runbooks/..." />
        </FieldGroup>
      </div>

      <FieldGroup>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={set('description')} placeholder="Detailed description of the alert and what it means..." rows={3} />
      </FieldGroup>

      <FieldGroup>
        <Label>Custom annotations</Label>
        <KVPairs
          pairs={form.annotations}
          onChange={annotations => setForm({ ...form, annotations })}
          addLabel="Add annotation"
        />
      </FieldGroup>
    </div>
  );
}

function Step4({ form, setForm, contacts }: { form: FormState; setForm: (f: FormState) => void; contacts: Array<{ id: string; name: string; type: string }> }) {
  const ICONS: Record<string, string> = {
    pagerduty: '📟', slack: '💬', email: '📧', webhook: '🔗', telegram: '✈️', opsgenie: '🚨',
  };

  return (
    <div>
      <SectionTitle subtitle="Choose how and where alert notifications are sent">
        4. Configure notifications
      </SectionTitle>

      <InfoBox>
        Alert notifications are sent to contact points. You can use the default notification policy or override routing for this rule.
      </InfoBox>

      <FieldGroup>
        <Label required>Contact point</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {contacts.map(cp => (
            <div
              key={cp.id}
              onClick={() => setForm({ ...form, contactPoint: cp.name })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${form.contactPoint === cp.name ? 'var(--accent)' : 'var(--border)'}`,
                background: form.contactPoint === cp.name ? 'var(--accent-soft)' : 'var(--surface-2)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--surface-3)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
              }}>
                {ICONS[cp.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: form.contactPoint === cp.name ? 'var(--accent)' : 'var(--text-primary)' }}>{cp.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{cp.type}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${form.contactPoint === cp.name ? 'var(--accent)' : 'var(--border)'}`,
                background: form.contactPoint === cp.name ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}>
                {form.contactPoint === cp.name && <Check size={10} color="#fff" />}
              </div>
            </div>
          ))}
        </div>
      </FieldGroup>

      {/* Summary */}
      <div style={{ marginTop: 24, padding: '16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rule summary
        </div>
        {[
          { label: 'Name',          value: form.name        || '—' },
          { label: 'Folder',        value: form.folder      || '—' },
          { label: 'Data source',   value: form.datasource  || '—' },
          { label: 'Condition',     value: form.condition   || '—' },
          { label: 'Eval interval', value: form.evalInterval },
          { label: 'Pending period',value: form.pendingPeriod },
          { label: 'Severity',      value: form.severity },
          { label: 'Contact point', value: form.contactPoint || '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: typeof value === 'string' && value.includes('>') ? 'JetBrains Mono, monospace' : 'inherit', fontSize: 12 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function NewAlertRulePage() {
  const router = useRouter();
  const { contacts, addRule } = useAlertingStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: '', folder: '', group: '', datasource: '', query: '', target: '',
    condition: '', threshold: '', evalInterval: '1m', pendingPeriod: '5m',
    noDataState: 'no_data', execErrState: 'error',
    severity: 'warning', labels: [], annotations: [],
    summary: '', description: '', runbook: '',
    contactPoint: '', overridePolicy: false,
  });

  const canProceed = () => {
    if (step === 1) return form.name && form.folder && form.datasource;
    if (step === 2) return form.condition && form.evalInterval;
    if (step === 3) return true;
    if (step === 4) return form.contactPoint;
    return true;
  };

  const handleSave = () => {
    const rule: AlertRule = {
      id: `r-${Date.now()}`,
      name: form.name,
      folder: form.folder,
      group: form.group || 'default',
      datasource: form.datasource,
      condition: form.condition,
      query: form.query,
      target: form.target,
      severity: form.severity,
      enabled: true,
      evalInterval: form.evalInterval,
      pendingPeriod: form.pendingPeriod,
      noDataState: form.noDataState,
      execErrState: form.execErrState,
      labels: Object.fromEntries(form.labels.map(l => [l.key, l.value])),
      annotations: {
        ...Object.fromEntries(form.annotations.map(a => [a.key, a.value])),
        summary: form.summary,
        description: form.description,
        runbook: form.runbook,
      },
      contactPoint: form.contactPoint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEval: 'Just created',
      state: 'no_data',
    };
    addRule(rule);
    router.push('/alerts');
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {/* Back */}
      <button
        onClick={() => router.push('/alerts')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 13, fontFamily: 'inherit',
          padding: 0, transition: 'color 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
      >
        <ChevronLeft size={15} /> Back to alerts
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
          New alert rule
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
          Configure a new alert rule to monitor your IoT metrics
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, gap: 0 }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div
                onClick={() => done && setStep(s.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: done ? 'pointer' : 'default', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${active ? 'var(--accent)' : done ? 'var(--green)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-soft)' : done ? 'var(--green-soft)' : 'var(--surface-2)',
                  color: active ? 'var(--accent)' : done ? 'var(--green)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}>
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : done ? 'var(--text-secondary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: done ? 'var(--green)' : 'var(--border)', margin: '0 8px', marginBottom: 22, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div style={{
        padding: '28px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--surface)',
        marginBottom: 20,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {step === 1 && <Step1 form={form} setForm={setForm} />}
            {step === 2 && <Step2 form={form} setForm={setForm} />}
            {step === 3 && <Step3 form={form} setForm={setForm} />}
            {step === 4 && <Step4 form={form} setForm={setForm} contacts={contacts} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => step > 1 ? setStep(step - 1) : router.push('/alerts')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
        >
          <ChevronLeft size={14} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step} of {STEPS.length}</span>
          {step < STEPS.length ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: canProceed() ? 'var(--accent)' : 'var(--surface-3)',
                color: canProceed() ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: canProceed() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (canProceed()) (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { if (canProceed()) (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canProceed()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 8, border: 'none',
                background: 'var(--green)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#16a34a'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--green)'}
            >
              <Check size={14} /> Save rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}