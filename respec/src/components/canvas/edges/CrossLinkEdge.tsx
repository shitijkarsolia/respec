'use client';

import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { useRespecStore } from '@/lib/store';

const typeColors: Record<string, { from: string; to: string; label: string }> = {
  implements: { from: '#059669', to: '#34d399', label: 'implements' },
  depends: { from: '#f59e0b', to: '#fbbf24', label: 'depends on' },
  conflicts: { from: '#ef4444', to: '#f87171', label: 'conflicts' },
};

// Dash pattern encodes link type so it reads without hovering.
const dashFor = (type: string): string | undefined => {
  if (type === 'depends') return '1 7';
  if (type === 'conflicts') return '9 6';
  return undefined; // implements = solid
};

function CrossLinkEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps) {
  const hoveredNodeId = useRespecStore((s) => s.hoveredNodeId);
  const selectedNodeId = useRespecStore((s) => s.selectedNodeId);
  // Hover is the exploratory mode (brighten this, dim the rest); selection just
  // brightens its own links so context stays intact while annotating.
  const hoverActive = hoveredNodeId != null && (hoveredNodeId === source || hoveredNodeId === target);
  const selectActive = selectedNodeId != null && (selectedNodeId === source || selectedNodeId === target);
  const isActive = hoverActive || selectActive;
  const isDimmed = hoveredNodeId != null && !hoverActive;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.4,
  });

  const linkType = (data?.type as string) ?? 'implements';
  const colors = typeColors[linkType] ?? typeColors.implements;
  const strength = typeof data?.strength === 'number' ? data.strength : 0.6;

  // Resting links are now clearly visible; active pops, unrelated dim away.
  const coreOpacity = isActive ? 1 : isDimmed ? 0.06 : 0.5;
  const haloOpacity = isActive ? 0.28 : isDimmed ? 0 : 0.12;
  const coreWidth = isActive ? 3 : 2;
  const haloWidth = isActive ? 9 : 5;

  const gradientId = `grad-${id}`;
  const filterId = `glow-${id}`;
  const dash = dashFor(linkType);
  const transition = 'opacity 0.25s ease, stroke-width 0.25s ease';

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        {isActive && (
          <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Wider invisible hit area for hover */}
      <BaseEdge
        id={`${id}-hitarea`}
        path={edgePath}
        style={{ stroke: 'transparent', strokeWidth: 18, fill: 'none' }}
      />

      {/* Soft halo so the line reads on both the dot-grid and white cards */}
      <BaseEdge
        id={`${id}-halo`}
        path={edgePath}
        style={{
          stroke: colors.from,
          strokeWidth: haloWidth,
          strokeLinecap: 'round',
          opacity: haloOpacity,
          filter: isActive ? `url(#${filterId})` : undefined,
          transition,
        }}
      />

      {/* Gradient core */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: coreWidth,
          strokeLinecap: 'round',
          strokeDasharray: dash,
          opacity: coreOpacity,
          transition,
        }}
      />

      {isActive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
            }}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-zinc-700 shadow-lg backdrop-blur-sm dark:border-zinc-700/70 dark:bg-zinc-900/90 dark:text-zinc-200"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: colors.from }}
            />
            {colors.label}
            <span className="text-zinc-400 dark:text-zinc-500">·</span>
            <span className="tabular-nums text-zinc-400 dark:text-zinc-500">
              {Math.round(strength * 100)}%
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default React.memo(CrossLinkEdge);
