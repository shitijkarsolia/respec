'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface FeedbackModalProps {
  feedback: string;
  onClose: () => void;
}

export default function FeedbackModal({ feedback, onClose }: FeedbackModalProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedback);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="mx-4 w-full max-w-lg rounded-lg border bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Compiled Feedback
          </h3>

          <pre className="mb-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {feedback}
          </pre>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              Copy to Clipboard
            </Button>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
