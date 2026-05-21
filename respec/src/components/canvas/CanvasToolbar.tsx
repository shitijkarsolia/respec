'use client';

import { useEffect, useState } from 'react';
import { useRespecStore, useAnnotationCount } from '@/lib/store';
import Link from 'next/link';
import { Sun, Moon, MessageSquare, Check, AlertTriangle, Clock } from 'lucide-react';

export default function CanvasToolbar() {
  const spec = useRespecStore((s) => s.spec);
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const annotationCount = useAnnotationCount();
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('respec-theme') === 'dark',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      localStorage.setItem('respec-theme', 'dark');
    } else {
      localStorage.setItem('respec-theme', 'light');
    }
  };

  return (
    <div className="h-12 w-full z-40 flex items-center justify-between px-4 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 dark:bg-zinc-900/80 dark:border-zinc-700/50 shrink-0">
      <Link href="/" className="text-lg font-bold">
        Re<span className="text-emerald-600 dark:text-emerald-400">spec</span>
      </Link>

      <span data-tour="status-summary" className="text-sm text-muted-foreground flex items-center gap-3">
        {spec ? `${spec.requirements.length} req · ${spec.design.length} design · ${spec.tasks.length} tasks` : 'Loading...'}
        {annotationCount > 0 && (
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <MessageSquare className="h-3.5 w-3.5" />
            {annotationCount}
          </span>
        )}
        {approvalStatus === 'approved' && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-400">
            <Check className="h-3 w-3" /> Approved
          </span>
        )}
        {approvalStatus === 'changes-requested' && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" /> Changes
          </span>
        )}
        {approvalStatus === 'pending' && annotationCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            <Clock className="h-3 w-3" /> In Review
          </span>
        )}
      </span>

      <div className="flex items-center gap-3">
        <span className="hidden lg:flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 font-mono">Tab</kbd> navigate
          <kbd className="rounded border border-zinc-200 dark:border-zinc-700 px-1 py-0.5 font-mono ml-1">Esc</kbd> deselect
        </span>
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-[0.97]"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
