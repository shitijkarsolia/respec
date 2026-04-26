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
import AgentActivityRail from '@/components/rail';
import { postToExtension, onExtensionMessage } from './vscode';
import type { ParsedSpec, CrossLink, AgentInsight } from '@/lib/types';

const COLUMN_X = { requirements: 0, design: 500, tasks: 1000 };
const CARD_GAP = 220;
const CARD_START_Y = 80;

function buildNodes(spec: ParsedSpec): Node[] {
  const nodes: Node[] = [];

  nodes.push({
    id: 'header-req', type: 'columnHeader',
    position: { x: COLUMN_X.requirements + 20, y: 0 },
    data: { label: 'Requirements', color: '#059669', count: spec.requirements.length },
    selectable: false, draggable: false,
  });
  nodes.push({
    id: 'header-design', type: 'columnHeader',
    position: { x: COLUMN_X.design + 20, y: 0 },
    data: { label: 'Design', color: '#a855f7', count: spec.design.length },
    selectable: false, draggable: false,
  });
  nodes.push({
    id: 'header-tasks', type: 'columnHeader',
    position: { x: COLUMN_X.tasks + 20, y: 0 },
    data: { label: 'Tasks', color: '#22c55e', count: spec.tasks.length },
    selectable: false, draggable: false,
  });

  spec.requirements.forEach((req, i) => {
    nodes.push({
      id: req.id, type: 'ears',
      position: { x: COLUMN_X.requirements, y: CARD_START_Y + i * CARD_GAP },
      data: { ...req } as Record<string, unknown>,
    });
  });

  spec.design.forEach((de, i) => {
    nodes.push({
      id: de.id, type: 'design',
      position: { x: COLUMN_X.design, y: CARD_START_Y + i * CARD_GAP },
      data: { ...de } as Record<string, unknown>,
    });
  });

  spec.tasks.forEach((task, i) => {
    nodes.push({
      id: task.id, type: 'task',
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

export default function App() {
  const spec = useRespecStore((s) => s.spec);
  const setSpec = useRespecStore((s) => s.setSpec);
  const setInsights = useRespecStore((s) => s.setInsights);
  const setHoveredNodeId = useRespecStore((s) => s.setHoveredNodeId);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const loaded = useRef(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const streamingRef = useRef(false);

  // Listen for messages from extension host
  useEffect(() => {
    const cleanup = onExtensionMessage((message) => {
      switch (message.type) {
        case 'spec:loaded':
          setSpec(message.payload as ParsedSpec);
          break;
        case 'insights:updated':
          setInsights(message.payload as AgentInsight[]);
          break;
        case 'feedback:applied':
          break;
      }
    });

    // Tell extension we're ready
    postToExtension({ type: 'webview:ready' });

    return cleanup;
  }, [setSpec, setInsights]);

  // Fallback: load demo data if no spec received after 2s
  useEffect(() => {
    if (spec || loaded.current) return;
    const timer = setTimeout(() => {
      if (!useRespecStore.getState().spec && !loaded.current) {
        loaded.current = true;
        const parsed = parseSpec(sampleRequirements, sampleDesign, sampleTasks);
        setSpec(parsed);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [spec, setSpec]);

  const allNodes = useMemo(() => (spec ? buildNodes(spec) : []), [spec]);
  const crossLinks = useMemo(() => (spec ? computeCrossLinks(spec) : []), [spec]);
  const allEdges = useMemo(() => buildEdges(crossLinks), [crossLinks]);

  // Streaming animation
  useEffect(() => {
    if (allNodes.length === 0 || streamingRef.current) return;
    streamingRef.current = true;
    setVisibleCount(3);
    const contentNodes = allNodes.length - 3;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleCount(3 + i);
      if (i >= contentNodes) clearInterval(interval);
    }, 120);
    return () => clearInterval(interval);
  }, [allNodes.length]);

  const nodes = useMemo(() => allNodes.slice(0, visibleCount), [allNodes, visibleCount]);
  const visibleNodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);
  const edges = useMemo(
    () => allEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [allEdges, visibleNodeIds],
  );

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => setHoveredNodeId(node.id),
    [setHoveredNodeId],
  );
  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), [setHoveredNodeId]);
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
      style={{ height: '100vh', width: '100vw', display: 'flex' }}
    >
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

        <ApprovalBar />
      </div>

      <AgentActivityRail />
    </motion.div>
  );
}
