// store/alerting.ts
// Drop this file in your store/ folder and export from store/index.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
export type AlertState   = 'firing' | 'pending' | 'resolved' | 'no_data' | 'error';
export type Severity     = 'critical' | 'warning' | 'info';
export type EvalInterval = '10s' | '30s' | '1m' | '2m' | '5m' | '10m';

export interface AlertRule {
  id: string;
  name: string;
  folder: string;
  group: string;
  datasource: string;
  condition: string;
  query: string;
  target: string;
  severity: Severity;
  enabled: boolean;
  evalInterval: EvalInterval;
  pendingPeriod: string;
  noDataState: 'no_data' | 'alerting' | 'ok';
  execErrState: 'error' | 'alerting' | 'ok';
  labels: Record<string, string>;
  annotations: Record<string, string>;
  contactPoint: string;
  createdAt: string;
  updatedAt: string;
  lastEval: string;
  state: AlertState;
}

export interface AlertInstance {
  id: string;
  ruleId: string;
  ruleName: string;
  state: AlertState;
  severity: Severity;
  source: string;
  value: string;
  threshold: string;
  firedAt: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  generatorURL?: string;
}

export interface ContactPoint {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'telegram' | 'opsgenie';
  settings: Record<string, string>;
  disableResolveMessage: boolean;
  createdAt: string;
}

export interface NotificationPolicy {
  id: string;
  receiver: string;
  groupBy: string[];
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
  matchers: Array<{ label: string; op: '=' | '!=' | '=~' | '!~'; value: string }>;
  muteTimeIntervals: string[];
  routes: NotificationPolicy[];
  continue: boolean;
}

export interface Silence {
  id: string;
  status: 'active' | 'expired' | 'pending';
  matchers: Array<{ name: string; value: string; isRegex: boolean; isEqual: boolean }>;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  comment: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: 'open' | 'investigating' | 'mitigated' | 'resolved';
  assignee: string;
  relatedAlerts: string[];
  timeline: Array<{ ts: string; author: string; text: string; type: 'note' | 'status' | 'alert' }>;
  createdAt: string;
  resolvedAt?: string;
  labels: Record<string, string>;
}

/* ═══════════════════════════════════════════
   SEED DATA
═══════════════════════════════════════════ */
export const SEED_RULES: AlertRule[] = [
  {
    id: 'r1', name: 'High CPU Usage', folder: 'Infrastructure', group: 'servers',
    datasource: 'InfluxDB Primary', condition: 'cpu_usage > 90', query: 'SELECT mean("cpu_usage") FROM "servers" WHERE time > now()-5m',
    target: 'All servers', severity: 'critical', enabled: true,
    evalInterval: '30s', pendingPeriod: '5m', noDataState: 'no_data', execErrState: 'error',
    labels: { team: 'ops', env: 'prod' }, annotations: { summary: 'CPU over 90%', runbook: 'https://wiki/runbooks/cpu' },
    contactPoint: 'PagerDuty Ops', createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '30s ago', state: 'firing',
  },
  {
    id: 'r2', name: 'Memory Pressure', folder: 'Infrastructure', group: 'servers',
    datasource: 'InfluxDB Primary', condition: 'mem_usage > 85', query: 'SELECT mean("mem_usage") FROM "servers" WHERE time > now()-2m',
    target: 'All servers', severity: 'warning', enabled: true,
    evalInterval: '30s', pendingPeriod: '2m', noDataState: 'no_data', execErrState: 'alerting',
    labels: { team: 'ops', env: 'prod' }, annotations: { summary: 'Memory pressure detected' },
    contactPoint: 'Slack #alerts', createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '30s ago', state: 'firing',
  },
  {
    id: 'r3', name: 'MQTT Broker Down', folder: 'IoT Platform', group: 'mqtt',
    datasource: 'InfluxDB Primary', condition: 'broker_up == 0', query: 'SELECT last("up") FROM "mqtt_health"',
    target: 'MQTT brokers', severity: 'critical', enabled: true,
    evalInterval: '1m', pendingPeriod: '0s', noDataState: 'alerting', execErrState: 'alerting',
    labels: { team: 'iot', env: 'prod' }, annotations: { summary: 'MQTT broker unreachable', runbook: 'https://wiki/runbooks/mqtt' },
    contactPoint: 'PagerDuty Ops', createdAt: '2025-02-01T09:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '1m ago', state: 'firing',
  },
  {
    id: 'r4', name: 'Disk Space Low', folder: 'Infrastructure', group: 'storage',
    datasource: 'InfluxDB Primary', condition: 'disk_usage > 90', query: 'SELECT mean("disk_usage") FROM "servers" WHERE time > now()-5m',
    target: 'prod-server-01', severity: 'warning', enabled: true,
    evalInterval: '5m', pendingPeriod: '10m', noDataState: 'no_data', execErrState: 'error',
    labels: { team: 'ops', env: 'prod' }, annotations: { summary: 'Disk usage critical' },
    contactPoint: 'Slack #alerts', createdAt: '2025-02-15T11:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '5m ago', state: 'pending',
  },
  {
    id: 'r5', name: 'API Latency High', folder: 'Application', group: 'api',
    datasource: 'Prometheus', condition: 'p99_latency > 300', query: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
    target: 'api-gateway', severity: 'warning', enabled: false,
    evalInterval: '1m', pendingPeriod: '3m', noDataState: 'no_data', execErrState: 'error',
    labels: { team: 'backend', env: 'prod' }, annotations: { summary: 'API p99 latency exceeded' },
    contactPoint: 'Slack #alerts', createdAt: '2025-03-01T10:00:00Z', updatedAt: '2025-04-10T14:00:00Z',
    lastEval: 'Paused', state: 'no_data',
  },
  {
    id: 'r6', name: 'Sensor Node Offline', folder: 'IoT Platform', group: 'devices',
    datasource: 'InfluxDB Primary', condition: 'device_up == 0', query: 'SELECT last("up") FROM "device_health" WHERE time > now()-5m',
    target: 'All IoT devices', severity: 'critical', enabled: true,
    evalInterval: '1m', pendingPeriod: '0s', noDataState: 'alerting', execErrState: 'alerting',
    labels: { team: 'iot', env: 'prod' }, annotations: { summary: 'IoT sensor node offline' },
    contactPoint: 'PagerDuty Ops', createdAt: '2025-01-20T10:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '1m ago', state: 'resolved',
  },
  {
    id: 'r7', name: 'Network Packet Loss', folder: 'Infrastructure', group: 'network',
    datasource: 'Prometheus', condition: 'packet_loss > 3', query: 'rate(node_network_transmit_drop_total[5m]) * 100',
    target: 'edge-router-01', severity: 'warning', enabled: true,
    evalInterval: '2m', pendingPeriod: '5m', noDataState: 'no_data', execErrState: 'error',
    labels: { team: 'netops', env: 'prod' }, annotations: { summary: 'High packet loss on edge router' },
    contactPoint: 'Slack #alerts', createdAt: '2025-04-01T09:00:00Z', updatedAt: '2025-05-01T08:00:00Z',
    lastEval: '2m ago', state: 'pending',
  },
];

export const SEED_INSTANCES: AlertInstance[] = [
  { id: 'a1', ruleId: 'r1', ruleName: 'High CPU Usage',     state: 'firing',   severity: 'critical', source: 'prod-server-01', value: '93.4%',  threshold: '>90%',   firedAt: '12m ago',  labels: { instance: 'prod-server-01', env: 'prod' }, annotations: { summary: 'CPU at 93.4%' } },
  { id: 'a2', ruleId: 'r2', ruleName: 'Memory Pressure',    state: 'firing',   severity: 'warning',  source: 'prod-server-02', value: '87.1%',  threshold: '>85%',   firedAt: '34m ago',  labels: { instance: 'prod-server-02', env: 'prod' }, annotations: { summary: 'Memory at 87.1%' } },
  { id: 'a3', ruleId: 'r3', ruleName: 'MQTT Broker Down',   state: 'firing',   severity: 'critical', source: 'mqtt-broker-01', value: 'offline', threshold: 'online', firedAt: '1h ago',   labels: { instance: 'mqtt-broker-01', env: 'prod' }, annotations: { summary: 'Broker unreachable' } },
  { id: 'a4', ruleId: 'r4', ruleName: 'Disk Space Low',     state: 'pending',  severity: 'warning',  source: 'prod-server-01', value: '91%',    threshold: '>90%',   firedAt: '3m ago',   labels: { instance: 'prod-server-01', env: 'prod' }, annotations: { summary: 'Disk at 91%' } },
  { id: 'a5', ruleId: 'r5', ruleName: 'API Latency High',   state: 'resolved', severity: 'warning',  source: 'api-gateway',    value: '340ms',  threshold: '>300ms', firedAt: '2h ago',   labels: { instance: 'api-gateway', env: 'prod' },    annotations: { summary: 'p99 latency was 340ms' } },
  { id: 'a6', ruleId: 'r6', ruleName: 'Sensor Node Offline',state: 'resolved', severity: 'critical', source: 'sensor-node-04', value: 'offline', threshold: 'online', firedAt: '4h ago',  labels: { instance: 'sensor-node-04', env: 'prod' }, annotations: { summary: 'Node back online' } },
  { id: 'a7', ruleId: 'r7', ruleName: 'Network Packet Loss',state: 'pending',  severity: 'warning',  source: 'edge-router-01', value: '4.2%',   threshold: '>3%',    firedAt: '8m ago',   labels: { instance: 'edge-router-01', env: 'prod' }, annotations: { summary: 'Packet loss 4.2%' } },
];

export const SEED_CONTACTS: ContactPoint[] = [
  { id: 'cp1', name: 'PagerDuty Ops',  type: 'pagerduty', settings: { integrationKey: 'pd_xxxxxxxxxxxxxxxx', severity: 'critical' }, disableResolveMessage: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cp2', name: 'Slack #alerts',  type: 'slack',     settings: { webhookURL: 'https://hooks.slack.com/services/xxx', channel: '#alerts', username: 'Vizora Bot' }, disableResolveMessage: false, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cp3', name: 'Email On-Call',  type: 'email',     settings: { addresses: 'oncall@iotrenetics.com', subject: '[Vizora] {{ .GroupLabels.alertname }}' }, disableResolveMessage: true, createdAt: '2025-02-01T00:00:00Z' },
  { id: 'cp4', name: 'OpsGenie',       type: 'opsgenie',  settings: { apiKey: 'og_xxxxxxxxxxxxxxxx', apiURL: 'https://api.opsgenie.com/v2/alerts' }, disableResolveMessage: false, createdAt: '2025-03-01T00:00:00Z' },
  { id: 'cp5', name: 'Webhook Logger', type: 'webhook',   settings: { url: 'https://ingest.iotrenetics.com/alerts', httpMethod: 'POST' }, disableResolveMessage: true, createdAt: '2025-04-01T00:00:00Z' },
];

export const SEED_POLICY: NotificationPolicy = {
  id: 'root',
  receiver: 'PagerDuty Ops',
  groupBy: ['alertname', 'cluster'],
  groupWait: '30s',
  groupInterval: '5m',
  repeatInterval: '4h',
  matchers: [],
  muteTimeIntervals: [],
  continue: false,
  routes: [
    {
      id: 'r-critical', receiver: 'PagerDuty Ops', groupBy: ['alertname'],
      groupWait: '10s', groupInterval: '1m', repeatInterval: '1h',
      matchers: [{ label: 'severity', op: '=', value: 'critical' }],
      muteTimeIntervals: [], continue: false, routes: [],
    },
    {
      id: 'r-warning', receiver: 'Slack #alerts', groupBy: ['alertname', 'instance'],
      groupWait: '30s', groupInterval: '5m', repeatInterval: '6h',
      matchers: [{ label: 'severity', op: '=', value: 'warning' }],
      muteTimeIntervals: [], continue: false, routes: [],
    },
    {
      id: 'r-iot', receiver: 'Email On-Call', groupBy: ['alertname'],
      groupWait: '0s', groupInterval: '2m', repeatInterval: '2h',
      matchers: [{ label: 'team', op: '=', value: 'iot' }],
      muteTimeIntervals: [], continue: false, routes: [],
    },
  ],
};

export const SEED_SILENCES: Silence[] = [
  {
    id: 's1', status: 'active',
    matchers: [{ name: 'instance', value: 'staging-.*', isRegex: true, isEqual: true }],
    startsAt: '2025-05-25T09:00:00Z', endsAt: '2025-05-26T18:00:00Z',
    createdBy: 'admin', comment: 'Staging environment maintenance window',
    createdAt: '2025-05-25T08:55:00Z',
  },
  {
    id: 's2', status: 'active',
    matchers: [{ name: 'alertname', value: 'API Latency High', isRegex: false, isEqual: true }],
    startsAt: '2025-05-26T00:00:00Z', endsAt: '2025-05-28T00:00:00Z',
    createdBy: 'backend-team', comment: 'Known latency spike during migration',
    createdAt: '2025-05-25T23:50:00Z',
  },
  {
    id: 's3', status: 'expired',
    matchers: [{ name: 'severity', value: 'warning', isRegex: false, isEqual: true }],
    startsAt: '2025-05-20T00:00:00Z', endsAt: '2025-05-21T00:00:00Z',
    createdBy: 'admin', comment: 'Planned maintenance',
    createdAt: '2025-05-19T23:00:00Z',
  },
];

export const SEED_INCIDENTS: Incident[] = [
  {
    id: 'i1', title: 'MQTT Broker Degradation — Prod',
    severity: 'critical', status: 'investigating',
    assignee: 'Arjun Mehta',
    relatedAlerts: ['a3'],
    timeline: [
      { ts: '2025-05-26T09:00:00Z', author: 'system',      type: 'alert',  text: 'Alert fired: MQTT Broker Down on mqtt-broker-01' },
      { ts: '2025-05-26T09:03:00Z', author: 'Arjun Mehta', type: 'status', text: 'Status changed to Investigating' },
      { ts: '2025-05-26T09:15:00Z', author: 'Arjun Mehta', type: 'note',   text: 'Broker process restarted. Monitoring reconnections. Likely cause: OOM after overnight batch job.' },
    ],
    createdAt: '2025-05-26T09:00:00Z',
    labels: { env: 'prod', team: 'iot' },
  },
  {
    id: 'i2', title: 'prod-server-01 CPU Spike',
    severity: 'warning', status: 'mitigated',
    assignee: 'Priya Sharma',
    relatedAlerts: ['a1', 'a4'],
    timeline: [
      { ts: '2025-05-26T08:00:00Z', author: 'system',       type: 'alert',  text: 'Alert fired: High CPU Usage' },
      { ts: '2025-05-26T08:05:00Z', author: 'Priya Sharma', type: 'status', text: 'Status changed to Investigating' },
      { ts: '2025-05-26T08:20:00Z', author: 'Priya Sharma', type: 'note',   text: 'Found runaway cron job. Killed. CPU coming down.' },
      { ts: '2025-05-26T08:35:00Z', author: 'Priya Sharma', type: 'status', text: 'Status changed to Mitigated' },
    ],
    createdAt: '2025-05-26T08:00:00Z',
    labels: { env: 'prod', team: 'ops' },
  },
];

/* ═══════════════════════════════════════════
   STORE
═══════════════════════════════════════════ */
interface AlertingStore {
  rules:     AlertRule[];
  instances: AlertInstance[];
  contacts:  ContactPoint[];
  policy:    NotificationPolicy;
  silences:  Silence[];
  incidents: Incident[];

  // Rules
  addRule:    (r: AlertRule)    => void;
  updateRule: (id: string, partial: Partial<AlertRule>) => void;
  deleteRule: (id: string)      => void;
  toggleRule: (id: string)      => void;

  // Contacts
  addContact:    (c: ContactPoint)   => void;
  updateContact: (id: string, partial: Partial<ContactPoint>) => void;
  deleteContact: (id: string)        => void;

  // Policy
  setPolicy: (p: NotificationPolicy) => void;

  // Silences
  addSilence:    (s: Silence)    => void;
  expireSilence: (id: string)    => void;

  // Instances
  silenceAlert:  (id: string)    => void;
  resolveAlert:  (id: string)    => void;

  // Incidents
  addIncident:        (i: Incident) => void;
  updateIncident:     (id: string, partial: Partial<Incident>) => void;
  addTimelineEntry:   (id: string, entry: Incident['timeline'][0]) => void;
}

export const useAlertingStore = create<AlertingStore>()(
  persist(
    (set) => ({
      rules:     SEED_RULES,
      instances: SEED_INSTANCES,
      contacts:  SEED_CONTACTS,
      policy:    SEED_POLICY,
      silences:  SEED_SILENCES,
      incidents: SEED_INCIDENTS,

      addRule:    (r) => set((s) => ({ rules: [...s.rules, r] })),
      updateRule: (id, partial) => set((s) => ({ rules: s.rules.map((r) => r.id === id ? { ...r, ...partial } : r) })),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRule: (id) => set((s) => ({ rules: s.rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r) })),

      addContact:    (c) => set((s) => ({ contacts: [...s.contacts, c] })),
      updateContact: (id, partial) => set((s) => ({ contacts: s.contacts.map((c) => c.id === id ? { ...c, ...partial } : c) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      setPolicy: (policy) => set({ policy }),

      addSilence:    (s) => set((st) => ({ silences: [...st.silences, s] })),
      expireSilence: (id) => set((s) => ({ silences: s.silences.map((sl) => sl.id === id ? { ...sl, status: 'expired' } : sl) })),

      silenceAlert:  (id) => set((s) => ({ instances: s.instances.map((a) => a.id === id ? { ...a, state: 'resolved' } : a) })),
      resolveAlert:  (id) => set((s) => ({ instances: s.instances.map((a) => a.id === id ? { ...a, state: 'resolved' } : a) })),

      addIncident:  (i) => set((s) => ({ incidents: [...s.incidents, i] })),
      updateIncident: (id, partial) => set((s) => ({ incidents: s.incidents.map((i) => i.id === id ? { ...i, ...partial } : i) })),
      addTimelineEntry: (id, entry) => set((s) => ({
        incidents: s.incidents.map((i) => i.id === id ? { ...i, timeline: [...i.timeline, entry] } : i),
      })),
    }),
    { name: 'vizora-alerting' }
  )
);