'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { DesignElement } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRespecStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { MermaidRenderer } from '@/components/canvas/MermaidRenderer';
import { BarChart3 } from 'lucide-react';

const typeLabel: Record<DesignElement['type'], string> = {
  component: 'Component',
  api: 'API',
  dataModel: 'Data Model',
  diagram: 'Diagram',
};

function DesignCardInner({ data }: NodeProps & { data: DesignElement }) {
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const isApproved = approvalStatus === 'approved';
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const isSelected = selectedNodeId === data.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={cn(
        'relative rounded-lg border-l-4 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:bg-zinc-900 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] dark:border dark:border-zinc-800',
        isApproved
          ? 'border-green-500 shadow-green-100 dark:shadow-green-900/20 ring-1 ring-green-200 dark:ring-green-800'
          : 'border-purple-500 dark:border-l-purple-400',
        isSelected && !isApproved && 'ring-2 ring-purple-500/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        'min-w-[300px] max-w-[360px] p-3',
        'transition-all hover:scale-[1.02] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-purple-500" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500" />

      {/* Approved badge */}
      {isApproved && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] shadow">
          ✓
        </span>
      )}

      {/* Header */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-t-lg -mx-3 -mt-3 px-3 py-2 mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
        </span>
        <Badge className="shrink-0 border-0 bg-purple-100 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          {typeLabel[data.type]}
        </Badge>
      </div>

      {/* Diagram */}
      {data.type === 'diagram' && (
        data.mermaidCode ? (
          <div className="mb-1.5">
            <MermaidRenderer code={data.mermaidCode} id={data.id} label={data.title} />
          </div>
        ) : (
          <div className="mb-1.5 flex items-center gap-1 rounded-md border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-2 py-1.5 text-xs text-purple-600 dark:text-purple-400">
            <BarChart3 className="h-3 w-3 inline" /> Diagram
          </div>
        )
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
