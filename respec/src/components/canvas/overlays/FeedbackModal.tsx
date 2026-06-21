'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Copy, Download } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface FeedbackModalProps {
  feedback: string;
  onClose: () => void;
}

export default function FeedbackModal({ feedback, onClose }: FeedbackModalProps) {
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent('respec-feedback-closed'));
    onClose();
  }, [onClose]);

  // Clear copied timer on unmount to avoid setting state after the modal closes
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  // Focus trap: keep keyboard focus inside the dialog while it's open
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Auto-focus the first focusable element (Copy button)
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedback);
      setCopied(true);
      toast.success('Feedback copied to clipboard');
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write failed (e.g., missing permissions or insecure context)
      toast.error('Could not copy — your browser blocked clipboard access');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([feedback], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respec-feedback.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded respec-feedback.md');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60"
        onClick={handleClose}
      >
        <motion.div
          data-tour="feedback-modal"
          ref={dialogRef}
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
                onClick={handleDownload}
                className="active:scale-[0.97] transition-all gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
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
              <Button
                data-tour="feedback-close"
                size="sm"
                onClick={handleClose}
                className="active:scale-[0.97] transition-transform"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
