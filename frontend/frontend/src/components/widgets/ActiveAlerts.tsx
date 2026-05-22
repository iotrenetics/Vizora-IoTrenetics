'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { relativeTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import type { AlertSeverity, AlertState } from '@/types';

const severityVariant: Record<AlertSeverity, 'critical' | 'warning' | 'info' | 'success'> = {
  critical: 'critical', warning: 'warning', info: 'info', success: 'success',
};

const SeverityIcon = ({ severity }: { severity: AlertSeverity }) => {
  const props = { size: 13 };
  if (severity === 'critical') return <XCircle {...props} className="text-red-400" />;
  if (severity === 'warning') return <AlertTriangle {...props} className="text-amber-400" />;
  if (severity === 'info') return <Info {...props} className="text-blue-400" />;
  return <CheckCircle {...props} className="text-emerald-400" />;
};

const stateDot: Record<AlertState, string> = {
  firing: 'bg-red-400 animate-pulse',
  pending: 'bg-amber-400',
  resolved: 'bg-emerald-400',
  nodata: 'bg-gray-500',
};

export function ActiveAlerts() {
  const { alerts, acknowledgeAlert } = useAlertsStore();
  const sorted = [...alerts].sort((a, b) => {
    const order: Record<AlertState, number> = { firing: 0, pending: 1, resolved: 2, nodata: 3 };
    return order[a.state] - order[b.state];
  });

  const firingCount = alerts.filter(a => a.state === 'firing').length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Active Alerts"
        subtitle="All datasources"
        actions={
          firingCount > 0 ? (
            <Badge variant="critical" dot>{firingCount} firing</Badge>
          ) : (
            <Badge variant="success" dot>All clear</Badge>
          )
        }
      />
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-0">
        <AnimatePresence>
          {sorted.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-start gap-3 p-2.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)] cursor-pointer"
            >
              <div className="pt-0.5 shrink-0">
                <SeverityIcon severity={alert.severity} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stateDot[alert.state]}`} />
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{alert.name}</p>
                  <Badge variant={severityVariant[alert.severity]} className="ml-auto shrink-0">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{alert.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {alert.firedAt ? relativeTime(alert.firedAt) : ''}
                    {alert.value !== undefined && ` · ${alert.value.toFixed(1)}% (threshold: ${alert.threshold}%)`}
                  </span>
                  {alert.state === 'firing' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id); }}
                      className="text-[10px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
