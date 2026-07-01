'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { Requirement } from '@/lib/types';
import { useRespecStore, useInsightForTarget, useNodeFocusState } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

const priorityColor: Record<Requirement['priority'], string> = {
  must: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  should: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  could: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

const EMPTY_ANNOTATIONS: never[] = [];

function EarsCardInner({ data }: NodeProps & { data: Requirement }) {
  const annotations = useRespecStore((s) => s.annotations[data.id] ?? EMPTY_ANNOTATIONS);
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const isApproved = approvalStatus === 'approved';
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.id;
  const insight = useInsightForTarget(data.id);
  const { isDimmed, isLinked, isFocus } = useNodeFocusState(data.id);

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
      role="button"
      aria-current={isSelected ? true : undefined}
      aria-label={`${data.id}, ${data.priority} requirement. ${data.trigger} the system shall ${data.response}.${insight ? ` Agent flag: ${insight.message}.` : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDimmed ? 0.4 : 1, y: 0 }}
      transition={spring.smooth}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.995 }}
      className={cn(
        'group relative cursor-pointer rounded-xl border-l-4 bg-white p-3 dark:bg-zinc-900 dark:border dark:border-zinc-800',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_14px_34px_-14px_rgba(0,0,0,0.7)]',
        'transition-[box-shadow,filter,opacity] duration-200',
        'min-w-[300px] max-w-[360px]',
        isApproved
          ? 'border-green-500 ring-1 ring-green-200 dark:ring-green-800'
          : 'border-emerald-600 dark:border-l-emerald-500',
        isSelected && !isApproved && 'ring-2 ring-emerald-500/70 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        isLinked && !isFocus && !isSelected && !isApproved && 'ring-2 ring-emerald-400/45',
        isDimmed && 'saturate-[0.65]',
        'hover:shadow-[0_10px_22px_-8px_rgba(0,0,0,0.14),0_28px_50px_-18px_rgba(0,0,0,0.22)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-600 dark:!border-zinc-900" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-600 dark:!border-zinc-900" />

      {/* Header */}
      <div className="-mx-3 -mt-3 mb-2 flex items-center justify-between gap-2 rounded-t-xl bg-gradient-to-r from-emerald-50 to-transparent px-3 py-2 dark:from-emerald-950/30">
        <span className="rounded bg-emerald-100/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {data.id}
        </span>
        <div className="flex items-center gap-1.5">
          {insight && !isApproved && (
            <span
              title={insight.message}
              aria-label={`Agent flag: ${insight.message}`}
              className={cn('flex items-center', insight.severity === 'error' ? 'text-red-500' : 'text-amber-500')}
            >
              {insight.severity === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            </span>
          )}
          {annotations.length > 0 && (
            <span className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 px-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 transition-transform',
              pulse && 'animate-[ping_0.5s_ease-out_1] scale-110'
            )}>
              {annotations.length}
            </span>
          )}
          <Badge className={cn('border-0 text-[10px] uppercase', priorityColor[data.priority])}>
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
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3 group-hover:line-clamp-none transition-all cursor-default">
        <span className="inline-flex bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
          {data.type}
        </span>{' '}
        {data.trigger}{' '}
        <span className="font-semibold text-emerald-600/80 dark:text-emerald-400/80 text-xs uppercase tracking-wide">
          the system shall
        </span>{' '}
        {data.response}
      </p>
    </motion.div>
  );
}

export const EarsCard = React.memo(EarsCardInner);
export default EarsCard;
