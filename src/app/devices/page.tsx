'use client';
import { motion } from 'framer-motion';
import { AppShell } from '@/layouts/AppShell';
import { useMetricsStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { MqttStats } from '@/components/widgets/MqttStats';
import { DeviceStatus } from '@/components/widgets/DeviceStatus';
import { Wifi, WifiOff, AlertTriangle, Thermometer, Clock, MapPin } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/utils';

export default function DevicesPage() {
  const { deviceMetrics } = useMetricsStore();
  const online = deviceMetrics.filter(d => d.status === 'online').length;
  const warning = deviceMetrics.filter(d => d.status === 'warning').length;
  const offline = deviceMetrics.filter(d => d.status === 'offline').length;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Device Fleet</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">MQTT · IoT · Edge compute nodes</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Online', value: online, color: '#22c55e', icon: Wifi },
          { label: 'Warning', value: warning, color: '#f59e0b', icon: AlertTriangle },
          { label: 'Offline', value: offline, color: '#ef4444', icon: WifiOff },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 h-[400px]">
          <DeviceStatus />
        </div>
        <div className="h-[400px]">
          <MqttStats />
        </div>
      </div>

      <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Device Details</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {deviceMetrics.map((d, i) => {
          const color = STATUS_COLORS[d.status];
          return (
            <motion.div key={d.deviceId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card padding="sm" hover>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Wifi size={14} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.deviceName}</p>
                    <p className="text-[11px] capitalize font-medium mt-0.5" style={{ color }}>{d.status}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 rounded-full">{d.deviceId}</span>
                </div>
                {d.status !== 'offline' && (
                  <div className="space-y-2">
                    {[['CPU', d.cpu], ['Memory', d.memory]].map(([label, val]) => (
                      <div key={label as string} className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-muted)] w-10">{label as string}</span>
                        <div className="flex-1 h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{
                            width: `${val}%`,
                            background: (val as number) > 80 ? '#ef4444' : (val as number) > 60 ? '#f59e0b' : '#22c55e'
                          }} />
                        </div>
                        <span className="text-[10px] tabular-nums text-[var(--text-muted)] w-10 text-right">{(val as number).toFixed(0)}%</span>
                      </div>
                    ))}
                    {d.temp && (
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Thermometer size={10} />
                        <span>{d.temp}°C</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                  {d.location && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                      <MapPin size={9} /> {d.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] ml-auto">
                    <Clock size={9} /> {d.lastSeen}
                  </span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </AppShell>
  );
}