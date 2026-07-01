'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { DesignElement } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRespecStore, useNodeFocusState } from '@/lib/store';
import { spring } from '@/lib/motion';
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
  const { isDimmed, isLinked, isFocus } = useNodeFocusState(data.id);

  return (
    <motion.div
      role="button"
      aria-current={isSelected ? true : undefined}
      aria-label={`Design element ${data.id}: ${data.title}. ${typeLabel[data.type]}.`}
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
          : 'border-purple-500 dark:border-l-purple-400',
        isSelected && !isApproved && 'ring-2 ring-purple-500/70 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950',
        isLinked && !isFocus && !isSelected && !isApproved && 'ring-2 ring-purple-400/45',
        isDimmed && 'saturate-[0.65]',
        'hover:shadow-[0_10px_22px_-8px_rgba(0,0,0,0.14),0_28px_50px_-18px_rgba(0,0,0,0.22)] dark:hover:border-zinc-700',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-purple-500 dark:!border-zinc-900" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-purple-500 dark:!border-zinc-900" />

      {/* Approved badge */}
      {isApproved && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-[10px] shadow">
          ✓
        </span>
      )}

      {/* Header */}
      <div className="-mx-3 -mt-3 mb-2 flex items-center gap-2 rounded-t-xl bg-gradient-to-r from-purple-50 to-transparent px-3 py-2 dark:from-purple-950/30">
        <span className="rounded bg-purple-100/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          {data.id}
        </span>
        <span className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {data.title}
        </span>
        <Badge className="ml-auto shrink-0 border-0 bg-purple-100 text-[10px] text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
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
        <div className="flex flex-wrap items-center gap-1 border-t border-zinc-100 pt-2 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <span className="mr-0.5">Implements</span>
          {data.implementsRequirements.map((reqId) => (
            <span
              key={reqId}
              className="rounded bg-purple-100/60 px-1 py-0.5 font-mono font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            >
              {reqId}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export const DesignCard = React.memo(DesignCardInner);
export default DesignCard;
