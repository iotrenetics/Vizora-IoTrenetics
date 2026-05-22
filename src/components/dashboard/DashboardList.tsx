'use client';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/store';
import { Star, Clock, Tag, ExternalLink, MoreHorizontal } from 'lucide-react';
import { cn, relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function DashboardList() {
  const { dashboards, starDashboard } = useDashboardStore();
  const starred = dashboards.filter(d => d.isStarred);
  const recent = dashboards.filter(d => !d.isStarred);

  function DashCard({ d, i }: { d: (typeof dashboards)[0]; i: number }) {
    return (
      <motion.div
        key={d.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <Card hover padding="sm" className="group cursor-pointer">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{d.title}</p>
                {d.refresh && (
                  <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/20 font-medium">
                    {d.refresh}
                  </span>
                )}
              </div>
              {d.description && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{d.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {d.folderTitle && (
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                    <Tag size={9} /> {d.folderTitle}
                  </span>
                )}
                <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Clock size={9} /> {relativeTime(d.updatedAt)}
                </span>
                <div className="flex gap-1">
                  {d.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="muted" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); starDashboard(d.id); }}
                className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                  d.isStarred ? 'text-amber-400 bg-amber-400/15' : 'text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-400/10'
                )}
              >
                <Star size={13} fill={d.isStarred ? 'currentColor' : 'none'} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
                <ExternalLink size={12} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
                <MoreHorizontal size={13} />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {starred.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Star size={12} className="text-amber-400" fill="currentColor" /> Starred
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {starred.map((d, i) => <DashCard key={d.id} d={d} i={i} />)}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
          <Clock size={12} /> Recently Updated
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {recent.map((d, i) => <DashCard key={d.id} d={d} i={i} />)}
        </div>
      </section>
    </div>
  );
}