'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useRespecStore } from '@/lib/store';
import { computeCrossLinks } from '@/lib/cross-linker';
import { parseSpec } from '@/lib/spec-parser';
import { sampleRequirements, sampleDesign, sampleTasks } from '@/data/sample-specs';
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

export default function CanvasPage() {
  const spec = useRespecStore((s) => s.spec);
  const setSpec = useRespecStore((s) => s.setSpec);
  const setRawMarkdown = useRespecStore((s) => s.setRawMarkdown);
  const setHoveredNodeId = useRespecStore((s) => s.setHoveredNodeId);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const addInsight = useRespecStore((s) => s.addInsight);
  const addAgentLog = useRespecStore((s) => s.addAgentLog);
  const updateAgentLog = useRespecStore((s) => s.updateAgentLog);
  const loaded = useRef(false);
  const agentsRanRef = useRef(false);
  const [visibleCount, setVisibleCount] = useState(0);

  // Auto-load demo data
  useEffect(() => {
    if (!spec && !loaded.current) {
      loaded.current = true;
      const parsed = parseSpec(sampleRequirements, sampleDesign, sampleTasks);
      setSpec(parsed);
      setRawMarkdown({
        requirements: sampleRequirements,
        design: sampleDesign,
        tasks: sampleTasks,
      });
      sessionStorage.setItem('respec-demo-mode', 'true');
    }
  }, [spec, setSpec, setRawMarkdown]);

  const allNodes = useMemo(() => (spec ? buildNodes(spec) : []), [spec]);
  const crossLinks = useMemo(() => (spec ? computeCrossLinks(spec) : []), [spec]);
  const allEdges = useMemo(() => buildEdges(crossLinks), [crossLinks]);

  // Streaming animation: reveal nodes one-by-one
  useEffect(() => {
    if (allNodes.length === 0) return;
    const headerCount = Math.min(3, allNodes.length);
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
  }, [allNodes.length]);

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

  // Keyboard navigation
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  const contentNodeIds = useMemo(
    () => nodes.filter((n) => !n.id.startsWith('header-')).map((n) => n.id),
    [nodes],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept keyboard events when focus is inside an input, textarea, select, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        return;
      }

      if (!contentNodeIds.length) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIdx = selectedNodeId ? contentNodeIds.indexOf(selectedNodeId) : -1;
        const next = e.shiftKey
          ? (currentIdx <= 0 ? contentNodeIds.length - 1 : currentIdx - 1)
          : (currentIdx >= contentNodeIds.length - 1 ? 0 : currentIdx + 1);
        setSelectedNodeId(contentNodeIds[next]);
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = selectedNodeId ? contentNodeIds.indexOf(selectedNodeId) : -1;
        const next = e.key === 'ArrowDown'
          ? Math.min(currentIdx + 1, contentNodeIds.length - 1)
          : Math.max(currentIdx - 1, 0);
        setSelectedNodeId(contentNodeIds[next]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contentNodeIds, selectedNodeId, setSelectedNodeId]);

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
      <div className="flex-1 relative bg-gradient-to-br from-zinc-50/50 via-transparent to-emerald-50/20 dark:from-zinc-950/50 dark:via-transparent dark:to-emerald-950/10">
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
          <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} color="rgba(161,161,170,0.3)" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'ears') return '#059669';
              if (node.type === 'design') return '#a855f7';
              if (node.type === 'task') return '#22c55e';
              return '#94a3b8';
            }}
            maskColor="rgba(0,0,0,0.08)"
            className="!bg-white/70 dark:!bg-zinc-900/70 !backdrop-blur-md !rounded-lg !border !border-zinc-200/50 dark:!border-zinc-700/50 !shadow-lg"
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
