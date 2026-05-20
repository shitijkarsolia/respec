'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnnotationCount, useRespecStore } from '@/lib/store';
import type { Annotation } from '@/lib/types';
import { cn } from '@/lib/utils';

const DEMO_ANNOTATION_ID = 'demo-annotation-task-t8';

export default function GuidedDemoPanel() {
  const [isDemoMode] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('respec-demo-mode') === 'true',
  );
  const spec = useRespecStore((s) => s.spec);
  const annotations = useRespecStore((s) => s.annotations);
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const addAnnotation = useRespecStore((s) => s.addAnnotation);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const annotationCount = useAnnotationCount();

  if (!isDemoMode || !spec) return null;

  const hasSampleTask = spec.tasks.some((task) => task.id === 'T-8');
  const hasDemoAnnotation = Object.values(annotations).some((list) =>
    list.some((annotation) => annotation.id === DEMO_ANNOTATION_ID),
  );

  if (!hasSampleTask) return null;

  const addSampleAnnotation = () => {
    if (!hasDemoAnnotation) {
      const annotation: Annotation = {
        id: DEMO_ANNOTATION_ID,
        targetId: 'T-8',
        targetType: 'task',
        action: 'clarify',
        content: 'Clarify whether streak badges should map to a requirement or move to future scope.',
        author: 'reviewer',
        timestamp: Date.now(),
      };
      addAnnotation(annotation);
    }
    setSelectedNodeId('T-8');
  };

  const steps = [
    { label: 'Annotate', done: annotationCount > 0 },
    { label: 'Compile', done: approvalStatus === 'changes-requested' || approvalStatus === 'approved' },
    { label: 'Approve', done: approvalStatus === 'approved' },
  ];

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-40 w-64 rounded-lg border border-zinc-200/70 bg-white/90 p-3 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
            Demo Flow
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Spec review loop
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={addSampleAnnotation}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Annotate
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              'flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium',
              step.done
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
            )}
          >
            {step.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}
