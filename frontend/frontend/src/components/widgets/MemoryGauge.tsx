'use client';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMetricsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function MemoryGauge() {
  const { memory } = useMetricsStore();
  const current = memory[memory.length - 1] ?? 0;
  const isHigh = current > 85;
  const color = isHigh ? '#ef4444' : current > 70 ? '#f59e0b' : '#22c55e';

  const option = useMemo(() => ({
    animation: false,
    backgroundColor: 'transparent',
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0, max: 100,
      radius: '90%',
      center: ['50%', '58%'],
      axisLine: {
        lineStyle: {
          width: 14,
          color: [[current / 100, color], [1, 'rgba(255,255,255,0.06)']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color: 'var(--text-primary)',
        fontSize: 22,
        fontWeight: 'bold',
        offsetCenter: [0, '10%'],
        fontFamily: 'monospace',
      },
      data: [{ value: parseFloat(current.toFixed(1)), name: 'MEM' }],
      title: {
        offsetCenter: [0, '40%'],
        fontSize: 11,
        color: 'var(--text-muted)',
      },
    }],
  }), [current, color]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Memory Usage"
        subtitle="RSS · heap · cached"
        actions={
          <Badge variant={isHigh ? 'critical' : current > 70 ? 'warning' : 'success'} dot>
            {isHigh ? 'pressure' : current > 70 ? 'elevated' : 'healthy'}
          </Badge>
        }
      />
      <div className="flex-1 min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] px-1 pb-1">
        <span>Used: {(current * 0.128).toFixed(1)} GB</span>
        <span>Total: 12.8 GB</span>
      </div>
    </Card>
  );
}
