'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
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
import CanvasToolbar from '@/components/canvas/CanvasToolbar';
import type { ParsedSpec, CrossLink, AgentInsight } from '@/lib/types';

const COLUMN_X = { requirements: 0, design: 500, tasks: 1000 };
const CARD_GAP = 220;
const CARD_START_Y = 80;

function buildNodes(spec: ParsedSpec): Node[] {
  const nodes: Node[] = [];

  nodes.push({
    id: 'header-req',
    type: 'default',
    position: { x: COLUMN_X.requirements + 60, y: 0 },
    data: { label: '📋 Requirements' },
    selectable: false,
    draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#3b82f6', width: 200 },
  });
  nodes.push({
    id: 'header-design',
    type: 'default',
    position: { x: COLUMN_X.design + 60, y: 0 },
    data: { label: '🎨 Design' },
    selectable: false,
    draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#a855f7', width: 200 },
  });
  nodes.push({
    id: 'header-tasks',
    type: 'default',
    position: { x: COLUMN_X.tasks + 60, y: 0 },
    data: { label: '✅ Tasks' },
    selectable: false,
    draggable: false,
    style: { background: 'transparent', border: 'none', fontSize: '16px', fontWeight: 700, color: '#22c55e', width: 200 },
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
  const setHoveredNodeId = useRespecStore((s) => s.setHoveredNodeId);
  const setSelectedNodeId = useRespecStore((s) => s.setSelectedNodeId);
  const addInsight = useRespecStore((s) => s.addInsight);
  const addAgentLog = useRespecStore((s) => s.addAgentLog);
  const updateAgentLog = useRespecStore((s) => s.updateAgentLog);
  const loaded = useRef(false);
  const agentsRanRef = useRef(false);

  // Auto-load demo data
  useEffect(() => {
    if (!spec && !loaded.current) {
      loaded.current = true;
      const parsed = parseSpec(sampleRequirements, sampleDesign, sampleTasks);
      setSpec(parsed);
    }
  }, [spec, setSpec]);

  const nodes = useMemo(() => (spec ? buildNodes(spec) : []), [spec]);
  const crossLinks = useMemo(() => (spec ? computeCrossLinks(spec) : []), [spec]);
  const edges = useMemo(() => buildEdges(crossLinks), [crossLinks]);

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

  if (!spec) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <CanvasToolbar />
      <div className="flex-1 flex min-h-0">
      <div className="flex-1 relative">
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
    </div>
  );
}
