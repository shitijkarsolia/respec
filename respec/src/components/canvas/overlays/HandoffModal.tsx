'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRespecStore } from '@/lib/store';
import { computeHandoffStats, buildHandoffNote, buildApprovalSummary } from '@/lib/handoff';
import { buildShareUrl, type ShareState } from '@/lib/share';
import { getDemoSpec } from '@/data/sample-specs';
import { toast } from '@/components/ui/toast';
import { spring } from '@/lib/motion';
import { CheckCircle2, Copy, Check, Download, Share2, RotateCcw, X, ArrowUpRight } from 'lucide-react';

interface HandoffModalProps {
  specName: string;
  onClose: () => void;
  onReviewAnother: () => void;
}

export default function HandoffModal({ specName, onClose, onReviewAnother }: HandoffModalProps) {
  const spec = useRespecStore((s) => s.spec);
  const rawMarkdown = useRespecStore((s) => s.rawMarkdown);
  const annotations = useRespecStore((s) => s.annotations);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

  // Focus trap + Esc (mirrors FeedbackModal).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener('keydown', onKey);
    return () => dialog.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!spec) return null;
  const stats = computeHandoffStats(spec);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildHandoffNote(spec, specName));
      setCopied(true);
      toast.success('Handoff note copied — paste it into Kiro');
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error('Could not copy — your browser blocked clipboard access');
    }
  };

  const handleDownload = () => {
    const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const blob = new Blob([buildApprovalSummary(spec, specName, date)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'respec-approval-summary.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Downloaded respec-approval-summary.md');
  };

  const handleShare = async () => {
    const demoId = typeof window !== 'undefined' ? sessionStorage.getItem('respec-demo-id') : null;
    const isDemo = !!getDemoSpec(demoId ?? '');
    const state: ShareState = {
      v: 1,
      ...(isDemo && demoId ? { demoId } : rawMarkdown ? { raw: rawMarkdown } : {}),
      annotations,
      approvalStatus: 'approved',
    };
    try {
      await navigator.clipboard.writeText(buildShareUrl(state));
      toast.success('Link to the approved review copied');
    } catch {
      toast.error('Could not copy the share link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4"
      onClick={onClose}
    >
      <motion.div
        data-tour="handoff"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-title"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring.smooth}
        className="w-full max-w-lg rounded-2xl bg-gradient-to-br from-emerald-500/25 via-transparent to-green-500/25 p-px"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 id="handoff-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Spec approved
                </h3>
                <p className="text-sm text-muted-foreground">{specName} · ready for handoff</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              `${stats.requirements} requirements`,
              `${stats.design} design`,
              `${stats.tasks} tasks`,
            ].map((chip) => (
              <span key={chip} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {chip}
              </span>
            ))}
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              {stats.coveredRequirements}/{stats.requirements} requirements traced
            </span>
          </div>

          {/* What happens next */}
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Respec packaged this review into a handoff artifact. Pass it back to Kiro to
            generate code from the approved task list — or share the approved canvas with your team.
          </p>

          {/* Actions */}
          <div className="mt-5 space-y-2">
            <Button
              onClick={handleCopy}
              className="w-full justify-center gap-1.5 bg-emerald-600 text-white transition-transform hover:bg-emerald-700 active:scale-[0.98]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied for Kiro' : 'Copy handoff for Kiro'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleDownload} className="justify-center gap-1.5">
                <Download className="h-4 w-4" />
                Download .md
              </Button>
              <Button variant="outline" onClick={handleShare} className="justify-center gap-1.5">
                <Share2 className="h-4 w-4" />
                Share review
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={onReviewAnother}
              className="w-full justify-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Review another spec
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
