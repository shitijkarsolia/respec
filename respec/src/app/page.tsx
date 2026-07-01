'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRespecStore } from '@/lib/store';
import { parseSpec } from '@/lib/spec-parser';
import { demoSpecs, getDemoSpec, DEFAULT_DEMO_ID } from '@/data/sample-specs';
import { toast } from '@/components/ui/toast';
import { spring } from '@/lib/motion';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Upload, Loader2, ArrowRight,
  Network, Radar, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GITHUB_URL = 'https://github.com/shitijkarsolia/respec';

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

const accentStyles: Record<string, { dot: string; ring: string }> = {
  emerald: { dot: 'bg-emerald-500', ring: 'border-emerald-500 ring-2 ring-emerald-500/30' },
  purple: { dot: 'bg-purple-500', ring: 'border-purple-500 ring-2 ring-purple-500/30' },
  sky: { dot: 'bg-sky-500', ring: 'border-sky-500 ring-2 ring-sky-500/30' },
};

/* ---- Hero "app window" mockup: a faux canvas that sells the product ---- */
function MiniCard({ accent, lines = 2 }: { accent: string; lines?: number }) {
  return (
    <div
      className="rounded-md border border-l-2 bg-white/95 p-1.5 shadow-sm dark:bg-zinc-900/95"
      style={{ borderLeftColor: accent }}
    >
      <div className="mb-1 h-1 w-8 rounded-full" style={{ backgroundColor: accent, opacity: 0.7 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-0.5 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" style={{ width: `${85 - i * 22}%` }} />
      ))}
    </div>
  );
}

function HeroMockup() {
  const cards: { col: number; accent: string; lines: number; drift: number }[] = [
    { col: 0, accent: '#059669', lines: 2, drift: 0 },
    { col: 0, accent: '#059669', lines: 2, drift: 1.2 },
    { col: 1, accent: '#a855f7', lines: 3, drift: 0.6 },
    { col: 2, accent: '#22c55e', lines: 2, drift: 0.3 },
    { col: 2, accent: '#22c55e', lines: 2, drift: 1.5 },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ ...spring.gentle, delay: 0.15 }}
      className="relative mx-auto w-full max-w-lg"
    >
      {/* lighting glow behind the window */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-emerald-400/25 via-purple-400/15 to-green-400/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-900/80">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-200/70 px-3 py-2 dark:border-zinc-700/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">respec / canvas</span>
        </div>
        {/* canvas body */}
        <div className="relative bg-[radial-gradient(circle,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:14px_14px] p-4">
          {/* connectors (0–100 viewBox stretched over the body) */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M33,28 C45,28 42,46 50,46" fill="none" stroke="#059669" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" className="[animation:dashMove_1s_linear_infinite]" />
            <path d="M33,60 C45,60 42,50 50,50" fill="none" stroke="#059669" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" className="[animation:dashMove_1s_linear_infinite]" />
            <path d="M67,48 C78,48 75,30 84,30" fill="none" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" className="[animation:dashMove_1s_linear_infinite]" />
            <path d="M67,48 C78,48 75,64 84,64" fill="none" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" className="[animation:dashMove_1s_linear_infinite]" />
          </svg>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((col) => (
              <div key={col} className="flex flex-col gap-3" style={{ marginTop: col === 1 ? 22 : 0 }}>
                {cards.filter((c) => c.col === col).map((c, i) => (
                  <div key={i} style={{ animation: `drift 5s ease-in-out ${c.drift}s infinite` }}>
                    <MiniCard accent={c.accent} lines={c.lines} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* column labels */}
          <div className="mt-3 grid grid-cols-3 gap-3 text-center text-[8px] font-semibold uppercase tracking-wider">
            <span className="text-emerald-600 dark:text-emerald-400">Requirements</span>
            <span className="text-purple-600 dark:text-purple-400">Design</span>
            <span className="text-green-600 dark:text-green-400">Tasks</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  { icon: Network, accent: 'emerald', title: 'Cross-referenced canvas', body: 'Requirements, design, and tasks on one surface, linked by traceability edges you can follow.' },
  { icon: Radar, accent: 'purple', title: 'Agent drift detection', body: 'DriftDetector and GapFinder surface unlinked tasks and missing coverage as you review.' },
  { icon: CheckCircle2, accent: 'green', title: 'Annotate, compile, approve', body: 'Flag issues, compile structured feedback for Kiro, and approve — all in one loop.' },
];
const featureAccent: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  purple: 'bg-purple-500/10 text-purple-600 ring-purple-500/20 dark:text-purple-400',
  green: 'bg-green-500/10 text-green-600 ring-green-500/20 dark:text-green-400',
};
const featureBar: Record<string, string> = {
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
  green: 'bg-gradient-to-r from-green-500 to-green-400',
};

export default function HomePage() {
  const router = useRouter();
  const { setSpec, setRawMarkdown } = useRespecStore();
  const [requirements, setRequirements] = useState('');
  const [design, setDesign] = useState('');
  const [tasks, setTasks] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'demo'>('demo');
  const [selectedDemoId, setSelectedDemoId] = useState(DEFAULT_DEMO_ID);
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  const [dragOver, setDragOver] = useState(false);
  const [launching, setLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const demoStats = useMemo(
    () =>
      Object.fromEntries(
        demoSpecs.map((s) => {
          const parsed = parseSpec(s.requirements, s.design, s.tasks);
          return [s.id, { req: parsed.requirements.length, design: parsed.design.length, tasks: parsed.tasks.length }];
        }),
      ),
    [],
  );

  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.md')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const name = file.name.toLowerCase();
        if (name.includes('requirement')) setRequirements(content);
        else if (name.includes('design')) setDesign(content);
        else if (name.includes('task')) setTasks(content);
        else {
          setRequirements((prev) => {
            if (!prev.trim()) return content;
            setDesign((prevD) => {
              if (!prevD.trim()) return content;
              setTasks((prevT) => (!prevT.trim() ? content : prevT));
              return prevD;
            });
            return prev;
          });
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('respec-theme', next ? 'dark' : 'light');
  };

  const handleLoadDemo = () => {
    const demo = getDemoSpec(selectedDemoId) ?? demoSpecs[0];
    const spec = parseSpec(demo.requirements, demo.design, demo.tasks);
    setSpec(spec);
    setRawMarkdown({ requirements: demo.requirements, design: demo.design, tasks: demo.tasks });
    sessionStorage.setItem('respec-demo-mode', 'true');
    sessionStorage.setItem('respec-demo-id', demo.id);
    sessionStorage.removeItem('respec-demo-tour-dismissed');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  const handleUpload = () => {
    if (!requirements.trim() && !design.trim() && !tasks.trim()) return;
    const spec = parseSpec(requirements, design, tasks);
    if (spec.requirements.length + spec.design.length + spec.tasks.length === 0) {
      toast.error("Couldn't parse any requirements, design, or tasks. Check the Kiro markdown format.");
      return;
    }
    setSpec(spec);
    setRawMarkdown({ requirements, design, tasks });
    sessionStorage.removeItem('respec-demo-mode');
    sessionStorage.removeItem('respec-demo-id');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  const scrollToPanel = (tab: 'demo' | 'upload') => {
    setActiveTab(tab);
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const selectedDemo = getDemoSpec(selectedDemoId) ?? demoSpecs[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* ---- Ambient background ---- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[65vh] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.12),transparent_70%)] dark:bg-[radial-gradient(70%_55%_at_50%_0%,rgba(16,185,129,0.24),transparent_72%)]" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/25 blur-[100px] dark:bg-emerald-500/25 animate-[float_9s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 -right-16 h-72 w-72 rounded-full bg-purple-300/20 blur-[100px] dark:bg-purple-600/20 animate-[float_11s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-300/15 blur-[100px] dark:bg-sky-600/15 animate-[float_13s_ease-in-out_infinite_4s]" />
        <div className="bg-grain absolute inset-0 opacity-[0.04] mix-blend-overlay dark:opacity-[0.06]" />
      </div>

      {/* ---- Header ---- */}
      <header className="sticky top-0 z-40 border-b border-transparent">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
          <span className="text-base font-bold tracking-tight">
            Re<span className="text-emerald-600 dark:text-emerald-400">spec</span>
          </span>
          <div className="flex items-center gap-1">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-zinc-200/70 hover:text-foreground dark:hover:bg-zinc-800"
              aria-label="View source on GitHub"
            >
              <GithubMark className="h-4 w-4" />
            </a>
            <button
              onClick={toggleDark}
              className="focus-ring flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-6">
        {/* ---- Hero ---- */}
        <section className="grid items-center gap-12 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-8 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.smooth}
            className="text-center lg:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur dark:border-zinc-700/60 dark:bg-zinc-900/60">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Built for Kiro · spec-driven development
            </span>

            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              Review specs on a{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                canvas
              </span>
              , not in a doc.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-7 text-muted-foreground lg:mx-0 lg:text-lg">
              Respec turns Kiro requirements, design, and tasks into one interactive
              review surface — see coverage, flag gaps, compile feedback, and approve.
            </p>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Button
                onClick={handleLoadDemo}
                size="lg"
                className="h-11 w-full gap-1.5 rounded-xl bg-emerald-600 px-6 text-base text-white shadow-[0_8px_24px_-6px_rgba(5,150,105,0.5)] transition-transform hover:bg-emerald-700 active:scale-[0.98] sm:w-auto"
              >
                Launch demo
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => scrollToPanel('upload')}
                variant="outline"
                size="lg"
                className="h-11 w-full gap-1.5 rounded-xl px-6 text-base sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Upload your specs
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center divide-x divide-zinc-200/80 border-t border-zinc-200/60 pt-6 text-sm dark:divide-zinc-800 dark:border-zinc-800/70 lg:justify-start">
              {[['3', 'sample specs'], ['100%', 'client-side'], ['EARS', 'aware parser']].map(([n, l]) => (
                <div key={l} className="flex flex-col px-5 first:pl-0">
                  <span className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">{n}</span>
                  <span className="text-xs text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <HeroMockup />
        </section>

        {/* ---- Picker / Upload panel ---- */}
        <section ref={panelRef} className="mx-auto mt-20 max-w-2xl scroll-mt-24">
          <div className="rounded-2xl bg-gradient-to-b from-white/70 to-transparent p-px dark:from-white/10">
            <div className="rounded-2xl border border-zinc-200/60 bg-card/80 p-5 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-zinc-800/60 sm:p-6">
              <div className="mb-4 flex justify-center gap-2">
                <Button variant={activeTab === 'demo' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('demo')}>
                  Try a sample
                </Button>
                <Button variant={activeTab === 'upload' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('upload')}>
                  Upload specs
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'demo' ? (
                  <motion.div key="demo" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy} className="space-y-4">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Sample spec">
                      {demoSpecs.map((s) => {
                        const stats = demoStats[s.id];
                        const accent = accentStyles[s.accent];
                        const isSelected = s.id === selectedDemoId;
                        return (
                          <button
                            key={s.id}
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedDemoId(s.id)}
                            onDoubleClick={handleLoadDemo}
                            className={cn(
                              'group flex flex-col gap-2 rounded-xl border bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900',
                              isSelected ? accent.ring : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</span>
                              <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', accent.dot)} />
                            </div>
                            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{s.tagline}</p>
                            {stats && (
                              <p className="mt-auto text-[11px] font-medium text-muted-foreground/80">
                                {stats.req} req · {stats.design} design · {stats.tasks} tasks
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleLoadDemo}
                      size="lg"
                      className="w-full gap-1.5 rounded-xl bg-emerald-600 text-white transition-transform hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      Launch {selectedDemo.name}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="upload" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy} className="space-y-4">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                      aria-label="Drop markdown files here or click to browse"
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors',
                        dragOver ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500',
                      )}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {dragOver ? 'Drop your .md files here' : 'Drag & drop .md files or click to browse'}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Files named with &quot;requirement&quot;, &quot;design&quot;, or &quot;task&quot; auto-fill the matching field
                      </p>
                      <input ref={fileInputRef} type="file" accept=".md" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); e.target.value = ''; }} />
                    </div>
                    {([['requirements.md', requirements, setRequirements], ['design.md', design, setDesign], ['tasks.md', tasks, setTasks]] as const).map(([label, value, setter]) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">{label}</label>
                          {value.trim() && <span className="text-[10px] text-muted-foreground">{value.split('\n').length} lines</span>}
                        </div>
                        <Textarea
                          placeholder={`Paste your Kiro ${label} here...`}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          rows={5}
                          className="bg-zinc-50 font-mono text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:bg-zinc-950/80"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={handleUpload}
                      size="lg"
                      className="w-full rounded-xl transition-transform active:scale-[0.98]"
                      disabled={!requirements.trim() && !design.trim() && !tasks.trim()}
                    >
                      Parse & launch canvas
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="mt-20 grid gap-5 sm:mt-24 sm:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ ...spring.smooth, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-card/60 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.18)] dark:border-zinc-800/60"
              >
                <span className={cn('absolute inset-x-0 top-0 h-[3px]', featureBar[f.accent])} />
                <span className={cn('inline-flex size-11 items-center justify-center rounded-xl ring-1 ring-inset', featureAccent[f.accent])}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                <span className="pointer-events-none absolute bottom-4 right-5 font-mono text-2xl font-bold text-zinc-200/70 dark:text-zinc-800/80">0{i + 1}</span>
              </motion.div>
            );
          })}
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="relative border-t border-zinc-200/60 dark:border-zinc-800/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <span className="font-semibold tracking-tight text-foreground">
            Re<span className="text-emerald-600 dark:text-emerald-400">spec</span>
          </span>
          <span className="text-xs">Built for the Kiro spec format · runs entirely in your browser</span>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-colors hover:text-foreground">
            <GithubMark className="h-3.5 w-3.5" /> Source
          </a>
        </div>
      </footer>

      {/* ---- Launch overlay ---- */}
      <AnimatePresence>
        {launching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"
          >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-sm text-muted-foreground">Parsing specs...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
