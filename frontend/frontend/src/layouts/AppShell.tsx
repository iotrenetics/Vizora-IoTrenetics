'use client';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TopNav } from '@/components/navigation/TopNav';
import { useTelemetry } from '@/hooks/useTelemetry';

interface AppShellProps { children: React.ReactNode; }

export function AppShell({ children }: AppShellProps) {
  useTelemetry(1000);

  return (
    <div className="min-h-screen bg-[var(--gf-bg)]">
      <Sidebar />
      <TopNav />
      <main className="ml-[200px] pt-[41px] min-h-screen">
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}