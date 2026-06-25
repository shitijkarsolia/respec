'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useRespecStore, useInsightForTarget, useNodeFocusState } from '@/lib/store';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';

const MAX_SUBTASKS = 4;

const statusConfig: Record<Task['status'], { label: string; pillClass: string }> = {
  todo: { label: 'To Do', pillClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' },
  'in-progress': { label: 'In Progress', pillClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  done: { label: 'Done', pillClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

function TaskCardInner({ data }: NodeProps & { data: Task }) {
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const isApproved = approvalStatus === 'approved';
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.id;
  const insight = useInsightForTarget(data.id);
  const { isDimmed, isLinked, isFocus } = useNodeFocusState(data.id);
  const { label, pillClass } = statusConfig[data.status];
  const visibleSubtasks = data.subtasks.slice(0, MAX_SUBTASKS);
  const overflow = data.subtasks.length - MAX_SUBTASKS;

  return (
    <motion.div
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
          : 'border-green-500 dark:border-l-green-400',
        isSelected && !isApproved && 'ring-2 ring-green-500/70 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        isLinked && !isFocus && !isSelected && !isApproved && 'ring-2 ring-green-400/45',
        isDimmed && 'saturate-[0.65]',
        'hover:shadow-[0_10px_22px_-8px_rgba(0,0,0,0.14),0_28px_50px_-18px_rgba(0,0,0,0.22)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-green-500 dark:!border-zinc-900" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-green-500 dark:!border-zinc-900" />

      {/* Approved badge */}
      {isApproved && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] shadow">
          ✓
        </span>
      )}

      {/* Header */}
      <div className="-mx-3 -mt-3 mb-2 flex items-center gap-2 rounded-t-xl bg-gradient-to-r from-green-50 to-transparent px-3 py-2 dark:from-green-950/30">
        <span className="rounded bg-green-100/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
          {data.id}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {insight && !isApproved && (
            <span
              title={insight.message}
              aria-label={`Agent flag: ${insight.message}`}
              className={cn('flex items-center', insight.severity === 'error' ? 'text-red-500' : 'text-amber-500')}
            >
              {insight.severity === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            </span>
          )}
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', pillClass)}>
            {label}
          </span>
        </div>
      </div>

      {/* Subtasks */}
      {visibleSubtasks.length > 0 && (
        <ul className="mb-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          {visibleSubtasks.map((sub, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-400 dark:bg-green-500" />
              <span className="min-w-0">{sub}</span>
            </li>
          ))}
          {overflow > 0 && (
            <li className="pl-2.5 text-zinc-400 dark:text-zinc-500">+{overflow} more</li>
          )}
        </ul>
      )}

      {/* Implements footer */}
      {data.implementsRequirements.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <span className="mr-0.5">Implements</span>
          {data.implementsRequirements.map((reqId) => (
            <span
              key={reqId}
              className="rounded bg-green-100/60 px-1 py-0.5 font-mono font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              {reqId}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export const TaskCard = React.memo(TaskCardInner);
export default TaskCard;
