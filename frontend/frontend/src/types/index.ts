// ─────────────────────────────────────────────
//  Vizora – Global TypeScript Types
// ─────────────────────────────────────────────

export type Theme = 'dark' | 'light';

export type PanelType =
  | 'timeseries' | 'gauge' | 'stat' | 'bar' | 'pie'
  | 'logs' | 'table' | 'heatmap' | 'alertlist' | 'mqtt';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AlertState = 'firing' | 'pending' | 'resolved' | 'nodata';

export interface MetricPoint { ts: number; value: number; }

export interface Panel {
  id: string; title: string; type: PanelType;
  x: number; y: number; w: number; h: number;
  datasource?: string; options?: Record<string, unknown>; refreshInterval?: number;
}

export interface Dashboard {
  id: string; uid: string; title: string; description?: string;
  tags?: string[]; panels: Panel[]; variables?: Variable[];
  timeRange: TimeRange; refresh?: string;
  createdAt: string; updatedAt: string; createdBy: string;
  isStarred?: boolean; folderTitle?: string;
}

export interface Variable {
  id: string; name: string; label?: string;
  type: 'query' | 'custom' | 'constant' | 'interval' | 'textbox';
  options: VariableOption[]; current: VariableOption; multi?: boolean;
}

export interface VariableOption { text: string; value: string; selected?: boolean; }

export interface TimeRange {
  from: string; to: string; raw?: { from: string; to: string };
}

export interface DataSource {
  id: string; name: string; type: DataSourceType; url?: string;
  isDefault?: boolean; access?: 'proxy' | 'direct';
  basicAuth?: boolean; jsonData?: Record<string, unknown>; readOnly?: boolean;
}

export type DataSourceType =
  | 'prometheus' | 'loki' | 'influxdb' | 'elasticsearch'
  | 'mqtt' | 'postgres' | 'mysql' | 'graphite'
  | 'jaeger' | 'tempo' | 'cloudwatch' | 'azure';

export interface Alert {
  id: string; name: string; state: AlertState; severity: AlertSeverity;
  message: string; labels?: Record<string, string>;
  dashboardId?: string; panelId?: string;
  firedAt?: string; resolvedAt?: string; value?: number; threshold?: number;
}

export interface LogEntry {
  id: string; ts: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string; labels?: Record<string, string>; source?: string;
}

export interface User {
  id: string; name: string; email: string; role: UserRole;
  avatar?: string; createdAt: string; lastLogin?: string; orgId?: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Team {
  id: string; name: string; email?: string; memberCount: number; avatarUrl?: string;
}

export interface Organization {
  id: string; name: string; plan: 'free' | 'pro' | 'enterprise'; memberCount: number;
}

export interface Plugin {
  id: string; name: string; description: string;
  type: 'panel' | 'datasource' | 'app'; version: string; author: string;
  logoUrl?: string; enabled: boolean; signature?: 'valid' | 'invalid' | 'unsigned';
}

export interface Annotation {
  id: string; dashboardId: string; panelId?: number;
  time: number; timeEnd?: number; text: string; tags?: string[];
  userId?: string; userName?: string;
}

export interface NotificationChannel {
  id: string; name: string;
  type: 'slack' | 'pagerduty' | 'email' | 'webhook' | 'opsgenie';
  isDefault?: boolean; settings?: Record<string, string>;
}

export interface DeviceMetric {
  deviceId: string; deviceName: string; status: 'online' | 'offline' | 'warning';
  cpu: number; memory: number; temp?: number;
  uptime: number; lastSeen: string; location?: string; metrics: MetricPoint[];
}

export interface NavItem {
  id: string; label: string; icon: string; href: string;
  badge?: number | string; children?: NavItem[]; section?: string;
}

export interface LayoutItem {
  i: string; x: number; y: number; w: number; h: number;
  minW?: number; minH?: number; static?: boolean;
}
