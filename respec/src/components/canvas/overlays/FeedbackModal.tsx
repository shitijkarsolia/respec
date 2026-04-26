'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface FeedbackModalProps {
  feedback: string;
  onClose: () => void;
}

export default function FeedbackModal({ feedback, onClose }: FeedbackModalProps) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mx-4 w-full max-w-lg rounded-xl bg-gradient-to-br from-emerald-500/20 via-transparent to-purple-500/20 p-[1px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] ring-1 ring-white/10">
            <h3 id="feedback-title" className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
              Compiled Feedback
            </h3>

            <div className="mb-4 max-h-64 overflow-auto rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-mono whitespace-pre-wrap border border-zinc-100 dark:border-zinc-700/50">
              {feedback}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="active:scale-[0.97] transition-all gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
              <Button ref={closeRef} size="sm" onClick={onClose} className="active:scale-[0.97] transition-transform">
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
