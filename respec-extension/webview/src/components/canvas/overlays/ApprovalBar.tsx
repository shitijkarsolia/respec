

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore, useAnnotationCount } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { postToExtension } from '@/vscode';
import FeedbackModal from './FeedbackModal';

export default function ApprovalBar() {
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const annotations = useRespecStore((s) => s.annotations);
  const requestChanges = useRespecStore((s) => s.requestChanges);
  const approve = useRespecStore((s) => s.approve);
  const annotationCount = useAnnotationCount();
  const spec = useRespecStore((s) => s.spec);

  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const handleRequestChanges = () => {
    requestChanges();
    postToExtension({ type: 'feedback:submit', payload: { annotations, spec } });

    // Build feedback text locally for the modal
    const sections: string[] = ['Please update the spec with the following changes:'];
    for (const [targetId, anns] of Object.entries(annotations)) {
      for (const ann of anns) {
        const label = ann.action === 'comment' ? 'Comment' : `Action: ${ann.action.toUpperCase()}`;
        sections.push(`- [${ann.targetId}] ${label} — "${ann.content}"`);
      }
    }
    setFeedbackText(sections.join('\n'));
  };

  const handleApprove = () => {
    approve();
    postToExtension({ type: 'spec:approve' });
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]',
          'bg-white dark:border-zinc-700 dark:bg-zinc-900'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {annotationCount} annotation{annotationCount !== 1 ? 's' : ''} pending
          </span>

          <AnimatePresence mode="wait">
            {approvalStatus === 'approved' && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-md bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                ✓ Spec Approved
              </motion.div>
            )}

            {approvalStatus === 'changes-requested' && (
              <motion.div
                key="changes"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-md bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              >
                Changes requested — feedback compiled
              </motion.div>
            )}

            {approvalStatus === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
              >
                <Button variant="outline" size="sm" onClick={handleRequestChanges}>
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  onClick={handleApprove}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Approve
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {feedbackText && (
        <FeedbackModal
          feedback={feedbackText}
          onClose={() => setFeedbackText(null)}
        />
      )}
    </>
  );
}
