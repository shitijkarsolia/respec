'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { Task } from '@/lib/types';
import { cn } from '@/lib/utils';

const MAX_SUBTASKS = 4;

const statusConfig: Record<Task['status'], { icon: string; color: string }> = {
  todo: { icon: '□', color: 'text-zinc-400' },
  'in-progress': { icon: '●', color: 'text-amber-500' },
  done: { icon: '☑', color: 'text-green-500' },
};

function TaskCardInner({ data }: NodeProps & { data: Task }) {
  const { icon, color } = statusConfig[data.status];
  const visibleSubtasks = data.subtasks.slice(0, MAX_SUBTASKS);
  const overflow = data.subtasks.length - MAX_SUBTASKS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative rounded-lg border-l-4 border-green-500 bg-white shadow-sm dark:bg-zinc-900',
        'min-w-[280px] max-w-[320px] p-3',
        'transition-shadow hover:shadow-md',
        data.status === 'in-progress' && 'ring-2 ring-amber-400/50 animate-pulse',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-green-500" />
      <Handle type="source" position={Position.Right} className="!bg-green-500" />

      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn('text-base leading-none', color)}>{icon}</span>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {data.id}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
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
