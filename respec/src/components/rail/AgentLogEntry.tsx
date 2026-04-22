'use client';

import { motion } from 'framer-motion';
import type { AgentLogEntry as AgentLogEntryType } from '@/lib/types';
import { cn } from '@/lib/utils';

const statusIcon: Record<AgentLogEntryType['status'], string> = {
  complete: '✓',
  error: '✕',
  thinking: '⟳',
};

const statusColor: Record<AgentLogEntryType['status'], string> = {
  complete: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  thinking: 'text-amber-600 dark:text-amber-400',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

interface AgentLogEntryProps {
  entry: AgentLogEntryType;
}

export function AgentLogEntry({ entry }: AgentLogEntryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2 px-1 py-1 text-xs"
    >
      <span className={cn('shrink-0 font-mono', statusColor[entry.status])}>
        {statusIcon[entry.status]}
      </span>
      <span className="shrink-0 font-mono text-muted-foreground">
        {formatTime(entry.timestamp)}
      </span>
      <span className="text-sm font-medium">{entry.agentName}</span>
      <span className="truncate text-muted-foreground">{entry.message}</span>
    </motion.div>
  );
}
