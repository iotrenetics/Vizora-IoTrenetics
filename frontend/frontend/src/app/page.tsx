'use client';
import { AppShell } from '@/layouts/AppShell';
import { WidgetGrid } from '@/components/dashboard/WidgetGrid';
import { DashboardList } from '@/components/dashboard/DashboardList';
import { StatTile } from '@/components/ui/StatTile';
import { useMetricsStore, useAlertsStore } from '@/store';
import { Activity, Bell, Cpu, Wifi } from 'lucide-react';

export default function HomePage() {
  const { cpu, memory, deviceMetrics } = useMetricsStore();
  const { alerts } = useAlertsStore();

  const curCpu = cpu[cpu.length - 1] ?? 0;
  const curMem = memory[memory.length - 1] ?? 0;
  const online = deviceMetrics.filter(d => d.status === 'online').length;
  const firing = alerts.filter(a => a.state === 'firing').length;

  return (
    <AppShell>
      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile
          label="CPU Usage"
          value={curCpu.toFixed(1)}
          unit="%"
          icon={<Cpu size={14} />}
          accent="#6366f1"
          sparkline={cpu.slice(-20)}
          change={curCpu - (cpu[cpu.length - 10] ?? curCpu)}
          trend={curCpu > 80 ? 'up' : 'flat'}
        />
        <StatTile
          label="Memory"
          value={curMem.toFixed(1)}
          unit="%"
          icon={<Activity size={14} />}
          accent="#22d3ee"
          sparkline={memory.slice(-20)}
          change={curMem - (memory[memory.length - 10] ?? curMem)}
          trend={curMem > 85 ? 'up' : 'flat'}
        />
        <StatTile
          label="Devices Online"
          value={online}
          unit={`/${deviceMetrics.length}`}
          icon={<Wifi size={14} />}
          accent="#22c55e"
          trend="flat"
        />
        <StatTile
          label="Active Alerts"
          value={firing}
          icon={<Bell size={14} />}
          accent={firing > 0 ? '#ef4444' : '#22c55e'}
          trend={firing > 0 ? 'up' : 'flat'}
        />
      </div>

      {/* Live widget grid */}
      <div className="mb-8">
        <WidgetGrid />
      </div>

      {/* Dashboard browser */}
      <DashboardList />
    </AppShell>
  );
}
