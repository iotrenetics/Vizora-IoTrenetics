'use client';
import { useRef } from 'react';
import {
  GridLayout,
  useContainerWidth,
  useResponsiveLayout,
  type Layout,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store';
import { CpuChart }     from '@/components/widgets/CpuChart';
import { MemoryGauge }  from '@/components/widgets/MemoryGauge';
import { NetworkChart } from '@/components/widgets/NetworkChart';
import { DeviceStatus } from '@/components/widgets/DeviceStatus';
import { ActiveAlerts } from '@/components/widgets/ActiveAlerts';
import { LogsPanel }    from '@/components/widgets/LogsPanel';
import { MqttStats }    from '@/components/widgets/MqttStats';
import { GripVertical, Lock, Unlock } from 'lucide-react';

// ── Widget registry ───────────────────────────
const WIDGET_MAP: Record<string, React.FC> = {
  cpu:     CpuChart,
  memory:  MemoryGauge,
  network: NetworkChart,
  devices: DeviceStatus,
  alerts:  ActiveAlerts,
  logs:    LogsPanel,
  mqtt:    MqttStats,
};

// ── Default layouts per breakpoint ───────────
const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: 'cpu',     x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'memory',  x: 5, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
    { i: 'network', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'devices', x: 0, y: 4, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'alerts',  x: 4, y: 4, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'logs',    x: 8, y: 4, w: 4, h: 5, minW: 3, minH: 4 },
    { i: 'mqtt',    x: 0, y: 9, w: 3, h: 4, minW: 2, minH: 3 },
  ],
  md: [
    { i: 'cpu',     x: 0, y: 0,  w: 6, h: 4 },
    { i: 'memory',  x: 6, y: 0,  w: 4, h: 4 },
    { i: 'network', x: 0, y: 4,  w: 6, h: 4 },
    { i: 'devices', x: 6, y: 4,  w: 4, h: 5 },
    { i: 'alerts',  x: 0, y: 8,  w: 5, h: 5 },
    { i: 'logs',    x: 5, y: 8,  w: 5, h: 5 },
    { i: 'mqtt',    x: 0, y: 13, w: 4, h: 4 },
  ],
  sm: [
    { i: 'cpu',     x: 0, y: 0,  w: 6, h: 4 },
    { i: 'memory',  x: 0, y: 4,  w: 6, h: 4 },
    { i: 'network', x: 0, y: 8,  w: 6, h: 4 },
    { i: 'devices', x: 0, y: 12, w: 6, h: 5 },
    { i: 'alerts',  x: 0, y: 17, w: 6, h: 5 },
    { i: 'logs',    x: 0, y: 22, w: 6, h: 5 },
    { i: 'mqtt',    x: 0, y: 27, w: 6, h: 4 },
  ],
};

const BREAKPOINTS = { lg: 1200, md: 996, sm: 0 };
const COLS        = { lg: 12,   md: 10,  sm: 6 };

// ── Responsive grid inner (needs measured width) ──
function InnerGrid({ isEditing }: { isEditing: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width, mounted } = useContainerWidth({ initialWidth: 1280 });

  const { layout, cols, setLayoutForBreakpoint, breakpoint } = useResponsiveLayout({
    width,
    breakpoints: BREAKPOINTS,
    cols: COLS,
    layouts: DEFAULT_LAYOUTS,
  });

  const handleLayoutChange = (newLayout: Layout) => {
    setLayoutForBreakpoint(breakpoint, newLayout);
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-[var(--surface-2)]" />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <GridLayout
        width={width}
        layout={layout}
        gridConfig={{
          cols,
          rowHeight: 56,
          margin: [12, 12],
          containerPadding: [0, 0],
        }}
        dragConfig={{
          enabled: isEditing,
          handle: '.drag-handle',
          bounded: false,
          threshold: 3,
        }}
        resizeConfig={{
          enabled: isEditing,
          handles: ['se'],
        }}
        onLayoutChange={handleLayoutChange}
        autoSize
      >
        {Object.entries(WIDGET_MAP).map(([key, Widget]) => (
          <div key={key} className="relative overflow-hidden rounded-xl group/widget">
            {isEditing && (
              <div className="drag-handle absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-muted)] cursor-grab active:cursor-grabbing shadow-md opacity-80 hover:opacity-100 transition-opacity">
                <GripVertical size={12} />
              </div>
            )}
            <div className="h-full">
              <Widget />
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}

// ── Public export ────────────────────────────
export function WidgetGrid() {
  const { isEditing, setEditing } = useDashboardStore();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            System Overview
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Live · Production cluster · 7 panels
          </p>
        </div>
        <button
          onClick={() => setEditing(!isEditing)}
          className={[
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            isEditing
              ? 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]',
          ].join(' ')}
        >
          {isEditing ? <Unlock size={12} /> : <Lock size={12} />}
          {isEditing ? 'Exit Edit' : 'Edit Layout'}
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <InnerGrid isEditing={isEditing} />
      </motion.div>

      {/* Scoped global overrides for RGL */}
      <style jsx global>{`
        .react-grid-item.react-grid-placeholder {
          background: var(--accent) !important;
          opacity: 0.12 !important;
          border-radius: 12px !important;
        }
        .react-resizable-handle::after {
          border-color: var(--text-muted) !important;
          opacity: 0.4;
        }
        .react-resizable-handle:hover::after {
          border-color: var(--accent) !important;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
