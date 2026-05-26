// src/store/datasources.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Connector types supported ─────────────────────────────
export type ConnectorType =
  | 'influxdb'
  | 'mqtt'
  | 'postgresql'
  | 'mysql'
  | 'prometheus'
  | 'elasticsearch'
  | 'redis'
  | 'mongodb';

export type ConnectorStatus = 'connected' | 'error' | 'untested' | 'connecting';

// ── Per-connector config shapes ───────────────────────────
export interface InfluxDBConfig {
  type: 'influxdb';
  id: string;
  name: string;
  url: string;
  version: '1.x' | '2.x' | 'cloud';
  queryLanguage: 'flux' | 'influxql';
  token: string;
  org: string;
  bucket: string;
  database: string;
  username: string;
  password: string;
  tlsSkipVerify: boolean;
  timeout: string;
  maxSeries: string;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface MQTTConfig {
  type: 'mqtt';
  id: string;
  name: string;
  host: string;          // e.g. mqtt://broker.hivemq.com
  port: string;          // 1883 / 8883 (TLS) / 9001 (WS)
  clientId: string;
  username: string;
  password: string;
  useTLS: boolean;
  caCert: string;
  clientCert: string;
  clientKey: string;
  keepAlive: string;     // seconds
  qos: '0' | '1' | '2';
  cleanSession: boolean;
  subscribeTopics: string; // comma-separated
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface PostgreSQLConfig {
  type: 'postgresql';
  id: string;
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  sslMode: 'disable' | 'require' | 'verify-ca' | 'verify-full';
  maxOpenConns: string;
  maxIdleConns: string;
  connMaxLifetime: string;
  timezone: string;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface MySQLConfig {
  type: 'mysql';
  id: string;
  name: string;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  useTLS: boolean;
  maxOpenConns: string;
  maxIdleConns: string;
  connMaxLifetime: string;
  timezone: string;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface PrometheusConfig {
  type: 'prometheus';
  id: string;
  name: string;
  url: string;
  scrapeInterval: string;
  queryTimeout: string;
  httpMethod: 'GET' | 'POST';
  basicAuthUser: string;
  basicAuthPassword: string;
  bearerToken: string;
  tlsSkipVerify: boolean;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface ElasticsearchConfig {
  type: 'elasticsearch';
  id: string;
  name: string;
  url: string;
  index: string;
  username: string;
  password: string;
  apiKey: string;
  version: '7.x' | '8.x';
  tlsSkipVerify: boolean;
  logMessageField: string;
  logLevelField: string;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface RedisConfig {
  type: 'redis';
  id: string;
  name: string;
  host: string;
  port: string;
  password: string;
  database: string;
  useTLS: boolean;
  poolSize: string;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export interface MongoDBConfig {
  type: 'mongodb';
  id: string;
  name: string;
  connectionString: string; // mongodb://... or mongodb+srv://...
  database: string;
  username: string;
  password: string;
  authSource: string;
  tlsEnabled: boolean;
  status: ConnectorStatus;
  savedAt: number;
  lastTestedAt?: number;
  errorMessage?: string;
}

export type DataSourceConfig =
  | InfluxDBConfig
  | MQTTConfig
  | PostgreSQLConfig
  | MySQLConfig
  | PrometheusConfig
  | ElasticsearchConfig
  | RedisConfig
  | MongoDBConfig;

// ── Store ─────────────────────────────────────────────────
interface DataSourcesStore {
  configs: DataSourceConfig[];
  activeId: string | null;

  // CRUD
  save: (cfg: Omit<DataSourceConfig, 'id' | 'savedAt'>) => string;
  update: (id: string, patch: Partial<DataSourceConfig>) => void;
  remove: (id: string) => void;
  setActive: (id: string) => void;

  // Getters
  getById: (id: string) => DataSourceConfig | undefined;
  getActive: () => DataSourceConfig | null;
  getByType: <T extends DataSourceConfig>(type: ConnectorType) => T[];

  // Legacy InfluxDB compat (used by explore/metrics pages)
  influxDBConfigs: InfluxDBConfig[];
  activeInfluxDBId: string | null;
  saveInfluxDB: (cfg: Omit<InfluxDBConfig, 'id' | 'savedAt' | 'type'>) => string;
  updateInfluxDB: (id: string, cfg: Partial<InfluxDBConfig>) => void;
  removeInfluxDB: (id: string) => void;
  setActiveInfluxDB: (id: string) => void;
  getActiveInfluxDB: () => InfluxDBConfig | null;
}

export const useDataSourcesStore = create<DataSourcesStore>()(
  persist(
    (set, get) => ({
      configs: [],
      activeId: null,

      save: (cfg) => {
        const id = `${cfg.type}-${Date.now()}`;
        const full = { ...cfg, id, savedAt: Date.now() } as DataSourceConfig;
        set(s => ({ configs: [...s.configs, full], activeId: id }));
        return id;
      },

      update: (id, patch) =>
        set(s => ({
          configs: s.configs.map(c => c.id === id ? { ...c, ...patch } as DataSourceConfig : c),
        })),

      remove: (id) =>
        set(s => ({
          configs: s.configs.filter(c => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      setActive: (id) => set({ activeId: id }),

      getById: (id) => get().configs.find(c => c.id === id),

      getActive: () => {
        const s = get();
        return s.configs.find(c => c.id === s.activeId) ?? null;
      },

      getByType: <T extends DataSourceConfig>(type: ConnectorType) =>
        get().configs.filter(c => c.type === type) as T[],

      // ── Legacy InfluxDB compat ──
      get influxDBConfigs() {
        return get().configs.filter(c => c.type === 'influxdb') as InfluxDBConfig[];
      },
      get activeInfluxDBId() {
        const active = get().configs.find(c => c.id === get().activeId);
        return active?.type === 'influxdb' ? active.id : null;
      },
      saveInfluxDB: (cfg) => {
        return get().save({ ...cfg, type: 'influxdb' } as Omit<InfluxDBConfig, 'id' | 'savedAt'>);
      },
      updateInfluxDB: (id, cfg) => get().update(id, cfg),
      removeInfluxDB: (id) => get().remove(id),
      setActiveInfluxDB: (id) => get().setActive(id),
      getActiveInfluxDB: () => {
        const s = get();
        const influxConfigs = s.configs.filter(c => c.type === 'influxdb') as InfluxDBConfig[];
        return influxConfigs.find(c => c.id === s.activeId) ?? influxConfigs[0] ?? null;
      },
    }),
    { name: 'vizora-datasources-v2' }
  )
);