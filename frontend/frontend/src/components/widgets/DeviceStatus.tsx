'use client';
import { motion } from 'framer-motion';
import { useMetricsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';
import { cn, STATUS_COLORS } from '@/lib/utils';
import { Wifi, WifiOff, AlertTriangle, Thermometer } from 'lucide-react';

const statusIcon = { online: Wifi, offline: WifiOff, warning: AlertTriangle };

export function DeviceStatus() {
  const { deviceMetrics } = useMetricsStore();
  const online = deviceMetrics.filter(d => d.status === 'online').length;
  const total = deviceMetrics.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Device Status"
        subtitle="MQTT · IoT nodes"
        actions={
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-[var(--text-primary)] tabular-nums">{online}</span>
            <span className="text-[var(--text-muted)]">/{total} online</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-0">
        {deviceMetrics.map((device, i) => {
          const Icon = statusIcon[device.status];
          const color = STATUS_COLORS[device.status];
          return (
            <motion.div
              key={device.deviceId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{device.deviceName}</p>
                  <span className={cn('text-[10px] font-semibold capitalize', {
                    'text-emerald-400': device.status === 'online',
                    'text-red-400': device.status === 'offline',
                    'text-amber-400': device.status === 'warning',
                  })}>
                    {device.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {device.status !== 'offline' && (
                    <>
                      <MiniBar label="CPU" value={device.cpu} />
                      <MiniBar label="MEM" value={device.memory} />
                      {device.temp !== undefined && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                          <Thermometer size={8} />
                          {device.temp}°C
                        </span>
                      )}
                    </>
                  )}
                  {device.status === 'offline' && (
                    <span className="text-[10px] text-[var(--text-muted)]">Last seen: {device.lastSeen}</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  const color = value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-[var(--text-muted)]">{label}</span>
      <div className="w-12 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[9px] tabular-nums" style={{ color }}>{value.toFixed(0)}%</span>
    </div>
  );
}
