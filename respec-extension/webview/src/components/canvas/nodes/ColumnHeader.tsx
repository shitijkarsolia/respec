'use client';

import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface ColumnHeaderData {
  label: string;
  color: string;
  count: number;
}

function ColumnHeaderInner({ data }: NodeProps & { data: ColumnHeaderData }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 rounded-lg px-4 py-2',
      'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm',
      'border border-zinc-200/50 dark:border-zinc-700/50',
      'shadow-[0_4px_12px_rgba(0,0,0,0.04)]',
      'transition-transform hover:scale-[1.02]',
    )}>
      <span
        className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900"
        style={{ backgroundColor: data.color, boxShadow: `0 0 8px ${data.color}40` }}
      />
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tracking-tight">
        {data.label}
      </span>
      <span
        className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
        style={{
          backgroundColor: `${data.color}15`,
          color: data.color,
        }}
      >
        {data.count}
      </span>
    </div>
  );
}

export const ColumnHeader = React.memo(ColumnHeaderInner);
export default ColumnHeader;
