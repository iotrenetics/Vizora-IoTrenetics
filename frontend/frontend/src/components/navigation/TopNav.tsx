'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Sun, Moon, ChevronDown,
  Plus, RefreshCw, Share2, Star, User,
  LogOut, Settings, ChevronRight, Zap, Clock, HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore, useAlertsStore, useUserStore } from '@/store';
import { MOCK_ALERTS } from '@/services/mockData';

const TIME_PRESETS = ['Last 5m', 'Last 15m', 'Last 1h', 'Last 6h', 'Last 24h', 'Last 7d'];

export function TopNav() {
  const { theme, toggleTheme } = useThemeStore();
  const { alerts } = useAlertsStore();
  const { currentUser } = useUserStore();

  const [notifOpen, setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [timeOpen, setTimeOpen]     = useState(false);
  const [selectedTime, setSelectedTime] = useState('Last 1h');
  const [searchVal, setSearchVal]   = useState('');

  const firingAlerts = alerts.filter(a => a.state === 'firing');

  return (
    <header
      className="fixed top-0 left-[200px] right-0 z-30 h-[41px] flex items-center gap-1.5 px-3 border-b border-[var(--gf-border)] bg-[var(--gf-topnav)]"
    >
      {/* Breadcrumb / page title */}
      <nav className="flex items-center gap-1 text-sm text-[var(--gf-text-secondary)] mr-2">
        <span className="hover:text-[var(--gf-text)] cursor-pointer">Dashboards</span>
      </nav>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gf-text-muted)]" />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search..."
          className="w-full pl-7 pr-14 py-1 bg-[var(--gf-input)] border border-[var(--gf-border)] rounded text-[13px] text-[var(--gf-text)] placeholder:text-[var(--gf-text-muted)] focus:outline-none focus:border-[var(--gf-accent)] transition-all"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--gf-text-muted)] bg-[var(--gf-surface)] border border-[var(--gf-border)] rounded px-1">
          ctrl+k
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Time Range */}
      <div className="relative">
        <button
          onClick={() => setTimeOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--gf-border)] bg-[var(--gf-input)] hover:border-[var(--gf-accent)]/60 transition-all text-[13px] text-[var(--gf-text)]"
        >
          <Clock size={13} className="text-[var(--gf-text-muted)]" />
          {selectedTime}
          <ChevronDown size={11} className={cn('text-[var(--gf-text-muted)] transition-transform', timeOpen && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {timeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full mt-1 right-0 w-36 bg-[var(--gf-surface)] border border-[var(--gf-border)] rounded shadow-xl overflow-hidden z-50"
            >
              {TIME_PRESETS.map(t => (
                <button key={t} onClick={() => { setSelectedTime(t); setTimeOpen(false); }}
                  className={cn('w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--gf-hover)] transition-colors',
                    t === selectedTime ? 'text-[var(--gf-accent)]' : 'text-[var(--gf-text)]'
                  )}>
                  {t}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Refresh */}
      <button className="gf-icon-btn" title="Refresh">
        <RefreshCw size={15} />
      </button>

      {/* New dashboard */}
      <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--gf-accent)] text-white text-[13px] font-medium hover:opacity-90 transition-all">
        <Plus size={14} />
        New
      </button>

      {/* Theme */}
      <button onClick={toggleTheme} className="gf-icon-btn" title="Toggle theme">
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Help */}
      <button className="gf-icon-btn" title="Help">
        <HelpCircle size={15} />
      </button>

      {/* Notifications */}
      <div className="relative">
        <button onClick={() => setNotifOpen(v => !v)} className="gf-icon-btn relative" title="Alerts">
          <Bell size={15} />
          {firingAlerts.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full mt-1 right-0 w-72 bg-[var(--gf-surface)] border border-[var(--gf-border)] rounded shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-[var(--gf-border)] flex justify-between items-center">
                <span className="text-[13px] font-semibold text-[var(--gf-text)]">Alerts</span>
                <span className="text-[11px] text-[var(--gf-text-muted)]">{firingAlerts.length} firing</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {MOCK_ALERTS.slice(0, 5).map(alert => (
                  <div key={alert.id} className="px-3 py-2.5 hover:bg-[var(--gf-hover)] border-b border-[var(--gf-border)]/40 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', {
                        'bg-red-400': alert.state === 'firing',
                        'bg-amber-400': alert.state === 'pending',
                        'bg-green-400': alert.state === 'resolved',
                      })} />
                      <div>
                        <p className="text-[13px] font-medium text-[var(--gf-text)]">{alert.name}</p>
                        <p className="text-[11px] text-[var(--gf-text-muted)] mt-0.5 line-clamp-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-2">
                <button className="w-full text-center text-[13px] text-[var(--gf-accent)] hover:underline">
                  View all alerts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => setProfileOpen(v => !v)}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300 flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-all"
        >
          {currentUser?.name?.[0] ?? 'A'}
        </button>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full mt-1 right-0 w-48 bg-[var(--gf-surface)] border border-[var(--gf-border)] rounded shadow-xl overflow-hidden z-50"
            >
              <div className="px-3 py-2.5 border-b border-[var(--gf-border)]">
                <p className="text-[13px] font-semibold text-[var(--gf-text)]">{currentUser?.name}</p>
                <p className="text-[11px] text-[var(--gf-text-muted)]">{currentUser?.email}</p>
              </div>
              {[{ icon: User, label: 'Profile' }, { icon: Settings, label: 'Settings' }].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[var(--gf-text)] hover:bg-[var(--gf-hover)] transition-colors">
                  <Icon size={14} className="text-[var(--gf-text-muted)]" />
                  {label}
                </button>
              ))}
              <div className="border-t border-[var(--gf-border)]">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={14} />
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