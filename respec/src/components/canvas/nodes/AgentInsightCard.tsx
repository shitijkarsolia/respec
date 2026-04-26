'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import type { AgentInsight } from '@/lib/types';
import { useRespecStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Search, CircleDot, FlaskConical, ClipboardList } from 'lucide-react';

const agentIcons: Record<AgentInsight['agentName'], React.ReactNode> = {
  DriftDetector: <Search className="h-4 w-4" />,
  GapFinder: <CircleDot className="h-4 w-4" />,
  TestSynthesizer: <FlaskConical className="h-4 w-4" />,
  FeedbackCompiler: <ClipboardList className="h-4 w-4" />,
};

function AgentInsightCardInner({ data }: NodeProps & { data: AgentInsight }) {
  const acceptInsight = useRespecStore((s) => s.acceptInsight);
  const dismissInsight = useRespecStore((s) => s.dismissInsight);

  const isError = data.severity === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={cn(
        'relative rounded-lg border-l-4 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:bg-zinc-900 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] dark:border dark:border-zinc-800',
        'min-w-[280px] max-w-[320px] p-3',
        'transition-shadow hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] dark:hover:border-zinc-700',
        isError ? 'border-red-500' : 'border-amber-500',
      )}
    >
      <Handle type="target" position={Position.Left} className={cn('!bg-amber-500', isError && '!bg-red-500')} />

      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-base leading-none">
          {agentIcons[data.agentName]}
        </span>
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          {data.agentName}
        </span>
        <span
          className={cn(
            'ml-auto h-2 w-2 rounded-full',
            isError ? 'bg-red-500' : 'bg-amber-500',
          )}
        />
      </div>

      {/* Message */}
      <p className="mb-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        {data.message}
      </p>

      {data.suggestion && (
        <p className="mb-2 rounded bg-zinc-50 p-1.5 text-[11px] italic text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {data.suggestion}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => acceptInsight(data.id)}
          className="rounded bg-green-600 px-2.5 py-1 text-[11px] font-medium text-white transition-all hover:bg-green-700 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1"
        >
          Accept
        </button>
        <button
          onClick={() => dismissInsight(data.id)}
          className="rounded bg-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-all hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

export const AgentInsightCard = React.memo(AgentInsightCardInner);
export default AgentInsightCard;
