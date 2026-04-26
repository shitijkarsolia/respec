'use client';

import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  id?: string;
}

function initMermaid(dark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: dark ? 'dark' : 'default',
    themeVariables: dark
      ? {
          darkMode: true,
          background: '#18181b',
          primaryColor: '#a855f7',
          primaryTextColor: '#e4e4e7',
          lineColor: '#71717a',
        }
      : {
          darkMode: false,
          background: '#ffffff',
          primaryColor: '#a855f7',
          primaryTextColor: '#27272a',
          lineColor: '#a1a1aa',
        },
  });
}

export function MermaidRenderer({ code, id }: MermaidRendererProps) {
  const reactId = useId();
  const mermaidId = `mermaid-${id ?? reactId}`.replace(/:/g, '-');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  // Track dark mode so the diagram re-renders when the theme toggles
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  );

  // Observe theme changes on <html> so mermaid re-renders with the correct theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Use a theme-scoped render ID so mermaid re-renders when the theme changes
    const renderKey = `${mermaidId}-${isDark ? 'd' : 'l'}`;
    initMermaid(isDark);

    (async () => {
      try {
        const { svg: rendered } = await mermaid.render(renderKey, code);
        if (!cancelled) {
          setSvg(rendered);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setSvg(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      // Clean up the temp element mermaid may leave behind
      document.getElementById('d' + renderKey)?.remove();
    };
  }, [code, mermaidId, isDark]);

  if (error) {
    return (
      <div className="rounded-md border border-dashed border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 text-xs text-red-600 dark:text-red-400">
        Diagram render failed
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 h-[80px]">
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-h-[200px] overflow-auto rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-1"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
