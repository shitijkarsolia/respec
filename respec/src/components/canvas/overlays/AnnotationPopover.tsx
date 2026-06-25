'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Annotation } from '@/lib/types';

const actions = ['comment', 'split', 'remove', 'clarify'] as const;
type Action = (typeof actions)[number];

function targetTypeFromId(id: string): Annotation['targetType'] {
  if (id.startsWith('FR-')) return 'requirement';
  if (id.startsWith('DE-')) return 'design';
  if (id.startsWith('T-')) return 'task';
  return 'requirement';
}

export default function AnnotationPopover() {
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const addAnnotation = useRespecStore((s) => s.addAnnotation);

  const [action, setAction] = useState<Action>('comment');
  const [content, setContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Ref to track and clear the success-state timeout on unmount / early close
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear success timer on unmount to avoid state updates on an unmounted component
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Auto-focus textarea when popover opens
  useEffect(() => {
    if (selectedNodeId && !showSuccess) {
      // Small delay to let the spring animation start so the element is mounted
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [selectedNodeId, showSuccess]);

  const handleSubmit = useCallback(() => {
    if (!selectedNodeId || !content.trim()) return;

    const annotation: Annotation = {
      id: crypto.randomUUID(),
      targetId: selectedNodeId,
      targetType: targetTypeFromId(selectedNodeId),
      action,
      content: content.trim(),
      author: 'reviewer',
      timestamp: Date.now(),
    };

    addAnnotation(annotation);
    setContent('');
    setAction('comment');
    setShowSuccess(true);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setShowSuccess(false);
      setSelectedNodeId(null);
    }, 800);
  }, [selectedNodeId, content, action, addAnnotation, setSelectedNodeId]);

  const handleCancel = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setContent('');
    setAction('comment');
    setSelectedNodeId(null);
  };

  // Keep a ref to the latest handleSubmit so the keydown listener doesn't need
  // to be re-attached on every keystroke (avoids stale closures over content/action).
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Attach the keydown listener once per open/close cycle (stable deps)
  useEffect(() => {
    if (!selectedNodeId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        setContent('');
        setAction('comment');
        setSelectedNodeId(null);
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmitRef.current();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedNodeId, setSelectedNodeId]);

  return (
    <AnimatePresence>
      {selectedNodeId && (
        <motion.div
          data-tour="annotation-popover"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={cn(
            'fixed z-[55] rounded-lg border bg-white/85 backdrop-blur-xl border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]',
            'inset-x-3 bottom-3 w-auto sm:inset-x-auto sm:right-4 sm:bottom-20 sm:w-80',
            'dark:bg-zinc-900/85 dark:border-white/5'
          )}
        >
          {/* Grab handle (mobile bottom sheet) */}
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600 sm:hidden" />
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6 text-green-600 dark:text-green-400"
            >
              <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Annotation saved</span>
            </motion.div>
          ) : (
            <>
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Annotating: {selectedNodeId}
          </p>

          <div className="mb-3 flex gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800" role="group" aria-label="Annotation action">
            {actions.map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                aria-pressed={action === a}
                className={cn(
                  'relative flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors',
                  action === a
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                )}
              >
                {action === a && (
                  <motion.span
                    layoutId="annotation-action-pill"
                    className="absolute inset-0 rounded-md bg-emerald-600 shadow-sm"
                    transition={spring.snappy}
                  />
                )}
                <span className="relative z-10">{a}</span>
              </button>
            ))}
          </div>

          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your annotation..."
            className="mb-3 min-h-[80px] resize-none text-sm"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'}+Enter to submit
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} className="active:scale-[0.97] transition-transform">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!content.trim()} className="active:scale-[0.97] transition-transform">
                Submit
              </Button>
            </div>
          </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
