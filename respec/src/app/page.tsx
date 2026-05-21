'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRespecStore } from '@/lib/store';
import { parseSpec } from '@/lib/spec-parser';
import { sampleRequirements, sampleDesign, sampleTasks } from '@/data/sample-specs';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Upload, Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { setSpec, setRawMarkdown } = useRespecStore();
  const [requirements, setRequirements] = useState('');
  const [design, setDesign] = useState('');
  const [tasks, setTasks] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'demo'>('demo');
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('respec-theme') === 'dark',
  );
  const [dragOver, setDragOver] = useState(false);
  const [launching, setLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      localStorage.setItem('respec-theme', 'dark');
    } else {
      localStorage.setItem('respec-theme', 'light');
    }
  };

  const handleLoadDemo = () => {
    const spec = parseSpec(sampleRequirements, sampleDesign, sampleTasks);
    setSpec(spec);
    setRawMarkdown({
      requirements: sampleRequirements,
      design: sampleDesign,
      tasks: sampleTasks,
    });
    sessionStorage.setItem('respec-demo-mode', 'true');
    sessionStorage.removeItem('respec-demo-tour-dismissed');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  const handleUpload = () => {
    if (!requirements.trim() && !design.trim() && !tasks.trim()) return;
    const spec = parseSpec(requirements, design, tasks);
    setSpec(spec);
    setRawMarkdown({ requirements, design, tasks });
    sessionStorage.removeItem('respec-demo-mode');
    setLaunching(true);
    setTimeout(() => router.push('/canvas'), 600);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 overflow-hidden">
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
            className="space-y-6 text-center"
          >
            <div className="rounded-lg border bg-card p-6 space-y-4 group">
              <h2 className="text-lg font-semibold">Pomodoro Timer Spec</h2>
              <p className="text-sm text-muted-foreground">
                Pre-loaded with a realistic Kiro-generated spec for a Pomodoro
                Timer app. Includes requirements, design, and tasks with
                cross-references.
              </p>
              <div className="relative rounded-md bg-zinc-100 dark:bg-zinc-800/60 p-3 overflow-hidden">
                <div className="flex gap-3 justify-center">
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Req</span>
                    <div className="w-16 h-6 rounded border-l-2 border-emerald-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-1px] transition-transform" />
                    <div className="w-16 h-6 rounded border-l-2 border-emerald-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-2px] transition-transform delay-75" />
                    <div className="w-16 h-6 rounded border-l-2 border-emerald-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-1px] transition-transform delay-150" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Design</span>
                    <div className="w-16 h-6 rounded border-l-2 border-purple-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-2px] transition-transform delay-75" />
                    <div className="w-16 h-6 rounded border-l-2 border-purple-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-1px] transition-transform delay-150" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Tasks</span>
                    <div className="w-16 h-6 rounded border-l-2 border-green-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-1px] transition-transform delay-150" />
                    <div className="w-16 h-6 rounded border-l-2 border-green-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-2px] transition-transform delay-75" />
                    <div className="w-16 h-6 rounded border-l-2 border-green-500 bg-white dark:bg-zinc-900 shadow-sm group-hover:translate-y-[-1px] transition-transform" />
                  </div>
                </div>
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity" preserveAspectRatio="none">
                  <line x1="35%" y1="40%" x2="50%" y2="35%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                  <line x1="65%" y1="45%" x2="80%" y2="50%" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                </svg>
              </div>
              <div className="flex gap-3 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Requirements
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Design Elements
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Tasks
                </span>
              </div>
              <Button onClick={handleLoadDemo} size="lg" className="w-full active:scale-[0.97] transition-transform bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:shadow-[0_0_30px_rgba(5,150,105,0.5)] animate-[glow-pulse_3s_ease-in-out_infinite]">
                Launch Canvas with Demo Data
              </Button>
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
