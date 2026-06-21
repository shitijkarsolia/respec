'use client';

import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    // Auto-dismiss after 3s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper so any module can fire a toast without hooks. */
export const toast = {
  success: (message: string) => useToastStore.getState().push(message, 'success'),
  error: (message: string) => useToastStore.getState().push(message, 'error'),
  info: (message: string) => useToastStore.getState().push(message, 'info'),
};

const variantConfig: Record<ToastVariant, { icon: typeof Check; accent: string }> = {
  success: { icon: Check, accent: 'text-emerald-600 dark:text-emerald-400' },
  error: { icon: AlertCircle, accent: 'text-red-600 dark:text-red-400' },
  info: { icon: Info, accent: 'text-sky-600 dark:text-sky-400' },
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[200] flex w-[min(calc(100vw-2rem),22rem)] -translate-x-1/2 flex-col items-center gap-2"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, accent } = variantConfig[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
              role="status"
              className="pointer-events-auto flex w-full items-center gap-2.5 rounded-lg border border-zinc-200/70 bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90"
            >
              <Icon className={cn('h-4 w-4 shrink-0', accent)} />
              <span className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-200">
                {t.message}
              </span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
