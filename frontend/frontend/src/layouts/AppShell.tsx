'use client';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { useSidebarStore } from '@/store';
import { useTelemetry } from '@/hooks/useTelemetry';

interface AppShellProps { children: React.ReactNode; }

export function AppShell({ children }: AppShellProps) {
  const { collapsed } = useSidebarStore();
  useTelemetry(1000);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <TopNav />
      <motion.main
        animate={{ marginLeft: collapsed ? 64 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pt-14 min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-5"
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  );
}
