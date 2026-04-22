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
import { AnimatePresence } from 'framer-motion';
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
    id: 'header-req', type: 'default',
    position: { x: COLUMN_X.requirements + 60, y: 0 },
    data: { label: '📋 Requirements' },
    selectable: false, draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#3b82f6', width: 200 },
  });
  nodes.push({
    id: 'header-design', type: 'default',
    position: { x: COLUMN_X.design + 60, y: 0 },
    data: { label: '🎨 Design' },
    selectable: false, draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#a855f7', width: 200 },
  });
  nodes.push({
    id: 'header-tasks', type: 'default',
    position: { x: COLUMN_X.tasks + 60, y: 0 },
    data: { label: '✅ Tasks' },
    selectable: false, draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#22c55e', width: 200 },
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

  if (!spec) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted-foreground)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            Re<span style={{ color: '#3b82f6' }}>spec</span>
          </h2>
          <p>Waiting for Kiro specs...</p>
          <p style={{ fontSize: '0.75rem', marginTop: 8 }}>Loading demo data in a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex' }}>
      <div style={{ flex: 1, position: 'relative' }}>
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'ears') return '#3b82f6';
              if (node.type === 'design') return '#a855f7';
              if (node.type === 'task') return '#22c55e';
              return '#94a3b8';
            }}
            maskColor="rgba(0,0,0,0.1)"
          />
        </ReactFlow>

        <AnimatePresence>
          <AnnotationPopover />
        </AnimatePresence>

        <ApprovalBar />
      </div>

      <AgentActivityRail />
    </div>
  );
}
