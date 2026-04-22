

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { DesignElement } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeLabel: Record<DesignElement['type'], string> = {
  component: 'Component',
  api: 'API',
  dataModel: 'Data Model',
  diagram: 'Diagram',
};

function DesignCardInner({ data }: NodeProps & { data: DesignElement }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'relative rounded-lg border-l-4 border-purple-500 bg-white shadow-sm dark:bg-zinc-900',
        'min-w-[300px] max-w-[360px] p-3',
        'transition-shadow hover:shadow-md',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />

      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg -mx-3 -mt-3 px-3 py-2 mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
        </span>
        <Badge className="shrink-0 border-0 bg-purple-100 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {typeLabel[data.type]}
        </Badge>
      </div>

      {/* Diagram indicator */}
      {data.type === 'diagram' && (
        <div className="mb-1.5 flex items-center gap-1 rounded-md border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-2 py-1.5 text-xs text-purple-600 dark:text-purple-400">
          📊 Diagram
        </div>
      )}

      {/* Description */}
      <p className="mb-2 line-clamp-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        {data.description}
      </p>

      {/* Implements footer */}
      {data.implementsRequirements.length > 0 && (
        <div className="border-t border-zinc-100 pt-1.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          Implements:{' '}
          {data.implementsRequirements.map((reqId, i) => (
            <span key={reqId}>
              <span className="font-medium text-purple-600 dark:text-purple-400">
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

export const DesignCard = React.memo(DesignCardInner);
export default DesignCard;
