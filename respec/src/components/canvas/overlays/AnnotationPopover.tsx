'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

  const handleSubmit = () => {
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
    setSelectedNodeId(null);
  };

  const handleCancel = () => {
    setContent('');
    setAction('comment');
    setSelectedNodeId(null);
  };

  return (
    <AnimatePresence>
      {selectedNodeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-20 right-4 z-50 w-80 rounded-lg border bg-white p-4 shadow-lg',
            'dark:border-zinc-700 dark:bg-zinc-900'
          )}
        >
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Annotating: {selectedNodeId}
          </p>

          <div className="mb-3 flex gap-1">
            {actions.map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium capitalize transition-colors',
                  action === a
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                )}
              >
                {a}
              </button>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add your annotation..."
            className="mb-3 min-h-[80px] resize-none text-sm"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
              Submit
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
