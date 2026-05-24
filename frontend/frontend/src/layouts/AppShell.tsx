'use client';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { useSidebarStore } from '@/store';
import { useTelemetry } from '@/hooks/useTelemetry';

const W_OPEN = 240;
const W_COLLAPSED = 56;

interface AppShellProps { children: React.ReactNode; }

export function AppShell({ children }: AppShellProps) {
  const { collapsed } = useSidebarStore();
  useTelemetry(1000);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <TopNav />
      <motion.main
        animate={{ marginLeft: collapsed ? W_COLLAPSED : W_OPEN }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ paddingTop: 56, minHeight: '100vh' }}
      >
        <div style={{ padding: '24px 28px', maxWidth: 1600, width: '100%' }}>
          {children}
        </div>
      </motion.main>
    </div>
  );
}