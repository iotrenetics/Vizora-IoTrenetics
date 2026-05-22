'use client';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMetricsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';

export function MqttStats() {
  const { deviceMetrics } = useMetricsStore();
  const online = deviceMetrics.filter(d => d.status === 'online').length;
  const warning = deviceMetrics.filter(d => d.status === 'warning').length;
  const offline = deviceMetrics.filter(d => d.status === 'offline').length;
  const total = deviceMetrics.length;

  const option = useMemo(() => ({
    animation: true,
    backgroundColor: 'transparent',
    series: [{
      type: 'pie',
      radius: ['52%', '78%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary)' },
      },
      data: [
        { value: online, name: 'Online', itemStyle: { color: '#22c55e' } },
        { value: warning, name: 'Warning', itemStyle: { color: '#f59e0b' } },
        { value: offline, name: 'Offline', itemStyle: { color: '#ef4444' } },
      ],
    }],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--surface-3)',
      borderColor: 'var(--border)',
      textStyle: { color: 'var(--text-primary)', fontSize: 11 },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      itemWidth: 8, itemHeight: 8,
      borderRadius: 4,
      textStyle: { color: 'var(--text-muted)', fontSize: 10 },
    },
  }), [online, warning, offline]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="MQTT Fleet"
        subtitle="Device health overview"
        actions={
          <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{total}</span>
        }
      />
      <div className="flex-1 min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
    </Card>
  );
}