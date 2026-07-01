'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { computeCrossLinks } from '@/lib/cross-linker';
import { parseSpec } from '@/lib/spec-parser';
import { demoSpecs, getDemoSpec, DEFAULT_DEMO_ID } from '@/data/sample-specs';
import { readShareFromHash, clearShareHash } from '@/lib/share';
import { nodeTypes } from '@/components/canvas/nodes';
import { edgeTypes } from '@/components/canvas/edges';
import ApprovalBar from '@/components/canvas/overlays/ApprovalBar';
import AnnotationPopover from '@/components/canvas/overlays/AnnotationPopover';
import GuidedDemoPanel from '@/components/canvas/overlays/GuidedDemoPanel';
import AgentActivityRail from '@/components/rail';
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import type { ParsedSpec, CrossLink, AgentInsight } from '@/lib/types';

const COLUMN_X = { requirements: 0, design: 500, tasks: 1000 };
const CARD_GAP = 220;
const CARD_START_Y = 80;

function buildNodes(spec: ParsedSpec): Node[] {
  const nodes: Node[] = [];

  nodes.push({
    id: 'header-req',
    type: 'columnHeader',
    position: { x: COLUMN_X.requirements + 20, y: 0 },
    data: { label: 'Requirements', color: '#059669', count: spec.requirements.length },
    selectable: false,
    draggable: false,
  });
  nodes.push({
    id: 'header-design',
    type: 'columnHeader',
    position: { x: COLUMN_X.design + 20, y: 0 },
    data: { label: 'Design', color: '#a855f7', count: spec.design.length },
    selectable: false,
    draggable: false,
  });
  nodes.push({
    id: 'header-tasks',
    type: 'columnHeader',
    position: { x: COLUMN_X.tasks + 20, y: 0 },
    data: { label: 'Tasks', color: '#22c55e', count: spec.tasks.length },
    selectable: false,
    draggable: false,
  });

  spec.requirements.forEach((req, i) => {
    nodes.push({
      id: req.id,
      type: 'ears',
      position: { x: COLUMN_X.requirements, y: CARD_START_Y + i * CARD_GAP },
      data: { ...req } as Record<string, unknown>,
    });
  });

  spec.design.forEach((de, i) => {
    nodes.push({
      id: de.id,
      type: 'design',
      position: { x: COLUMN_X.design, y: CARD_START_Y + i * CARD_GAP },
      data: { ...de } as Record<string, unknown>,
    });
  });

  spec.tasks.forEach((task, i) => {
    nodes.push({
      id: task.id,
      type: 'task',
      position: { x: COLUMN_X.tasks, y: CARD_START_Y + i * CARD_GAP },
      data: { ...task } as Record<string, unknown>,
    });
  });

  return nodes;
}

function buildEdges(crossLinks: CrossLink[]): Edge[] {
  return crossLinks.map((link, i) => ({
    id: `edge-${i}`,
    source: link.sourceId,
    target: link.targetId,
    type: 'crosslink',
    data: { type: link.type, strength: link.strength },
  }));
}

// Renders inside <ReactFlow> so it can use useReactFlow to pan the selected node
// into view — the toolbar advertises "Tab navigate", so selection must follow.
function KeyboardNav({ contentNodeIds }: { contentNodeIds: string[] }) {
  const rf = useReactFlow();
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const reduce = useReducedMotion();

  const centerOn = useCallback(
    (id: string) => {
      const n = rf.getNode(id);
      if (!n) return;
      const w = (n.measured?.width ?? n.width ?? 340) as number;
      const h = (n.measured?.height ?? n.height ?? 120) as number;
      const zoom = Math.max(rf.getZoom(), 0.75);
      rf.setCenter(n.position.x + w / 2, n.position.y + h / 2, { zoom, duration: reduce ? 0 : 400 });
    },
    [rf, reduce],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      if (e.key === 'Escape') { setSelectedNodeId(null); return; }
      if (!contentNodeIds.length) return;
      const cur = selectedNodeId ? contentNodeIds.indexOf(selectedNodeId) : -1;
      let next: number | null = null;
      if (e.key === 'Tab') {
        e.preventDefault();
        next = e.shiftKey
          ? (cur <= 0 ? contentNodeIds.length - 1 : cur - 1)
          : (cur >= contentNodeIds.length - 1 ? 0 : cur + 1);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        next = e.key === 'ArrowDown' ? Math.min(cur + 1, contentNodeIds.length - 1) : Math.max(cur - 1, 0);
      }
      if (next !== null) {
        const id = contentNodeIds[next];
        setSelectedNodeId(id);
        centerOn(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contentNodeIds, selectedNodeId, setSelectedNodeId, centerOn]);

  return null;
}

export default function CanvasPage() {
  const spec = useRespecStore((s) => s.spec);
  const setSpec = useRespecStore((s) => s.setSpec);
  const setRawMarkdown = useRespecStore((s) => s.setRawMarkdown);
  const loadReview = useRespecStore((s) => s.loadReview);
  const setHoveredNodeId = useRespecStore((s) => s.setHoveredNodeId);
  const setAdjacency = useRespecStore((s) => s.setAdjacency);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const addInsight = useRespecStore((s) => s.addInsight);
  const addAgentLog = useRespecStore((s) => s.addAgentLog);
  const updateAgentLog = useRespecStore((s) => s.updateAgentLog);
  const loaded = useRef(false);
  const agentsRanRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(0);

  // Resolve which spec to show: shared review link > in-store spec > selected/default demo.
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // 1) A shared review link rehydrates the exact annotated state.
    const shared = readShareFromHash();
    if (shared) {
      const demo = shared.demoId ? getDemoSpec(shared.demoId) : undefined;
      const raw =
        shared.raw ??
        (demo
          ? { requirements: demo.requirements, design: demo.design, tasks: demo.tasks }
          : null);
      if (raw) {
        loadReview({
          spec: parseSpec(raw.requirements, raw.design, raw.tasks),
          rawMarkdown: raw,
          annotations: shared.annotations,
          approvalStatus: shared.approvalStatus,
        });
        // Shared snapshots aren't demo mode — no scripted tour.
        sessionStorage.removeItem('respec-demo-mode');
        if (shared.demoId) sessionStorage.setItem('respec-demo-id', shared.demoId);
        clearShareHash();
        return;
      }
    }

    // 2) Spec already loaded (launched from the home page).
    if (spec) return;

    // 3) Fall back to the selected demo, or the default.
    const demoId =
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('respec-demo-id')) ||
      DEFAULT_DEMO_ID;
    const demo = getDemoSpec(demoId) ?? demoSpecs[0];
    setSpec(parseSpec(demo.requirements, demo.design, demo.tasks));
    setRawMarkdown({
      requirements: demo.requirements,
      design: demo.design,
      tasks: demo.tasks,
    });
    sessionStorage.setItem('respec-demo-mode', 'true');
    sessionStorage.setItem('respec-demo-id', demo.id);
    sessionStorage.removeItem('respec-demo-tour-dismissed');
  }, [spec, setSpec, setRawMarkdown, loadReview]);

  const insights = useRespecStore((s) => s.insights);
  const allNodes = useMemo(() => (spec ? buildNodes(spec) : []), [spec]);
  const crossLinks = useMemo(() => (spec ? computeCrossLinks(spec) : []), [spec]);
  const allEdges = useMemo(() => buildEdges(crossLinks), [crossLinks]);

  // Build an adjacency map so cards can spotlight their connected subgraph.
  useEffect(() => {
    const adj: Record<string, string[]> = {};
    for (const link of crossLinks) {
      (adj[link.sourceId] ??= []).push(link.targetId);
      (adj[link.targetId] ??= []).push(link.sourceId);
    }
    setAdjacency(adj);
  }, [crossLinks, setAdjacency]);

  // Node ids the agents have flagged (used to highlight them on the minimap).
  const flaggedIds = useMemo(
    () =>
      new Set(
        insights
          .filter((i) => !i.accepted && i.targetId)
          .map((i) => i.targetId as string),
      ),
    [insights],
  );

  // Streaming animation: reveal nodes one-by-one (instant if reduced-motion)
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (allNodes.length === 0) return;
    const headerCount = Math.min(3, allNodes.length);
    if (reduceMotion) {
      const t = window.setTimeout(() => setVisibleCount(allNodes.length), 0);
      return () => window.clearTimeout(t);
    }
    let visible = headerCount;
    const startTimer = window.setTimeout(() => setVisibleCount(headerCount), 0);
    if (allNodes.length <= headerCount) {
      return () => window.clearTimeout(startTimer);
    }

    const interval = setInterval(() => {
      visible = Math.min(visible + 1, allNodes.length);
      setVisibleCount(visible);
      if (visible >= allNodes.length) clearInterval(interval);
    }, 120);
    return () => {
      window.clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [allNodes.length, reduceMotion]);

  // Only show nodes up to visibleCount
  const nodes = useMemo(
    () => allNodes.slice(0, visibleCount),
    [allNodes, visibleCount],
  );

  // Only show edges where both source and target are visible
  const visibleNodeIds = useMemo(
    () => new Set(nodes.map((n) => n.id)),
    [nodes],
  );
  const edges = useMemo(
    () => allEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [allEdges, visibleNodeIds],
  );

  // Run agents on load
  useEffect(() => {
    if (!spec || agentsRanRef.current) return;
    agentsRanRef.current = true;

    const driftLogId = crypto.randomUUID();
    addAgentLog({
      id: driftLogId,
      agentName: 'DriftDetector',
      status: 'thinking',
      message: 'Checking spec alignment...',
      timestamp: Date.now(),
    });

    fetch('/api/agents/drift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spec }),
    })
      .then((r) => r.json())
      .then((data) => {
        updateAgentLog(driftLogId, {
          status: 'complete',
          message: `Found ${data.insights?.length || 0} alignment issues`,
        });
        data.insights?.forEach((insight: AgentInsight) => addInsight(insight));
      })
      .catch(() => {
        updateAgentLog(driftLogId, { status: 'error', message: 'DriftDetector failed' });
      });

    const gapLogId = crypto.randomUUID();
    addAgentLog({
      id: gapLogId,
      agentName: 'GapFinder',
      status: 'thinking',
      message: 'Analyzing requirements for gaps...',
      timestamp: Date.now(),
    });

    fetch('/api/agents/gap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirements: spec.requirements }),
    })
      .then((r) => r.json())
      .then((data) => {
        updateAgentLog(gapLogId, {
          status: 'complete',
          message: `Found ${data.insights?.length || 0} suggestions`,
        });
        data.insights?.forEach((insight: AgentInsight) => addInsight(insight));
      })
      .catch(() => {
        updateAgentLog(gapLogId, { status: 'error', message: 'GapFinder failed' });
      });
  }, [spec]); // eslint-disable-line react-hooks/exhaustive-deps

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => setHoveredNodeId(node.id),
    [setHoveredNodeId],
  );

  const onNodeMouseLeave = useCallback(
    () => setHoveredNodeId(null),
    [setHoveredNodeId],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('header-')) return;
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  // Content node ids in tab order (headers excluded); KeyboardNav uses this.
  const contentNodeIds = useMemo(
    () => nodes.filter((n) => !n.id.startsWith('header-')).map((n) => n.id),
    [nodes],
  );

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="space-y-4 w-80">
          <div className="h-8 w-48 mx-auto rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-4 w-64 mx-auto rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="flex gap-4 justify-center mt-8">
            <div className="h-32 w-24 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 animate-pulse" />
            <div className="h-32 w-24 rounded-lg bg-purple-100 dark:bg-purple-900/20 animate-pulse" />
            <div className="h-32 w-24 rounded-lg bg-green-100 dark:bg-green-900/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="h-screen w-screen flex flex-col"
    >
      <CanvasToolbar />
      <div className="flex-1 flex min-h-0">
      <div
        data-tour="canvas-stage"
        role="group"
        aria-label="Spec graph — requirements, design, and tasks. Press Tab or the arrow keys to move between cards, Escape to deselect."
        className="flex-1 relative bg-zinc-50/60 dark:bg-zinc-950"
      >
        {/* Ambient lane wash: emerald → purple → green, left to right */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(16,185,129,0.07),transparent_32%,rgba(168,85,247,0.05)_50%,transparent_68%,rgba(34,197,94,0.07))] dark:bg-[linear-gradient(90deg,rgba(16,185,129,0.10),transparent_32%,rgba(168,85,247,0.08)_50%,transparent_68%,rgba(34,197,94,0.10))]" />
        {/* Soft center lift / vignette to focus the eye inward */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,rgba(255,255,255,0.55),transparent_70%)] dark:bg-[radial-gradient(70%_55%_at_50%_30%,rgba(255,255,255,0.04),transparent_65%)]" />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <KeyboardNav contentNodeIds={contentNodeIds} />
          <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="rgba(148,163,184,0.22)" />
          <Controls />
          <MiniMap
            ariaLabel="Spec minimap"
            nodeColor={(node) => {
              if (flaggedIds.has(node.id)) return '#f59e0b';
              if (node.type === 'ears') return '#059669';
              if (node.type === 'design') return '#a855f7';
              if (node.type === 'task') return '#22c55e';
              return '#94a3b8';
            }}
            maskColor="rgba(0,0,0,0.12)"
            className="!bg-white/80 dark:!bg-zinc-900/85 !backdrop-blur-md !rounded-lg !border !border-zinc-200/60 dark:!border-zinc-700/70 !shadow-lg"
          />
        </ReactFlow>

        <AnimatePresence>
          <AnnotationPopover />
        </AnimatePresence>

        <GuidedDemoPanel />
        <ApprovalBar />
      </div>

      <AgentActivityRail />
      </div>
    </motion.div>
  );
}
