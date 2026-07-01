'use client';

import { Panel } from '@xyflow/react';

const items: { label: string; swatch: string; color: string }[] = [
  { label: 'Implements', swatch: 'linear-gradient(90deg,#059669,#34d399)', color: 'text-emerald-700 dark:text-emerald-400' },
  { label: 'Depends on', swatch: 'repeating-linear-gradient(90deg,#f59e0b 0 3px,transparent 3px 8px)', color: 'text-amber-700 dark:text-amber-400' },
  { label: 'Conflicts', swatch: 'repeating-linear-gradient(90deg,#ef4444 0 7px,transparent 7px 11px)', color: 'text-red-700 dark:text-red-400' },
];

export function EdgeLegend() {
  return (
    <Panel position="top-right" className="!m-3 hidden sm:block">
      <div
        role="note"
        aria-label="Cross-link legend: solid green line means implements, dotted amber means depends on, dashed red means conflicts"
        className="flex items-center gap-3 rounded-lg border border-zinc-200/70 bg-white/85 px-3 py-1.5 text-[11px] shadow-lg backdrop-blur-md dark:border-zinc-700/70 dark:bg-zinc-900/85"
      >
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="h-[2px] w-5 shrink-0 rounded-full" style={{ backgroundImage: item.swatch }} />
            <span className={item.color}>{item.label}</span>
          </span>
        ))}
      </div>
    </Panel>
  );
}

export default EdgeLegend;
