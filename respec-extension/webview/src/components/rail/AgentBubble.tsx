

import { cn } from '@/lib/utils';

const agentColors: Record<string, string> = {
  DriftDetector: 'bg-red-500',
  GapFinder: 'bg-amber-500',
  FeedbackCompiler: 'bg-blue-500',
  TestSynthesizer: 'bg-purple-500',
};

interface AgentBubbleProps {
  agentName: string;
  message: string;
}

export function AgentBubble({ agentName, message }: AgentBubbleProps) {
  const dotColor = agentColors[agentName] ?? 'bg-zinc-400';

  return (
    <div className="rounded-md bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
      <div className="flex items-center gap-1.5">
        <span className={cn('inline-block size-2 rounded-full', dotColor)} />
        <span className="font-bold">{agentName}</span>
      </div>

      <div className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
        <span>thinking</span>
        <span className="inline-flex gap-[2px]">
          <span className="animate-bounce [animation-delay:0ms]">.</span>
          <span className="animate-bounce [animation-delay:150ms]">.</span>
          <span className="animate-bounce [animation-delay:300ms]">.</span>
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
