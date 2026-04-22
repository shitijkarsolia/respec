

import React from 'react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative rounded-lg border-l-4 border-blue-500 bg-white shadow-sm dark:bg-zinc-900',
        'min-w-[300px] max-w-[360px] p-3',
        'transition-all hover:scale-[1.02] hover:shadow-md',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />

      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg -mx-3 -mt-3 px-3 py-2 mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {data.id}
        </span>
        <div className="flex items-center gap-1.5">
          {annotations.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 px-1 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
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

      {/* Flagged indicator */}
      {data.status === 'flagged' && (
        <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
      )}

      {/* EARS body */}
      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3">
        <span className="inline-flex bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-semibold">
          {data.type}
        </span>{' '}
        {data.trigger}{' '}
        <span className="font-bold text-blue-600 dark:text-blue-400">
          THE SYSTEM SHALL
        </span>{' '}
        {data.response}
      </p>
    </motion.div>
  );
}

export const EarsCard = React.memo(EarsCardInner);
export default EarsCard;
