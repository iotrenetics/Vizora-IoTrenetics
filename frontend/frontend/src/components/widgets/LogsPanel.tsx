'use client';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogsStore } from '@/store';
import { Card, CardHeader } from '@/components/ui/Card';
import { LEVEL_COLORS } from '@/lib/utils';
import { generateInitialLogs } from '@/services/mockData';
import type { LogEntry } from '@/types';

function LogLine({ log }: { log: LogEntry }) {
  const color = LEVEL_COLORS[log.level];
  const time = new Date(log.ts).toLocaleTimeString('en', { hour12: false });
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-2 font-mono text-[11px] py-1 px-2 hover:bg-[var(--surface-2)] rounded transition-colors"
    >
      <span className="text-[var(--text-muted)] shrink-0 tabular-nums">{time}</span>
      <span className="font-bold uppercase shrink-0 w-10 text-center rounded px-1" style={{ color, background: `${color}18` }}>
        {log.level}
      </span>
      <span className="text-emerald-400/70 shrink-0 hidden sm:inline truncate max-w-[80px]">{log.source}</span>
      <span className="text-[var(--text-primary)] flex-1 leading-relaxed">{log.message}</span>
    </motion.div>
  );
}

export function LogsPanel() {
  const { logs, clearLogs } = useLogsStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);

  // seed initial logs
  const { addLog } = useLogsStore();
  useEffect(() => {
    if (logs.length === 0) {
      generateInitialLogs(30).forEach(l => addLog(l));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userScrolled.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title="Live Logs"
        subtitle="All sources · tailing"
        actions={
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium">LIVE</span>
            <button onClick={clearLogs} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              Clear
            </button>
          </div>
        }
      />
      <div
        ref={scrollRef}
        onScroll={() => { userScrolled.current = (scrollRef.current?.scrollTop ?? 0) > 20; }}
        className="flex-1 overflow-y-auto scrollbar-thin min-h-0 space-y-0.5"
      >
        <AnimatePresence initial={false}>
          {logs.slice(0, 60).map(log => <LogLine key={log.id} log={log} />)}
        </AnimatePresence>
      </div>
    </Card>
  );
}
