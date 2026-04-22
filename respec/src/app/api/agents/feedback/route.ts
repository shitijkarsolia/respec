import { NextRequest, NextResponse } from 'next/server';
import type { Annotation, ParsedSpec } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { annotations, spec } = (await request.json()) as {
      annotations: Record<string, Annotation[]>;
      spec: ParsedSpec;
    };

    if (!annotations || !spec) {
      return NextResponse.json(
        { error: 'annotations and spec are required' },
        { status: 400 }
      );
    }

    // Simulate agent thinking
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Group annotations by targetType
    const grouped: Record<string, Annotation[]> = {
      requirement: [],
      design: [],
      task: [],
    };

    for (const list of Object.values(annotations)) {
      for (const ann of list) {
        if (grouped[ann.targetType]) {
          grouped[ann.targetType].push(ann);
        }
      }
    }

    const sections: string[] = ['Please update the spec with the following changes:'];

    const sectionMap: Record<string, string> = {
      requirement: 'Requirements',
      design: 'Design',
      task: 'Tasks',
    };

    for (const [type, label] of Object.entries(sectionMap)) {
      const items = grouped[type];
      if (items.length === 0) continue;

      sections.push(`\n## ${label}`);
      for (const ann of items) {
        const actionLabel = ann.action === 'comment'
          ? 'Comment'
          : `Action: ${ann.action.toUpperCase()}`;
        sections.push(`- [${ann.targetId}] ${actionLabel} — "${ann.content}"`);
      }
    }

    const feedback = sections.join('\n');

    return NextResponse.json({ feedback });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'FeedbackCompiler failed' },
      { status: 500 }
    );
  }
}
