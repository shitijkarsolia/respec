'use client';

import React from 'react';
import type { NodeProps } from '@xyflow/react';

interface ColumnHeaderData {
  label: string;
  color: string;
  count: number;
}

function ColumnHeaderInner({ data }: NodeProps & { data: ColumnHeaderData }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-l-[3px] px-4 py-2.5 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.18)] backdrop-blur-md"
      style={{
        borderColor: `${data.color}33`,
        borderLeftColor: data.color,
        backgroundColor: `color-mix(in oklab, ${data.color} 10%, var(--card))`,
      }}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: data.color, boxShadow: `0 0 10px ${data.color}80` }}
      />
      <span className="text-[13px] font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
        {data.label}
      </span>
      <span
        className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
        style={{ backgroundColor: data.color }}
      >
        {data.count}
      </span>
    </div>
  );
}

export const ColumnHeader = React.memo(ColumnHeaderInner);
export default ColumnHeader;
