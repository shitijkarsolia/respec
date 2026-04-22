import { NextRequest, NextResponse } from 'next/server';
import type { Requirement, AgentInsight } from '@/lib/types';

const GAP_CHECKS: { keywords: RegExp; suggestion: string }[] = [
  {
    keywords: /error|fail|invalid/i,
    suggestion: 'Consider adding error handling requirements',
  },
  {
    keywords: /auth|security|permission/i,
    suggestion: 'Consider adding security/authentication requirements',
  },
  {
    keywords: /loading|empty|no data/i,
    suggestion: 'Consider adding empty state and loading state requirements',
  },
  {
    keywords: /mobile|responsive/i,
    suggestion: 'Consider adding responsive/mobile requirements',
  },
];

export async function POST(request: NextRequest) {
  try {
    const { requirements } = (await request.json()) as { requirements: Requirement[] };

    if (!requirements) {
      return NextResponse.json({ error: 'requirements is required' }, { status: 400 });
    }

    // Simulate agent thinking
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const insights: AgentInsight[] = [];
    const allText = requirements.map((r) => r.rawText).join(' ');

    for (const check of GAP_CHECKS) {
      if (!check.keywords.test(allText)) {
        insights.push({
          id: crypto.randomUUID(),
          agentName: 'GapFinder',
          severity: 'info',
          message: check.suggestion,
          suggestion: check.suggestion,
          accepted: false,
        });
      }
    }

    if (requirements.length < 5) {
      insights.push({
        id: crypto.randomUUID(),
        agentName: 'GapFinder',
        severity: 'info',
        message: 'Spec seems light — consider breaking down requirements further',
        suggestion: 'Spec seems light — consider breaking down requirements further',
        accepted: false,
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'GapFinder failed' },
      { status: 500 }
    );
  }
}
