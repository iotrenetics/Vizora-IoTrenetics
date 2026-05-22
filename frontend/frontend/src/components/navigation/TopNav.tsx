'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Sun, Moon, ChevronDown,
  Plus, RefreshCw, Share2, Star, User,
  LogOut, Settings, ChevronRight, Zap, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, useAlertsStore, useUserStore, useSidebarStore } from '@/store';
import { MOCK_ALERTS } from '@/services/mockData';

const WORKSPACES = ['Production', 'Staging', 'Development', 'IoT Platform'];
const TIME_PRESETS = ['Last 5m', 'Last 15m', 'Last 1h', 'Last 6h', 'Last 24h', 'Last 7d'];

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore();
  const { alerts } = useAlertsStore();
  const { currentUser, workspace, setWorkspace } = useUserStore();
  const { collapsed } = useSidebarStore();

  const [wsOpen, setWsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('Last 1h');
  const [searchVal, setSearchVal] = useState('');

  const firingAlerts = alerts.filter(a => a.state === 'firing');

  return (
    <header
      className="fixed top-0 right-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-md transition-all duration-300"
      style={{ left: collapsed ? 64 : 220 }}
    >
      {/* Workspace Selector */}
      <div className="relative">
        <button
          onClick={() => setWsOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all text-xs font-medium text-[var(--text-primary)]"
        >
          <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Zap size={8} className="text-white" />
          </div>
          {workspace}
          <ChevronDown size={12} className={cn('text-[var(--text-muted)] transition-transform', wsOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {wsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-1 left-0 w-44 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
            >
              {WORKSPACES.map(ws => (
                <button key={ws} onClick={() => { setWorkspace(ws); setWsOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors',
                    ws === workspace ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                  )}>
                  <ChevronRight size={10} className={cn('opacity-0', ws === workspace && 'opacity-100')} />
                  {ws}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search dashboards, metrics..."
          className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--surface-3)] transition-all"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[9px] text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)] rounded px-1">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Time Range */}
      <div className="relative">
        <button
          onClick={() => setTimeOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all text-xs text-[var(--text-primary)]"
        >
          <Clock size={12} className="text-[var(--text-muted)]" />
          {selectedTime}
          <ChevronDown size={11} className={cn('text-[var(--text-muted)] transition-transform', timeOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {timeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="absolute top-full mt-1 right-0 w-40 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
            >
              {TIME_PRESETS.map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setTimeOpen(false); }}
                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] transition-colors',
                    t === selectedTime ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                  )}>
                  {t}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Refresh */}
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all">
        <RefreshCw size={14} />
      </button>

      {/* Actions */}
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all">
        <Share2 size={14} />
      </button>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-amber-400 hover:bg-[var(--surface-2)] transition-all">
        <Star size={14} />
      </button>

      {/* New dashboard */}
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-all shadow-md shadow-[var(--accent)]/20">
        <Plus size={13} />
        New
      </button>

      {/* Theme */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all relative"
        >
          <Bell size={14} />
          {firingAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="absolute top-full mt-1 right-0 w-80 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Alerts</span>
                <span className="text-[10px] text-[var(--text-muted)]">{firingAlerts.length} firing</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {MOCK_ALERTS.slice(0, 5).map(alert => (
                  <div key={alert.id} className="px-4 py-3 hover:bg-[var(--surface-2)] border-b border-[var(--border)]/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', {
                        'bg-red-400 animate-pulse': alert.state === 'firing',
                        'bg-amber-400': alert.state === 'pending',
                        'bg-emerald-400': alert.state === 'resolved',
                      })} />
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">{alert.name}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2">
                <button className="w-full text-center text-xs text-[var(--accent)] hover:underline py-1">View all alerts</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[var(--surface-2)] transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
            {currentUser?.name?.[0] ?? 'A'}
          </div>
          <ChevronDown size={11} className="text-[var(--text-muted)]" />
        </button>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="absolute top-full mt-1 right-0 w-52 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50"
            >
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{currentUser?.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{currentUser?.email}</p>
                <span className="mt-1 inline-block text-[9px] px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30 uppercase tracking-wider font-bold">
                  {currentUser?.role}
                </span>
              </div>
              {[
                { icon: User, label: 'Profile' },
                { icon: Settings, label: 'Settings' },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
                  <Icon size={13} className="text-[var(--text-muted)]" />
                  {label}
                </button>
              ))}
              <div className="border-t border-[var(--border)]">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
