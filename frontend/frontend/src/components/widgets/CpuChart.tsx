'use client';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMetricsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';
import { CHART_COLORS } from '@/lib/utils';
import { Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function CpuChart() {
  const { cpu, timestamps } = useMetricsStore();
  const current = cpu[cpu.length - 1] ?? 0;
  const isHigh = current > 80;

  const option = useMemo(() => ({
    animation: false,
    backgroundColor: 'transparent',
    grid: { top: 8, right: 8, bottom: 24, left: 40 },
    xAxis: {
      type: 'category',
      data: timestamps.map(t => new Date(t).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0, max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
    },
    series: [{
      type: 'line',
      data: cpu,
      smooth: 0.4,
      symbol: 'none',
      lineStyle: { color: isHigh ? '#ef4444' : CHART_COLORS.primary, width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isHigh ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)' },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ],
        },
      },
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--surface-3)',
      borderColor: 'var(--border)',
      textStyle: { color: 'var(--text-primary)', fontSize: 11 },
      formatter: (params: { value: number }[]) => `CPU: ${params[0].value.toFixed(1)}%`,
    },
  }), [cpu, timestamps, isHigh]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="CPU Usage"
        subtitle="All cores · avg"
        actions={
          <div className="flex items-center gap-2">
            <span className={`text-xl font-bold tabular-nums ${isHigh ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
              {current.toFixed(1)}%
            </span>
            <Badge variant={isHigh ? 'critical' : current > 60 ? 'warning' : 'success'} dot>
              {isHigh ? 'high' : current > 60 ? 'moderate' : 'normal'}
            </Badge>
          </div>
        }
      />
      <div className="flex-1 min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
    </Card>
  );
}
