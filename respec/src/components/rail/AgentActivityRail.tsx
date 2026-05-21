'use client';

import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AgentBubble } from './AgentBubble';
import { AgentLogEntry } from './AgentLogEntry';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentActivityRail() {
  const agentActivity = useRespecStore((s) => s.agentActivity);
  const railOpen = useRespecStore((s) => s.railOpen);
  const setRailOpen = useRespecStore((s) => s.setRailOpen);
  const acceptInsight = useRespecStore((s) => s.acceptInsight);
  const dismissInsight = useRespecStore((s) => s.dismissInsight);
  const insights = useRespecStore((s) => s.insights);
  const setHoveredNodeId = useRespecStore((s) => s.setHoveredNodeId);

  const pendingInsights = useMemo(() => insights.filter((i) => !i.accepted), [insights]);
  const thinking = useMemo(() => agentActivity.filter((e) => e.status === 'thinking'), [agentActivity]);
  const completed = useMemo(() => agentActivity.filter((e) => e.status !== 'thinking'), [agentActivity]);

  const insightCount = pendingInsights.length;

  const prevInsightCount = useRef(insightCount);

  useEffect(() => {
    if (prevInsightCount.current === 0 && insightCount > 0) {
      setRailOpen(true);
    }
    prevInsightCount.current = insightCount;
  }, [insightCount, setRailOpen]);

  return (
    <AnimatePresence initial={false}>
      {!railOpen ? (
        <motion.div
          key="collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 36, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full shrink-0 flex-col items-center border-l border-border bg-background pt-2"
        >
          <button
            onClick={() => setRailOpen(true)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Open agent activity rail"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {insightCount > 0 && (
            <Badge variant="destructive" className="mt-2 scale-75">
              {insightCount}
            </Badge>
          )}
        </motion.div>
      ) : (
        <motion.aside
          data-tour="agent-rail"
          key="expanded"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-background"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Agent Activity</span>
              {insightCount > 0 && (
                <Badge variant="secondary">{insightCount}</Badge>
              )}
            </div>
            <button
              onClick={() => setRailOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close agent activity rail"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Separator />

          <div className="flex flex-1 flex-col overflow-hidden">
            {agentActivity.length === 0 && pendingInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-3 py-8 bg-gradient-to-b from-transparent to-emerald-50/30 dark:to-emerald-950/10">
                <div className="flex flex-col items-center gap-2 mb-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                      className={[
                        'h-3 w-3 rounded-full',
                        ['bg-emerald-400', 'bg-purple-400', 'bg-amber-400'][i],
                      ].join(' ')}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Agents warming up
                  <span className="inline-flex gap-[2px] ml-0.5">
                    <span className="animate-bounce [animation-delay:0ms]">.</span>
                    <span className="animate-bounce [animation-delay:150ms]">.</span>
                    <span className="animate-bounce [animation-delay:300ms]">.</span>
                  </span>
                </p>
              </div>
            ) : (
              <>
                {thinking.length > 0 && (
                  <div aria-live="polite" className="px-3 py-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Active
                    </span>
                    <div className="mt-1 space-y-2">
                      {thinking.map((entry) => (
                        <AgentBubble
                          key={entry.id}
                          agentName={entry.agentName}
                          message={entry.message}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {thinking.length > 0 && completed.length > 0 && <Separator />}

                {completed.length > 0 && (
                  <div className="flex min-h-0 flex-1 flex-col px-3 py-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Log
                    </span>
                    <div className="mt-1 flex-1 overflow-y-auto">
                      {completed.map((entry) => (
                        <AgentLogEntry key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                )}

                {pendingInsights.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex min-h-0 flex-col px-3 py-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Insights
                      </span>
                      <div className="mt-1 space-y-2 overflow-y-auto">
                        {pendingInsights.map((insight) => (
                          <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                            onMouseEnter={() => insight.targetId && setHoveredNodeId(insight.targetId)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            className={cn(
                              'cursor-pointer rounded-md border-l-[3px] border bg-zinc-50 p-2 text-xs dark:bg-zinc-800/60',
                              insight.severity === 'error'
                                ? 'border-l-red-500 border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20'
                                : 'border-l-amber-500 border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20'
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={
                                  insight.severity === 'error'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {insight.severity}
                              </Badge>
                              <span className="font-medium">
                                {insight.agentName}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {insight.message}
                            </p>
                            {insight.suggestion && (
                              <p className="mt-0.5 italic text-muted-foreground">
                                {insight.suggestion}
                              </p>
                            )}
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="xs"
                                onClick={() => acceptInsight(insight.id)}
                              >
                                Accept
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => dismissInsight(insight.id)}
                              >
                                Dismiss
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
