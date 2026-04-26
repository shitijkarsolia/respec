'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Task } from '@/lib/types';
import { useRespecStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const MAX_SUBTASKS = 4;

const statusConfig: Record<Task['status'], { label: string; pillClass: string }> = {
  todo: { label: 'To Do', pillClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' },
  'in-progress': { label: 'In Progress', pillClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse' },
  done: { label: 'Done', pillClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

function TaskCardInner({ data }: NodeProps & { data: Task }) {
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const isApproved = approvalStatus === 'approved';
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.id;
  const { label, pillClass } = statusConfig[data.status];
  const visibleSubtasks = data.subtasks.slice(0, MAX_SUBTASKS);
  const overflow = data.subtasks.length - MAX_SUBTASKS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        'relative rounded-lg border-l-4 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:bg-zinc-900 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] dark:border dark:border-zinc-800',
        isApproved
          ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 ring-1 ring-green-200 dark:ring-green-800'
          : 'border-green-500 dark:border-l-green-400',
        isSelected && !isApproved && 'ring-2 ring-green-500/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        'min-w-[300px] max-w-[360px] p-3',
        'transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-green-500" />
      <Handle type="source" position={Position.Right} className="!bg-green-500" />

      {/* Approved badge */}
      {isApproved && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] shadow">
          ✓
        </span>
      )}

      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg -mx-3 -mt-3 px-3 py-2 mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {data.id}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
        </span>
        <span className={cn('ml-auto shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', pillClass)}>
          {label}
        </span>
      </div>

      {/* Subtasks */}
      {visibleSubtasks.length > 0 && (
        <ul className="mb-2 space-y-0.5 pl-5 text-xs text-zinc-600 dark:text-zinc-400">
          {visibleSubtasks.map((sub, i) => (
            <li key={i} className="list-disc">
              {sub}
            </li>
          ))}
          {overflow > 0 && (
            <li className="list-none text-zinc-400 dark:text-zinc-500">
              +{overflow} more
            </li>
          )}
        </ul>
      )}

      {/* Implements footer */}
      {data.implementsRequirements.length > 0 && (
        <div className="border-t border-zinc-100 pt-1.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          Implements:{' '}
          {data.implementsRequirements.map((reqId, i) => (
            <span key={reqId}>
              <span className="font-medium text-green-600 dark:text-green-400">
                {reqId}
              </span>
              {i < data.implementsRequirements.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export const TaskCard = React.memo(TaskCardInner);
export default TaskCard;
