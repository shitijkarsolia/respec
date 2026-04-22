

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AgentBubble } from './AgentBubble';
import { AgentLogEntry } from './AgentLogEntry';

export function AgentActivityRail() {
  const agentActivity = useRespecStore((s) => s.agentActivity);
  const railOpen = useRespecStore((s) => s.railOpen);
  const setRailOpen = useRespecStore((s) => s.setRailOpen);
  const acceptInsight = useRespecStore((s) => s.acceptInsight);
  const dismissInsight = useRespecStore((s) => s.dismissInsight);
  const insights = useRespecStore((s) => s.insights);

  const pendingInsights = useMemo(() => insights.filter((i) => !i.accepted), [insights]);
  const thinking = useMemo(() => agentActivity.filter((e) => e.status === 'thinking'), [agentActivity]);
  const completed = useMemo(() => agentActivity.filter((e) => e.status !== 'thinking'), [agentActivity]);

  const insightCount = pendingInsights.length;

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
            ◀
          </button>
          {insightCount > 0 && (
            <Badge variant="destructive" className="mt-2 scale-75">
              {insightCount}
            </Badge>
          )}
        </motion.div>
      ) : (
        <motion.aside
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
              ▶
            </button>
          </div>

          <Separator />

          <div className="flex flex-1 flex-col overflow-hidden">
            {agentActivity.length === 0 && pendingInsights.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No agent activity yet
              </p>
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
                          <div
                            key={insight.id}
                            className="rounded-md border border-border bg-zinc-50 p-2 text-xs dark:bg-zinc-800"
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
                          </div>
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
