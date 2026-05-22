'use client';
import { motion } from 'framer-motion';
import { AppShell } from '@/layouts/AppShell';
import { useAlertsStore } from '@/store';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { relativeTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Bell, XCircle, Info } from 'lucide-react';
import type { AlertSeverity, AlertState } from '@/types';

const STATE_CONFIG: Record<AlertState, { label: string; class: string }> = {
  firing:   { label: 'Firing',   class: 'text-red-400' },
  pending:  { label: 'Pending',  class: 'text-amber-400' },
  resolved: { label: 'Resolved', class: 'text-emerald-400' },
  nodata:   { label: 'No Data',  class: 'text-gray-400' },
};

const SevIcon = ({ s }: { s: AlertSeverity }) => {
  if (s === 'critical') return <XCircle size={14} className="text-red-400" />;
  if (s === 'warning')  return <AlertTriangle size={14} className="text-amber-400" />;
  if (s === 'info')     return <Info size={14} className="text-blue-400" />;
  return <CheckCircle size={14} className="text-emerald-400" />;
};

export default function AlertsPage() {
  const { alerts, acknowledgeAlert } = useAlertsStore();
  const firing   = alerts.filter(a => a.state === 'firing');
  const pending  = alerts.filter(a => a.state === 'pending');
  const resolved = alerts.filter(a => a.state === 'resolved');

  return (
    <AppShell>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Alerting</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Monitor, manage and silence alert rules</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <Bell size={13} className="text-red-400" />
            <span className="text-xs font-bold text-red-400">{firing.length} Firing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400">{pending.length} Pending</span>
          </div>
        </div>
      </div>

      {[
        { title: 'Firing', items: firing, dot: 'bg-red-400 animate-pulse' },
        { title: 'Pending', items: pending, dot: 'bg-amber-400' },
        { title: 'Resolved', items: resolved, dot: 'bg-emerald-400' },
      ].map(({ title, items, dot }) => items.length > 0 && (
        <section key={title} className="mb-6">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            {title} · {items.length}
          </h2>
          <div className="space-y-2">
            {items.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card padding="sm" hover className="group">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5"><SevIcon s={alert.severity} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{alert.name}</span>
                        <Badge variant={alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}>
                          {alert.severity}
                        </Badge>
                        <span className={`text-xs font-medium ml-auto ${STATE_CONFIG[alert.state].class}`}>
                          {STATE_CONFIG[alert.state].label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{alert.message}</p>
                      {alert.labels && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {Object.entries(alert.labels).map(([k, v]) => (
                            <span key={k} className="text-[10px] font-mono px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                              {k}=<span className="text-[var(--text-primary)]">{v}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {alert.firedAt ? `Fired ${relativeTime(alert.firedAt)}` : ''}
                          {alert.value !== undefined ? ` · Value: ${alert.value.toFixed(1)}%` : ''}
                        </span>
                        {alert.state === 'firing' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}
