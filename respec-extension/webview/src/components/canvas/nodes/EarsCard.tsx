'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Requirement } from '@/lib/types';
import { useRespecStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const priorityColor: Record<Requirement['priority'], string> = {
  must: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  should: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  could: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

const EMPTY_ANNOTATIONS: never[] = [];

function EarsCardInner({ data, id }: NodeProps & { data: Requirement }) {
  const annotations = useRespecStore((s) => s.annotations[data.id] ?? EMPTY_ANNOTATIONS);
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const isApproved = approvalStatus === 'approved';
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.id;

  const prevCount = useRef(annotations.length);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (annotations.length > prevCount.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
    prevCount.current = annotations.length;
  }, [annotations.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        'relative rounded-lg border-l-4 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:bg-zinc-900 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] dark:border dark:border-zinc-800',
        isApproved
          ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 ring-1 ring-green-200 dark:ring-green-800'
          : 'border-emerald-600 dark:border-l-emerald-500',
        isSelected && !isApproved && 'ring-2 ring-emerald-500/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        'min-w-[300px] max-w-[360px] p-3',
        'transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-emerald-600" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-600" />

      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg -mx-3 -mt-3 px-3 py-2 mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {data.id}
        </span>
        <div className="flex items-center gap-1.5">
          {annotations.length > 0 && (
            <span className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 px-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 transition-transform',
              pulse && 'animate-[ping_0.5s_ease-out_1] scale-110'
            )}>
              {annotations.length}
            </span>
          )}
          <Badge
            className={cn(
              'border-0 text-[10px] uppercase',
              priorityColor[data.priority],
            )}
          >
            {data.priority}
          </Badge>
        </div>
      </div>

      {/* Approved badge */}
      {isApproved && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] shadow">
          ✓
        </span>
      )}

      {/* Flagged indicator */}
      {data.status === 'flagged' && (
        <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
      )}

      {/* EARS body */}
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
        <span className="inline-flex bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-xs font-semibold">
          {data.type}
        </span>{' '}
        {data.trigger}{' '}
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wide">
          the system shall
        </span>{' '}
        {data.response}
      </p>
    </motion.div>
  );
}

export const EarsCard = React.memo(EarsCardInner);
export default EarsCard;
