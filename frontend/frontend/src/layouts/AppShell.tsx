'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { useSidebarStore, useAuthStore } from '@/store';
import { useTelemetry } from '@/hooks/useTelemetry';

const W_OPEN      = 240;
const W_COLLAPSED = 56;

const PUBLIC_ROUTES = ['/login'];

interface AppShellProps { children: React.ReactNode; }

export function AppShell({ children }: AppShellProps) {
  const { collapsed }  = useSidebarStore();
  const { isLoggedIn } = useAuthStore();
  const router         = useRouter();
  const pathname       = usePathname();
  useTelemetry(1000);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  /* ── Auth guard: redirect to /login if not authenticated ── */
  useEffect(() => {
    if (!isLoggedIn && !isPublic) {
      router.replace('/login');
    }
  }, [isLoggedIn, isPublic, router]);

  /* ── Public routes (login): render children with NO shell ── */
  if (isPublic) {
    return <>{children}</>;
  }

  /* ── Not yet authenticated on a protected route: render nothing ── */
  if (!isLoggedIn) return null;

  /* ── Authenticated: render full shell ── */
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