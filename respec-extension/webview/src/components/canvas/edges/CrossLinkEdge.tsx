

import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useRespecStore } from '@/lib/store';

const typeColors: Record<string, string> = {
  implements: '#3b82f6',
  depends: '#f59e0b',
  conflicts: '#ef4444',
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

  const color = typeColors[(data?.type as string) ?? 'implements'] ?? '#3b82f6';
  const strength = typeof data?.strength === 'number' ? data.strength : 0.6;
  const opacity = isActive ? Math.max(0.3, Math.min(1.0, strength)) : 0.1;
  const filterId = `glow-${id}`;

  return (
    <>
      <defs>
        {isActive && (
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 2.5 : 1.5,
          strokeDasharray: '6 4',
          opacity,
          filter: isActive ? `url(#${filterId})` : undefined,
          animation: 'dashMove 1s linear infinite',
        }}
      />
      <style>
        {`
          @keyframes dashMove {
            to { stroke-dashoffset: -20; }
          }
        `}
      </style>
    </>
  );
}

export default React.memo(CrossLinkEdge);
