import type { Dashboard, Alert, LogEntry, DeviceMetric, Plugin, DataSource, User, Team } from '@/types';

// ── Seed RNG ─────────────────────────────────
let seed = 42;
export function rand(min = 0, max = 100) {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return min + ((seed >>> 0) / 0xffffffff) * (max - min);
}
export function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)); }
export function randChoice<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

// ── Simulated Telemetry ───────────────────────
let _cpu = 45;
let _mem = 62;
let _rx = 120;
let _tx = 80;

export function nextTelemetry() {
  _cpu = Math.max(5, Math.min(98, _cpu + (Math.random() - 0.5) * 8));
  _mem = Math.max(20, Math.min(95, _mem + (Math.random() - 0.5) * 4));
  _rx = Math.max(0, _rx + (Math.random() - 0.5) * 30);
  _tx = Math.max(0, _tx + (Math.random() - 0.5) * 20);
  return { cpu: _cpu, memory: _mem, rx: _rx, tx: _tx };
}

// ── Mock Dashboards ───────────────────────────
export const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: '1', uid: 'system-overview', title: 'System Overview',
    description: 'Real-time system health and performance metrics',
    tags: ['system', 'infrastructure'], panels: [],
    timeRange: { from: 'now-1h', to: 'now' }, refresh: '5s',
    createdAt: '2024-01-10T10:00:00Z', updatedAt: '2024-01-15T14:30:00Z',
    createdBy: 'admin', isStarred: true, folderTitle: 'Infrastructure',
  },
  {
    id: '2', uid: 'iot-telemetry', title: 'IoT Telemetry',
    description: 'MQTT device telemetry and sensor data',
    tags: ['iot', 'mqtt', 'devices'], panels: [],
    timeRange: { from: 'now-30m', to: 'now' }, refresh: '1s',
    createdAt: '2024-01-12T08:00:00Z', updatedAt: '2024-01-16T09:15:00Z',
    createdBy: 'admin', isStarred: true, folderTitle: 'IoT',
  },
  {
    id: '3', uid: 'application-logs', title: 'Application Logs',
    description: 'Aggregated logs from all microservices',
    tags: ['logs', 'loki'], panels: [],
    timeRange: { from: 'now-15m', to: 'now' }, refresh: '10s',
    createdAt: '2024-01-08T12:00:00Z', updatedAt: '2024-01-14T16:45:00Z',
    createdBy: 'editor', isStarred: false, folderTitle: 'Applications',
  },
  {
    id: '4', uid: 'network-monitoring', title: 'Network Monitoring',
    description: 'Network traffic analysis and anomaly detection',
    tags: ['network', 'traffic'], panels: [],
    timeRange: { from: 'now-6h', to: 'now' }, refresh: '30s',
    createdAt: '2024-01-05T09:00:00Z', updatedAt: '2024-01-13T11:00:00Z',
    createdBy: 'admin', isStarred: false, folderTitle: 'Infrastructure',
  },
  {
    id: '5', uid: 'kubernetes-cluster', title: 'Kubernetes Cluster',
    description: 'Pod health, resource usage, and deployments',
    tags: ['k8s', 'kubernetes', 'containers'], panels: [],
    timeRange: { from: 'now-1h', to: 'now' }, refresh: '15s',
    createdAt: '2024-01-03T14:00:00Z', updatedAt: '2024-01-11T10:30:00Z',
    createdBy: 'admin', isStarred: true, folderTitle: 'Kubernetes',
  },
];

// ── Mock Alerts ───────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'a1', name: 'High CPU Usage', state: 'firing', severity: 'critical',
    message: 'CPU usage exceeded 90% for 5 minutes on prod-server-01',
    labels: { host: 'prod-server-01', env: 'production' },
    dashboardId: '1', firedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    value: 93.4, threshold: 90,
  },
  {
    id: 'a2', name: 'Memory Pressure', state: 'firing', severity: 'warning',
    message: 'Memory utilization above 85% on api-gateway-02',
    labels: { host: 'api-gateway-02', env: 'production' },
    dashboardId: '1', firedAt: new Date(Date.now() - 28 * 60000).toISOString(),
    value: 87.2, threshold: 85,
  },
  {
    id: 'a3', name: 'Device Offline', state: 'firing', severity: 'warning',
    message: 'IoT sensor node sensor-142 has been offline for 10 minutes',
    labels: { device: 'sensor-142', location: 'warehouse-b' },
    dashboardId: '2', firedAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    id: 'a4', name: 'High Error Rate', state: 'pending', severity: 'critical',
    message: 'Error rate on /api/v2/orders exceeded 5% (currently 7.3%)',
    labels: { service: 'order-service', env: 'production' },
    dashboardId: '3', firedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    value: 7.3, threshold: 5,
  },
  {
    id: 'a5', name: 'Disk Space Low', state: 'resolved', severity: 'info',
    message: 'Disk usage on /var/log returned to normal levels',
    labels: { host: 'log-aggregator-01' },
    firedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    resolvedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    value: 65, threshold: 85,
  },
];

// ── Mock Log Lines ────────────────────────────
const LOG_MESSAGES = [
  ['info', 'Request processed successfully', 'api-gateway'],
  ['info', 'Cache hit ratio: 94.2%', 'redis-cache'],
  ['warn', 'Slow query detected: 450ms on users table', 'postgres-primary'],
  ['error', 'Connection timeout to upstream service', 'order-service'],
  ['info', 'Deployment completed: v2.4.1 → v2.4.2', 'deploy-bot'],
  ['debug', 'Token refresh completed for user session', 'auth-service'],
  ['warn', 'Rate limit approaching for API key ak_prod_xxxx', 'api-gateway'],
  ['info', 'Health check passed all 12 endpoints', 'health-checker'],
  ['error', 'Unhandled exception in worker thread pool', 'job-processor'],
  ['info', 'Metric batch flushed: 1204 points', 'telegraf'],
  ['fatal', 'OOM Killer invoked on node worker-07', 'k8s-events'],
  ['info', 'MQTT broker: 847 active connections', 'mqtt-broker'],
  ['warn', 'TLS certificate expires in 14 days', 'cert-manager'],
  ['info', 'Autoscaler: scaled up to 8 replicas', 'k8s-autoscaler'],
  ['debug', 'gRPC stream opened: analytics-pipeline', 'grpc-gateway'],
];

export function generateLogEntry(): LogEntry {
  const [level, message, source] = randChoice(LOG_MESSAGES) as [string, string, string];
  return {
    id: Math.random().toString(36).slice(2),
    ts: Date.now(),
    level: level as LogEntry['level'],
    message,
    source,
    labels: { env: 'production', region: randChoice(['us-east-1', 'eu-west-1', 'ap-southeast-1']) },
  };
}

export function generateInitialLogs(count = 40): LogEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    ...generateLogEntry(),
    ts: Date.now() - i * 4000,
  }));
}

// ── Mock Devices ──────────────────────────────
export const MOCK_DEVICES: DeviceMetric[] = [
  { deviceId: 'd1', deviceName: 'Sensor Node Alpha', status: 'online', cpu: 23, memory: 45, temp: 42, uptime: 99.8, lastSeen: 'now', location: 'Warehouse A', metrics: [] },
  { deviceId: 'd2', deviceName: 'Gateway Unit Beta', status: 'online', cpu: 67, memory: 78, temp: 58, uptime: 97.2, lastSeen: 'now', location: 'Datacenter', metrics: [] },
  { deviceId: 'd3', deviceName: 'Edge Compute Gamma', status: 'warning', cpu: 88, memory: 91, temp: 71, uptime: 94.5, lastSeen: '2m ago', location: 'Factory Floor', metrics: [] },
  { deviceId: 'd4', deviceName: 'Sensor Node Delta', status: 'offline', cpu: 0, memory: 0, uptime: 0, lastSeen: '12m ago', location: 'Warehouse B', metrics: [] },
  { deviceId: 'd5', deviceName: 'MQTT Broker Epsilon', status: 'online', cpu: 34, memory: 52, temp: 49, uptime: 99.9, lastSeen: 'now', location: 'Cloud', metrics: [] },
  { deviceId: 'd6', deviceName: 'RTU Controller Zeta', status: 'online', cpu: 12, memory: 28, temp: 38, uptime: 99.5, lastSeen: 'now', location: 'Plant A', metrics: [] },
];

// ── Mock Plugins ──────────────────────────────
export const MOCK_PLUGINS: Plugin[] = [
  { id: 'prometheus', name: 'Prometheus', description: 'Pull metrics from Prometheus endpoints', type: 'datasource', version: '5.2.0', author: 'Vizora Labs', enabled: true, signature: 'valid' },
  { id: 'loki', name: 'Grafana Loki', description: 'Log aggregation datasource', type: 'datasource', version: '3.1.0', author: 'Vizora Labs', enabled: true, signature: 'valid' },
  { id: 'echarts-panel', name: 'ECharts Panel', description: 'Advanced Apache ECharts visualizations', type: 'panel', version: '1.5.0', author: 'Community', enabled: true, signature: 'unsigned' },
  { id: 'mqtt-datasource', name: 'MQTT Datasource', description: 'Real-time MQTT broker integration', type: 'datasource', version: '2.0.1', author: 'Vizora Labs', enabled: true, signature: 'valid' },
  { id: 'clock-panel', name: 'Clock Panel', description: 'Display current time with timezone support', type: 'panel', version: '2.1.0', author: 'Community', enabled: false, signature: 'unsigned' },
  { id: 'piechart', name: 'Pie Chart', description: 'Classic pie and donut chart panel', type: 'panel', version: '3.0.0', author: 'Vizora Labs', enabled: true, signature: 'valid' },
];

// ── Mock Data Sources ─────────────────────────
export const MOCK_DATASOURCES: DataSource[] = [
  { id: 'ds1', name: 'Prometheus Default', type: 'prometheus', url: 'http://prometheus:9090', isDefault: true, access: 'proxy' },
  { id: 'ds2', name: 'Loki Logs', type: 'loki', url: 'http://loki:3100', access: 'proxy' },
  { id: 'ds3', name: 'InfluxDB IoT', type: 'influxdb', url: 'http://influxdb:8086', access: 'proxy' },
  { id: 'ds4', name: 'MQTT Broker', type: 'mqtt', url: 'mqtt://broker:1883', access: 'direct' },
  { id: 'ds5', name: 'Elasticsearch', type: 'elasticsearch', url: 'http://es:9200', access: 'proxy' },
];

// ── Mock Users ────────────────────────────────
export const MOCK_CURRENT_USER: User = {
  id: 'u1', name: 'Alex Reyes', email: 'alex@vizora.io', role: 'admin',
  createdAt: '2024-01-01T00:00:00Z', lastLogin: new Date().toISOString(),
};

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Platform Engineering', memberCount: 12 },
  { id: 't2', name: 'Data Science', memberCount: 8 },
  { id: 't3', name: 'SRE', memberCount: 5 },
];
