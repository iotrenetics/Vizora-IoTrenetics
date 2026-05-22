'use client';
import { AppShell } from '@/layouts/AppShell';
import { CpuChart } from '@/components/widgets/CpuChart';
import { MemoryGauge } from '@/components/widgets/MemoryGauge';
import { NetworkChart } from '@/components/widgets/NetworkChart';
import { StatTile } from '@/components/ui/StatTile';
import { useMetricsStore } from '@/store';
import { Activity, Cpu, Network, Server } from 'lucide-react';

export default function MetricsPage() {
  const { cpu, memory, network } = useMetricsStore();
  const curCpu = cpu[cpu.length - 1] ?? 0;
  const curMem = memory[memory.length - 1] ?? 0;
  const curRx = network.rx[network.rx.length - 1] ?? 0;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Metrics Explorer</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Real-time system and application metrics from all datasources</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatTile label="CPU" value={curCpu.toFixed(1)} unit="%" icon={<Cpu size={14} />} accent="#6366f1" sparkline={cpu.slice(-20)} />
        <StatTile label="Memory" value={curMem.toFixed(1)} unit="%" icon={<Activity size={14} />} accent="#22d3ee" sparkline={memory.slice(-20)} />
        <StatTile label="Network RX" value={curRx.toFixed(0)} unit="B/s" icon={<Network size={14} />} accent="#22c55e" />
        <StatTile label="Uptime" value="99.94" unit="%" icon={<Server size={14} />} accent="#f59e0b" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64"><CpuChart /></div>
        <div className="h-64"><MemoryGauge /></div>
        <div className="h-64 lg:col-span-2"><NetworkChart /></div>
      </div>
    </AppShell>
  );
}
