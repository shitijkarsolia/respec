'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore, useAnnotationCount } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FeedbackModal from './FeedbackModal';
import HandoffModal from './HandoffModal';
import { getDemoSpec } from '@/data/sample-specs';
import { toast } from '@/components/ui/toast';
import { Check } from 'lucide-react';

type ConfettiPiece = {
  id: number;
  colorIndex: number;
  shape: 'circle' | 'rect';
  originX: number;
  originY: number;
  x: number;
  peakY: number;
  fallY: number;
  scale: number;
  rotate: number;
  delay: number;
  duration: number;
};

export default function ApprovalBar() {
  const router = useRouter();
  const approvalStatus = useRespecStore((s) => s.approvalStatus);
  const annotations = useRespecStore((s) => s.annotations);
  const requestChanges = useRespecStore((s) => s.requestChanges);
  const approve = useRespecStore((s) => s.approve);
  const setApprovalStatus = useRespecStore((s) => s.setApprovalStatus);
  const reset = useRespecStore((s) => s.reset);
  const annotationCount = useAnnotationCount();

  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [handoffDismissed, setHandoffDismissed] = useState(false);

  const spec = useRespecStore((s) => s.spec);

  const handleApproveClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    approve();
    setHandoffDismissed(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    setConfettiPieces(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        colorIndex: i % 5,
        shape: i % 3 === 0 ? 'rect' : 'circle',
        originX,
        originY,
        x: originX + (Math.random() - 0.5) * 520,
        peakY: originY - (150 + Math.random() * 220),
        fallY: originY + (40 + Math.random() * 240),
        scale: 0.5 + Math.random() * 0.7,
        rotate: Math.random() * 720 - 360,
        delay: Math.random() * 0.12,
        duration: 1.1 + Math.random() * 0.6,
      })),
    );
    setTimeout(() => setConfettiPieces([]), 2000);
  }, [approve]);

  const handleReturnHome = useCallback(() => {
    reset();
    sessionStorage.removeItem('respec-demo-mode');
    sessionStorage.removeItem('respec-demo-tour-dismissed');
    router.push('/');
  }, [reset, router]);

  const handleRequestChanges = async () => {
    if (annotationCount === 0) return;
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
      } else {
        toast.error('Could not compile feedback. Please try again.');
      }
    } catch {
      toast.error('Could not compile feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderApproveButton = () => (
    <Button
      data-tour="approve-spec"
      size="sm"
      onClick={handleApproveClick}
      className="bg-green-600 text-white transition-transform hover:bg-green-700 active:scale-[0.97]"
    >
      Approve
    </Button>
  );

  return (
    <>
      <div
        data-tour="approval-bar"
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
                className="flex items-center gap-2"
              >
                <span className="rounded-md bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Changes requested
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApprovalStatus('pending')}
                  className="active:scale-[0.97] transition-transform"
                >
                  Continue Reviewing
                </Button>
                {renderApproveButton()}
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
                <Button
                  data-tour="request-changes"
                  variant="outline"
                  size="sm"
                  onClick={handleRequestChanges}
                  disabled={loading || annotationCount === 0}
                  className="active:scale-[0.97] transition-transform"
                  title={annotationCount === 0 ? 'Add an annotation first' : undefined}
                >
                  {loading ? 'Compiling...' : 'Request Changes'}
                </Button>
                {renderApproveButton()}
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

      <AnimatePresence>
        {approvalStatus === 'approved' && !handoffDismissed && (
          <HandoffModal
            specName={
              getDemoSpec(
                (typeof window !== 'undefined' && sessionStorage.getItem('respec-demo-id')) || '',
              )?.name ?? 'Spec'
            }
            onClose={() => setHandoffDismissed(true)}
            onReviewAnother={handleReturnHome}
          />
        )}
      </AnimatePresence>

      {confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ x: piece.originX, y: piece.originY, scale: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: piece.x,
                y: [piece.originY, piece.peakY, piece.fallY],
                scale: [0, piece.scale, piece.scale],
                opacity: [1, 1, 0],
                rotate: piece.rotate,
              }}
              transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut', times: [0, 0.35, 1] }}
              className={cn(
                'absolute',
                piece.shape === 'rect' ? 'h-2.5 w-1.5 rounded-[1px]' : 'h-2 w-2 rounded-full',
                ['bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-green-400', 'bg-rose-400'][piece.colorIndex],
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}
