'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRespecStore } from '@/lib/store';
import { parseSpec } from '@/lib/spec-parser';
import { demoSpecs, getDemoSpec, DEFAULT_DEMO_ID } from '@/data/sample-specs';
import { toast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Upload, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const accentStyles: Record<
  string,
  { dot: string; ring: string; text: string }
> = {
  emerald: {
    dot: 'bg-emerald-500',
    ring: 'border-emerald-500 ring-2 ring-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    dot: 'bg-purple-500',
    ring: 'border-purple-500 ring-2 ring-purple-500/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
  sky: {
    dot: 'bg-sky-500',
    ring: 'border-sky-500 ring-2 ring-sky-500/30',
    text: 'text-sky-600 dark:text-sky-400',
  },
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
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  );
  const [dragOver, setDragOver] = useState(false);
  const [launching, setLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Precompute counts for each demo's picker card.
  const demoStats = useMemo(
    () =>
      Object.fromEntries(
        demoSpecs.map((s) => {
          const parsed = parseSpec(s.requirements, s.design, s.tasks);
          return [
            s.id,
            {
              req: parsed.requirements.length,
              design: parsed.design.length,
              tasks: parsed.tasks.length,
            },
          ];
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
        if (name.includes('requirement')) {
          setRequirements(content);
        } else if (name.includes('design')) {
          setDesign(content);
        } else if (name.includes('task')) {
          setTasks(content);
        } else {
          // Fill the first empty textarea
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

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
    setRawMarkdown({
      requirements: demo.requirements,
      design: demo.design,
      tasks: demo.tasks,
    });
    sessionStorage.setItem('respec-demo-mode', 'true');
    sessionStorage.setItem('respec-demo-id', demo.id);
    sessionStorage.removeItem('respec-demo-tour-dismissed');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  const handleUpload = () => {
    if (!requirements.trim() && !design.trim() && !tasks.trim()) return;
    const spec = parseSpec(requirements, design, tasks);
    const total =
      spec.requirements.length + spec.design.length + spec.tasks.length;
    if (total === 0) {
      toast.error(
        "Couldn't parse any requirements, design, or tasks. Check the Kiro markdown format.",
      );
      return;
    }
    setSpec(spec);
    setRawMarkdown({ requirements, design, tasks });
    sessionStorage.removeItem('respec-demo-mode');
    sessionStorage.removeItem('respec-demo-id');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  const selectedDemo = getDemoSpec(selectedDemoId) ?? demoSpecs[0];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 sm:p-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 overflow-hidden">
      {/* Gradient mesh orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 dark:bg-emerald-600/10 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-purple-300/20 dark:bg-purple-600/10 blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-sky-300/15 dark:bg-sky-600/8 blur-3xl animate-[float_12s_ease-in-out_infinite_4s]" />
      </div>
      <button
        onClick={toggleDark}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-semibold tracking-tighter">
            Re<span className="text-emerald-600 dark:text-emerald-400">spec</span>
          </h1>
          <p className="mx-auto flex max-w-[34rem] flex-col items-center text-center text-base leading-7 text-muted-foreground">
            <span>Visual annotation layer for spec-driven development.</span>
            <span>Turn Kiro specs into interactive canvases.</span>
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <Button
            variant={activeTab === 'demo' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('demo')}
          >
            Try Demo
          </Button>
          <Button
            variant={activeTab === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('upload')}
          >
            Upload Specs
          </Button>
        </div>

        {activeTab === 'demo' ? (
          <motion.div
            key="demo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-semibold">Pick a sample spec</h2>
                <p className="text-sm text-muted-foreground">
                  Realistic Kiro-generated specs with requirements, design, and
                  tasks already cross-referenced.
                </p>
              </div>

              <div
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                role="radiogroup"
                aria-label="Sample spec"
              >
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
                        'group flex flex-col gap-2 rounded-lg border bg-white p-3 text-left transition-all hover:shadow-md dark:bg-zinc-900',
                        isSelected
                          ? accent.ring
                          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.name}
                        </span>
                        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', accent.dot)} />
                      </div>
                      <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
                        {s.tagline}
                      </p>
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
                className="w-full gap-1.5 active:scale-[0.97] transition-transform bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_30px_rgba(5,150,105,0.5)] animate-[glow-pulse_3s_ease-in-out_infinite]"
              >
                Launch {selectedDemo.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Requirements
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Design
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Tasks
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Drop markdown files here or click to browse"
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {dragOver
                  ? 'Drop your .md files here'
                  : 'Drag & drop .md files or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Files with &quot;requirement&quot;, &quot;design&quot;, or &quot;task&quot; in the name auto-fill the matching field
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) processFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">requirements.md</label>
                {requirements.trim() && <span className="text-[10px] text-muted-foreground">{requirements.split('\n').length} lines</span>}
              </div>
              <Textarea
                placeholder="Paste your Kiro requirements.md here..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-zinc-50 dark:bg-zinc-950/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">design.md</label>
                {design.trim() && <span className="text-[10px] text-muted-foreground">{design.split('\n').length} lines</span>}
              </div>
              <Textarea
                placeholder="Paste your Kiro design.md here..."
                value={design}
                onChange={(e) => setDesign(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-zinc-50 dark:bg-zinc-950/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">tasks.md</label>
                {tasks.trim() && <span className="text-[10px] text-muted-foreground">{tasks.split('\n').length} lines</span>}
              </div>
              <Textarea
                placeholder="Paste your Kiro tasks.md here..."
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-zinc-50 dark:bg-zinc-950/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <Button
              onClick={handleUpload}
              size="lg"
              className="w-full active:scale-[0.97] transition-transform"
              disabled={!requirements.trim() && !design.trim() && !tasks.trim()}
            >
              Parse & Launch Canvas
            </Button>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Built for Kiro
        </p>
      </motion.div>

      <AnimatePresence>
        {launching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-sm text-muted-foreground">Parsing specs...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
