'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Dashboard, Alert, LogEntry, DeviceMetric, LayoutItem, User } from '@/types';

// ── Theme Store ──────────────────────────────
interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'vizora-theme' }
  )
);

// ── Sidebar Store ────────────────────────────
interface SidebarStore {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: 'vizora-sidebar' }
  )
);

// ── Dashboard Store ──────────────────────────
interface DashboardStore {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  layouts: Record<string, LayoutItem[]>;
  isEditing: boolean;
  setDashboards: (d: Dashboard[]) => void;
  setActiveDashboard: (id: string) => void;
  setLayout: (dashId: string, items: LayoutItem[]) => void;
  setEditing: (v: boolean) => void;
  starDashboard: (id: string) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      dashboards: [],
      activeDashboardId: null,
      layouts: {},
      isEditing: false,
      setDashboards: (dashboards) => set({ dashboards }),
      setActiveDashboard: (id) => set({ activeDashboardId: id }),
      setLayout: (dashId, items) =>
        set((s) => ({ layouts: { ...s.layouts, [dashId]: items } })),
      setEditing: (isEditing) => set({ isEditing }),
      starDashboard: (id) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === id ? { ...d, isStarred: !d.isStarred } : d
          ),
        })),
    }),
    { name: 'vizora-dashboards' }
  )
);

// ── Metrics Store (live telemetry) ───────────
interface MetricsStore {
  cpu: number[];
  memory: number[];
  network: { rx: number[]; tx: number[] };
  timestamps: number[];
  deviceMetrics: DeviceMetric[];
  updateMetrics: (cpu: number, mem: number, rx: number, tx: number) => void;
  setDeviceMetrics: (devices: DeviceMetric[]) => void;
  updateDevice: (id: string, partial: Partial<DeviceMetric>) => void;
}

const HISTORY = 60;

export const useMetricsStore = create<MetricsStore>((set) => ({
  cpu: Array(HISTORY).fill(0),
  memory: Array(HISTORY).fill(0),
  network: { rx: Array(HISTORY).fill(0), tx: Array(HISTORY).fill(0) },
  timestamps: Array(HISTORY).fill(Date.now()),
  deviceMetrics: [],
  updateMetrics: (cpu, mem, rx, tx) =>
    set((s) => ({
      cpu: [...s.cpu.slice(1), cpu],
      memory: [...s.memory.slice(1), mem],
      network: {
        rx: [...s.network.rx.slice(1), rx],
        tx: [...s.network.tx.slice(1), tx],
      },
      timestamps: [...s.timestamps.slice(1), Date.now()],
    })),
  setDeviceMetrics: (deviceMetrics) => set({ deviceMetrics }),
  updateDevice: (id, partial) =>
    set((s) => ({
      deviceMetrics: s.deviceMetrics.map((d) =>
        d.deviceId === id ? { ...d, ...partial } : d
      ),
    })),
}));

// ── Alerts Store ─────────────────────────────
interface AlertsStore {
  alerts: Alert[];
  setAlerts: (a: Alert[]) => void;
  acknowledgeAlert: (id: string) => void;
}

export const useAlertsStore = create<AlertsStore>((set) => ({
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  acknowledgeAlert: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, state: 'resolved' as const } : a
      ),
    })),
}));

// ── Logs Store ───────────────────────────────
interface LogsStore {
  logs: LogEntry[];
  maxLogs: number;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
}

export const useLogsStore = create<LogsStore>((set) => ({
  logs: [],
  maxLogs: 500,
  addLog: (log) =>
    set((s) => ({
      logs: [log, ...s.logs].slice(0, s.maxLogs),
    })),
  clearLogs: () => set({ logs: [] }),
}));

// ── User Store ───────────────────────────────
interface UserStore {
  currentUser: User | null;
  workspace: string;
  setUser: (u: User) => void;
  setWorkspace: (w: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      currentUser: null,
      workspace: 'Production',
      setUser: (currentUser) => set({ currentUser }),
      setWorkspace: (workspace) => set({ workspace }),
    }),
    { name: 'vizora-user' }
  )
);

// ── Time Range Store ─────────────────────────
interface TimeRangeStore {
  from: string;
  to: string;
  setRange: (from: string, to: string) => void;
}

export const useTimeRangeStore = create<TimeRangeStore>((set) => ({
  from: 'now-1h',
  to: 'now',
  setRange: (from, to) => set({ from, to }),
}));

// ── Auth Store ───────────────────────────────
interface AuthState {
  isLoggedIn:  boolean;
  username:    string;
  displayName: string;
  login:       (username: string) => void;
  logout:      () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn:  false,
      username:    '',
      displayName: '',
      login: (username: string) =>
        set({
          isLoggedIn:  true,
          username,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
        }),
      logout: () =>
        set({ isLoggedIn: false, username: '', displayName: '' }),
    }),
    { name: 'vizora-auth' }
  )
);

// ── Re-exports ───────────────────────────────
export { useDataSourcesStore } from './datasources';