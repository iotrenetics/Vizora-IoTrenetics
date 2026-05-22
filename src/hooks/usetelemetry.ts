'use client';
import { useEffect, useRef } from 'react';
import { useMetricsStore, useLogsStore, useAlertsStore, useUserStore } from '@/store';
import {
  nextTelemetry, generateLogEntry, MOCK_DEVICES,
  MOCK_ALERTS, MOCK_CURRENT_USER, MOCK_DASHBOARDS,
} from '@/services/mockData';
import { useDashboardStore } from '@/store';

export function useTelemetry(intervalMs = 1000) {
  const { updateMetrics, setDeviceMetrics, updateDevice } = useMetricsStore();
  const { addLog } = useLogsStore();
  const { setAlerts } = useAlertsStore();
  const { setUser } = useUserStore();
  const { setDashboards } = useDashboardStore();
  const tickRef = useRef(0);

  useEffect(() => {
    // Bootstrap mock data
    setAlerts(MOCK_ALERTS);
    setUser(MOCK_CURRENT_USER);
    setDashboards(MOCK_DASHBOARDS);
    setDeviceMetrics(MOCK_DEVICES);

    const id = setInterval(() => {
      tickRef.current++;
      const t = nextTelemetry();
      updateMetrics(t.cpu, t.memory, t.rx, t.tx);

      // Log every ~3s
      if (tickRef.current % 3 === 0) {
        addLog(generateLogEntry());
      }

      // Update random device every ~5s
      if (tickRef.current % 5 === 0) {
        const devices = useMetricsStore.getState().deviceMetrics;
        if (devices.length) {
          const idx = Math.floor(Math.random() * devices.length);
          const d = devices[idx];
          if (d.status !== 'offline') {
            updateDevice(d.deviceId, {
              cpu: Math.max(5, Math.min(98, d.cpu + (Math.random() - 0.5) * 10)),
              memory: Math.max(20, Math.min(95, d.memory + (Math.random() - 0.5) * 6)),
            });
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}