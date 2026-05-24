// Add this to your store/index.ts (or a new file src/store/datasources.ts)
// Then export it from your main store/index.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InfluxDBConfig {
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
  status: 'connected' | 'error' | 'untested';
  savedAt: number;
}

interface DataSourcesStore {
  influxDBConfigs: InfluxDBConfig[];
  activeInfluxDBId: string | null;
  saveInfluxDB: (cfg: Omit<InfluxDBConfig, 'id' | 'savedAt'>) => string;
  updateInfluxDB: (id: string, cfg: Partial<InfluxDBConfig>) => void;
  removeInfluxDB: (id: string) => void;
  setActiveInfluxDB: (id: string) => void;
  getActiveInfluxDB: () => InfluxDBConfig | null;
}

export const useDataSourcesStore = create<DataSourcesStore>()(
  persist(
    (set, get) => ({
      influxDBConfigs: [],
      activeInfluxDBId: null,

      saveInfluxDB: (cfg) => {
        const id = `influx-${Date.now()}`;
        set(s => ({
          influxDBConfigs: [
            ...s.influxDBConfigs.filter(c => c.url !== cfg.url),
            { ...cfg, id, savedAt: Date.now() },
          ],
          activeInfluxDBId: id,
        }));
        return id;
      },

      updateInfluxDB: (id, cfg) =>
        set(s => ({
          influxDBConfigs: s.influxDBConfigs.map(c => c.id === id ? { ...c, ...cfg } : c),
        })),

      removeInfluxDB: (id) =>
        set(s => ({
          influxDBConfigs: s.influxDBConfigs.filter(c => c.id !== id),
          activeInfluxDBId: s.activeInfluxDBId === id ? null : s.activeInfluxDBId,
        })),

      setActiveInfluxDB: (id) => set({ activeInfluxDBId: id }),

      getActiveInfluxDB: () => {
        const s = get();
        return s.influxDBConfigs.find(c => c.id === s.activeInfluxDBId) ?? s.influxDBConfigs[0] ?? null;
      },
    }),
    { name: 'vizora-datasources' }
  )
);