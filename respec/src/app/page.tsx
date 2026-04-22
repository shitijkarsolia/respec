'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRespecStore } from '@/lib/store';
import { parseSpec } from '@/lib/spec-parser';
import { sampleRequirements, sampleDesign, sampleTasks } from '@/data/sample-specs';
import { motion } from 'framer-motion';

export default function HomePage() {
  const router = useRouter();
  const { setSpec, setRawMarkdown } = useRespecStore();
  const [requirements, setRequirements] = useState('');
  const [design, setDesign] = useState('');
  const [tasks, setTasks] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'demo'>('demo');
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

  const toggleDark = () => {
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

  const handleLoadDemo = () => {
    const spec = parseSpec(sampleRequirements, sampleDesign, sampleTasks);
    setSpec(spec);
    setRawMarkdown({
      requirements: sampleRequirements,
      design: sampleDesign,
      tasks: sampleTasks,
    });
    router.push('/canvas');
  };

  const handleUpload = () => {
    if (!requirements.trim() && !design.trim() && !tasks.trim()) return;
    const spec = parseSpec(requirements, design, tasks);
    setSpec(spec);
    setRawMarkdown({ requirements, design, tasks });
    router.push('/canvas');
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <button
        onClick={toggleDark}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Toggle dark mode"
      >
        {dark ? '☀️' : '🌙'}
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">
            Re<span className="text-blue-500">spec</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Visual annotation layer for spec-driven development.
            <br />
            Turn Kiro specs into interactive canvases.
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
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold">Pomodoro Timer Spec</h2>
              <p className="text-sm text-muted-foreground">
                Pre-loaded with a realistic Kiro-generated spec for a Pomodoro
                Timer app. Includes requirements, design, and tasks with
                cross-references.
              </p>
              <div className="flex gap-3 justify-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
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
              <Button onClick={handleLoadDemo} size="lg" className="w-full">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">requirements.md</label>
              <Textarea
                placeholder="Paste your Kiro requirements.md here..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">design.md</label>
              <Textarea
                placeholder="Paste your Kiro design.md here..."
                value={design}
                onChange={(e) => setDesign(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">tasks.md</label>
              <Textarea
                placeholder="Paste your Kiro tasks.md here..."
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <Button
              onClick={handleUpload}
              size="lg"
              className="w-full"
              disabled={!requirements.trim() && !design.trim() && !tasks.trim()}
            >
              Parse & Launch Canvas
            </Button>
          </motion.div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Built for the Kiro Spark Challenge at ASU — April 2026
        </p>
      </motion.div>
    </div>
  );
}
