import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { AppShell } from '@/layouts/AppShell';

export const metadata: Metadata = {
  title: 'Vizora — Next-Gen Observability Platform',
  description: 'Real-time metrics, logs, IoT telemetry and analytics dashboards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}