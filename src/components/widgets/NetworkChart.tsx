'use client';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useMetricsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';

export function NetworkChart() {
  const { network, timestamps } = useMetricsStore();
  const rx = network.rx;
  const tx = network.tx;
  const curRx = rx[rx.length - 1] ?? 0;
  const curTx = tx[tx.length - 1] ?? 0;

  const option = useMemo(() => ({
    animation: false,
    backgroundColor: 'transparent',
    legend: {
      top: 0, right: 0,
      itemWidth: 10, itemHeight: 10,
      textStyle: { color: 'var(--text-muted)', fontSize: 10 },
    },
    grid: { top: 28, right: 12, bottom: 24, left: 42 },
    xAxis: {
      type: 'category',
      data: timestamps.map(t => new Date(t).toLocaleTimeString()),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10, formatter: (v: number) => `${v.toFixed(0)}` },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
    },
    series: [
      {
        name: 'RX',
        type: 'line',
        data: rx,
        smooth: 0.5,
        symbol: 'none',
        lineStyle: { color: '#22d3ee', width: 1.5 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(34,211,238,0.25)' }, { offset: 1, color: 'rgba(0,0,0,0)' }] },
        },
      },
      {
        name: 'TX',
        type: 'line',
        data: tx,
        smooth: 0.5,
        symbol: 'none',
        lineStyle: { color: '#a78bfa', width: 1.5 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(167,139,250,0.2)' }, { offset: 1, color: 'rgba(0,0,0,0)' }] },
        },
      },
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--surface-3)',
      borderColor: 'var(--border)',
      textStyle: { color: 'var(--text-primary)', fontSize: 11 },
    },
  }), [rx, tx, timestamps]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Network I/O"
        subtitle="Bytes per second"
        actions={
          <div className="flex items-center gap-3 text-xs tabular-nums">
            <span className="text-cyan-400">↓ {curRx.toFixed(0)}</span>
            <span className="text-violet-400">↑ {curTx.toFixed(0)}</span>
          </div>
        }
      />
      <div className="flex-1 min-h-0">
        <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge />
      </div>
    </Card>
  );
}