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
        message: `${id} has no task implementing it`,
        suggestion: `Add a task that implements ${id}, or move it to a later milestone.`,
        accepted: false,
      });
    }

    const unlinked = findUnlinkedTasks(spec);
    for (const id of unlinked) {
      const task = spec.tasks.find((t) => t.id === id);
      const title = task?.title ? ` ("${task.title}")` : '';
      insights.push({
        id: crypto.randomUUID(),
        agentName: 'DriftDetector',
        severity: 'error',
        targetId: id,
        message: `${id}${title} doesn't trace to any requirement`,
        suggestion: `Link ${id} to the requirement it satisfies, or flag it as out of scope.`,
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
