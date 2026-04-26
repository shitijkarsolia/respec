'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore, useAnnotationCount } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FeedbackModal from './FeedbackModal';
import { Check } from 'lucide-react';

export default function ApprovalBar() {
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const annotations = useRespecStore((s) => s.annotations);
  const requestChanges = useRespecStore((s) => s.requestChanges);
  const approve = useRespecStore((s) => s.approve);
  const annotationCount = useAnnotationCount();

  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spec = useRespecStore((s) => s.spec);

  // Reset confirm state after 3 seconds
  useEffect(() => {
    if (confirmApprove) {
      confirmTimerRef.current = setTimeout(() => {
        setConfirmApprove(false);
      }, 3000);
    }
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, [confirmApprove]);

  const handleApproveClick = useCallback(() => {
    if (!confirmApprove) {
      setConfirmApprove(true);
      return;
    }
    setConfirmApprove(false);
    approve();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  }, [confirmApprove, approve]);

  const handleRequestChanges = async () => {
    requestChanges();
    setLoading(true);

    try {
      const res = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations, spec }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackText(data.feedback ?? 'Feedback compiled.');
      }
    } catch {
      // non-blocking for demo
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]',
          'bg-white/80 backdrop-blur-xl border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] dark:bg-zinc-900/80 dark:border-white/5'
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
                animate={{ opacity: 1, scale: [0, 1.15, 1] }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-md px-4 py-1.5 text-sm font-medium text-green-800 dark:text-green-400 bg-gradient-to-r from-green-100 via-emerald-50 to-green-100 dark:from-green-900/30 dark:via-emerald-900/20 dark:to-green-900/30 bg-[length:200%_100%] animate-[shimmer-bar_3s_ease-in-out_infinite]"
              >
                <Check className="h-4 w-4 inline" /> Spec Approved
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
                <Button variant="outline" size="sm" onClick={handleRequestChanges} disabled={loading} className="active:scale-[0.97] transition-transform">
                  {loading ? 'Compiling...' : 'Request Changes'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleApproveClick}
                  className={cn(
                    'active:scale-[0.97] transition-transform',
                    confirmApprove
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  )}
                >
                  {confirmApprove ? 'Confirm?' : 'Approve'}
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

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
                y: typeof window !== 'undefined' ? window.innerHeight - 60 : 500,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (typeof window !== 'undefined' ? window.innerWidth / 2 : 500) + (Math.random() - 0.5) * 600,
                y: (typeof window !== 'undefined' ? window.innerHeight - 60 : 500) - Math.random() * 400 - 100,
                scale: Math.random() * 0.8 + 0.4,
                opacity: 0,
                rotate: Math.random() * 720 - 360,
              }}
              transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
              className={[
                'absolute h-2 w-2 rounded-full',
                ['bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-green-400', 'bg-rose-400'][i % 5],
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </>
  );
}
