import { NextRequest, NextResponse } from 'next/server';
import type { ParsedSpec, AgentInsight } from '@/lib/types';
import { findOrphanedRequirements, findUnlinkedTasks } from '@/lib/cross-linker';

export async function POST(request: NextRequest) {
  try {
    const { spec } = (await request.json()) as { spec: ParsedSpec };

    if (!spec) {
      return NextResponse.json({ error: 'spec is required' }, { status: 400 });
    }

    // Simulate agent thinking
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const insights: AgentInsight[] = [];

    const orphaned = findOrphanedRequirements(spec);
    for (const id of orphaned) {
      insights.push({
        id: crypto.randomUUID(),
        agentName: 'DriftDetector',
        severity: 'warning',
        targetId: id,
        message: `Requirement ${id} is not referenced by any task`,
        accepted: false,
      });
    }

    const unlinked = findUnlinkedTasks(spec);
    for (const id of unlinked) {
      insights.push({
        id: crypto.randomUUID(),
        agentName: 'DriftDetector',
        severity: 'error',
        targetId: id,
        message: `Task ${id} does not implement any requirement`,
        accepted: false,
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'DriftDetector failed' },
      { status: 500 }
    );
  }
}
