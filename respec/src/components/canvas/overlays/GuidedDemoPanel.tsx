'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  MessageSquarePlus,
  MousePointerClick,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnnotationCount, useRespecStore } from '@/lib/store';
import type { Annotation } from '@/lib/types';
import { cn } from '@/lib/utils';

const DEMO_ANNOTATION_ID = 'demo-annotation-task-t8';

type WalkthroughStep = {
  id: string;
  title: string;
  body: string;
  target: string;
  primaryLabel?: string;
  action?: 'annotate' | 'next' | 'finish';
};

function getTargetRect(target: string): DOMRect | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`[data-tour="${target}"]`)?.getBoundingClientRect() ?? null;
}

function getCardPosition(rect: DOMRect | null) {
  if (!rect || typeof window === 'undefined') {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const margin = 16;
  const width = Math.min(320, window.innerWidth - margin * 2);
  const placeRight = rect.right + width + margin <= window.innerWidth - margin;
  const placeLeft = rect.left - width - margin >= margin;
  const preferredLeft = placeRight ? rect.right + margin : placeLeft ? rect.left - width - margin : margin;
  const left = Math.min(Math.max(preferredLeft, margin), window.innerWidth - width - margin);
  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - 120, margin + 48),
    window.innerHeight - 280,
  );

  return {
    left,
    top,
    width,
    transform: 'none',
  };
}

export default function GuidedDemoPanel() {
  const [isDemoMode] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('respec-demo-mode') === 'true',
  );
  const [tourOpen, setTourOpen] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem('respec-demo-tour-dismissed') !== 'true',
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const spec = useRespecStore((s) => s.spec);
  const annotations = useRespecStore((s) => s.annotations);
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const addAnnotation = useRespecStore((s) => s.addAnnotation);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const annotationCount = useAnnotationCount();

  const hasSampleTask = spec?.tasks.some((task) => task.id === 'T-8') ?? false;
  const hasDemoAnnotation = Object.values(annotations).some((list) =>
    list.some((annotation) => annotation.id === DEMO_ANNOTATION_ID),
  );

  const addSampleAnnotation = useCallback(() => {
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
  }, [addAnnotation, hasDemoAnnotation, setSelectedNodeId]);

  const steps = [
    { label: 'Annotate', done: annotationCount > 0 },
    { label: 'Compile', done: approvalStatus === 'changes-requested' || approvalStatus === 'approved' },
    { label: 'Approve', done: approvalStatus === 'approved' },
  ];

  const walkthroughSteps: WalkthroughStep[] = useMemo(
    () => [
      {
        id: 'overview',
        title: 'Start with the map',
        body: 'This canvas turns raw Kiro markdown into a review surface. The top bar confirms the demo loaded 12 requirements, 1 design element, and 8 tasks.',
        target: 'status-summary',
        primaryLabel: 'Show columns',
        action: 'next',
      },
      {
        id: 'columns',
        title: 'Read left to right',
        body: 'Requirements, design, and tasks stay visible together. The curved links show which tasks and design choices trace back to each requirement.',
        target: 'canvas-stage',
        primaryLabel: 'Show agent checks',
        action: 'next',
      },
      {
        id: 'agents',
        title: 'Notice the review agents',
        body: 'The rail flags gaps while the reviewer stays in context. In this demo, DriftDetector spots that T-8 is not linked to a requirement.',
        target: 'agent-rail',
        primaryLabel: 'Start review loop',
        action: 'next',
      },
      {
        id: 'annotate',
        title: 'Add a sample annotation',
        body: 'Click Annotate to mark T-8 with a clarify note. This simulates a reviewer asking whether streak badges belong in scope.',
        target: 'demo-annotate',
        primaryLabel: 'Annotate T-8',
        action: 'annotate',
      },
      {
        id: 'annotation-panel',
        title: 'Annotations stay attached',
        body: 'The task opens for deeper review, and the bottom bar now shows one pending annotation. Real reviewers can type their own note here too.',
        target: 'annotation-popover',
        primaryLabel: 'Show handoff',
        action: 'next',
      },
      {
        id: 'request',
        title: 'Compile the handoff',
        body: 'Click Request Changes. Respec converts review notes into structured feedback that can go back into Kiro or another coding agent.',
        target: 'request-changes',
      },
      {
        id: 'feedback',
        title: 'Review the generated feedback',
        body: 'The compiled feedback is the handoff artifact. Click Close when you are ready to finish the demo approval path.',
        target: 'feedback-close',
      },
      {
        id: 'approve',
        title: 'Approve when the spec is clear',
        body: 'Click Approve to finish the review. The canvas marks the spec accepted and clears pending annotations.',
        target: 'approve-spec',
      },
      {
        id: 'done',
        title: 'That is the full loop',
        body: 'The demo shows the core product story: visualize a spec, find gaps, annotate the issue, compile feedback, and approve the result.',
        target: 'approval-bar',
        primaryLabel: 'Finish',
        action: 'finish',
      },
    ],
    [],
  );

  const currentStep = walkthroughSteps[Math.min(stepIndex, walkthroughSteps.length - 1)];

  useEffect(() => {
    if (!tourOpen || !currentStep) return;

    const updateRect = () => setTargetRect(getTargetRect(currentStep.target));
    updateRect();
    const interval = window.setInterval(updateRect, 250);
    window.addEventListener('resize', updateRect);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', updateRect);
    };
  }, [currentStep, tourOpen]);

  useEffect(() => {
    if (!tourOpen) return;
    let nextIndex: number | null = null;
    if (currentStep?.id === 'annotate' && annotationCount > 0) {
      nextIndex = 4;
    }
    if (currentStep?.id === 'request' && approvalStatus === 'changes-requested') {
      nextIndex = 6;
    }
    if (currentStep?.id === 'approve' && approvalStatus === 'approved') {
      nextIndex = 8;
    }
    if (nextIndex === null) {
      return;
    }
    const targetIndex = nextIndex;
    const timer = window.setTimeout(() => setStepIndex(targetIndex), 0);
    return () => window.clearTimeout(timer);
  }, [annotationCount, approvalStatus, currentStep?.id, tourOpen]);

  useEffect(() => {
    if (!tourOpen) return;
    const handleFeedbackClosed = () => {
      if (currentStep?.id === 'feedback') {
        setStepIndex(7);
      }
    };
    window.addEventListener('respec-feedback-closed', handleFeedbackClosed);
    return () => window.removeEventListener('respec-feedback-closed', handleFeedbackClosed);
  }, [currentStep?.id, tourOpen]);

  if (!isDemoMode || !spec || !hasSampleTask) return null;

  const closeTour = () => {
    setTourOpen(false);
    sessionStorage.setItem('respec-demo-tour-dismissed', 'true');
  };

  const nextStep = () => setStepIndex((current) => Math.min(current + 1, walkthroughSteps.length - 1));

  const handleTourAction = () => {
    if (!currentStep) return;
    if (currentStep.action === 'annotate') {
      addSampleAnnotation();
      setStepIndex(4);
      return;
    }
    if (currentStep.action === 'finish') {
      closeTour();
      return;
    }
    nextStep();
  };

  const cardStyle = getCardPosition(targetRect);
  const spotlightStyle = targetRect
    ? {
        left: targetRect.left - 8,
        top: targetRect.top - 8,
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  return (
    <>
    <div
      data-tour="demo-guide"
      className="pointer-events-auto absolute left-4 top-4 z-40 w-64 rounded-lg border border-zinc-200/70 bg-white/90 p-3 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90"
    >
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
          data-tour="demo-annotate"
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

    {tourOpen && currentStep && (
      <div className="pointer-events-none fixed inset-0 z-[70]">
        <div className="absolute inset-0 bg-zinc-950/20 dark:bg-zinc-950/35" />
        {spotlightStyle && (
          <div
            className="absolute rounded-xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(9,9,11,0.34),0_0_35px_rgba(16,185,129,0.45)] transition-all duration-200 dark:shadow-[0_0_0_9999px_rgba(9,9,11,0.5),0_0_35px_rgba(16,185,129,0.45)]"
            style={spotlightStyle}
          />
        )}

        <div
          className="pointer-events-auto fixed max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-200 bg-white p-4 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          style={cardStyle}
          role="dialog"
          aria-label="Demo walkthrough"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">
                <MousePointerClick className="h-3.5 w-3.5" />
                Step {stepIndex + 1} of {walkthroughSteps.length}
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {currentStep.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeTour}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              aria-label="Close walkthrough"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {currentStep.body}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-1">
              {walkthroughSteps.map((step, index) => (
                <span
                  key={step.id}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    index === stepIndex ? 'w-5 bg-emerald-600' : 'w-1.5 bg-zinc-300 dark:bg-zinc-700',
                  )}
                />
              ))}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                >
                  Back
                </Button>
              )}
              {currentStep.primaryLabel && (
                <Button type="button" size="sm" onClick={handleTourAction} className="min-w-0 max-w-full gap-1.5">
                  <span className="truncate">{currentStep.primaryLabel}</span>
                  {currentStep.action !== 'finish' && <ArrowRight className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
