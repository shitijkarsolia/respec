'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CanvasToolbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('respec-theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('respec-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('respec-theme', 'light');
    }
  };

  return (
    <div className="h-12 w-full z-40 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
      <Link href="/" className="text-lg font-bold">
        Re<span className="text-blue-500">spec</span>
      </Link>

      <span className="text-sm text-muted-foreground">Pomodoro Timer Spec</span>

      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
