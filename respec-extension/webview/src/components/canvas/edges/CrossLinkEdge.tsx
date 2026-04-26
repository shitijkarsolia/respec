'use client';

import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import { useRespecStore } from '@/lib/store';

const typeColors: Record<string, { from: string; to: string }> = {
  implements: { from: '#059669', to: '#34d399' },
  depends: { from: '#f59e0b', to: '#fbbf24' },
  conflicts: { from: '#ef4444', to: '#f87171' },
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
  const isActive = hoveredNodeId === source || hoveredNodeId === target;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const linkType = (data?.type as string) ?? 'implements';
  const colors = typeColors[linkType] ?? typeColors.implements;
  const strength = typeof data?.strength === 'number' ? data.strength : 0.6;
  const opacity = isActive ? Math.max(0.4, Math.min(1.0, strength)) : 0.12;
  const gradientId = `grad-${id}`;
  const filterId = `glow-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        {isActive && (
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
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
        style={{
          stroke: 'transparent',
          strokeWidth: 16,
          fill: 'none',
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: isActive ? 'none' : '6 4',
          opacity,
          filter: isActive ? `url(#${filterId})` : undefined,
          transition: 'opacity 0.3s ease, stroke-width 0.3s ease',
          animation: isActive ? undefined : 'dashMove 1s linear infinite',
        }}
      />
      {isActive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              pointerEvents: 'none',
            }}
            className="rounded-full bg-zinc-900/80 dark:bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium text-white dark:text-zinc-900 backdrop-blur-sm"
          >
            {(data?.type as string) ?? 'implements'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default React.memo(CrossLinkEdge);
