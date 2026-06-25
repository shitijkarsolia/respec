import { NextRequest, NextResponse } from 'next/server';
import type { Requirement, AgentInsight } from '@/lib/types';

const GAP_CHECKS: { keywords: RegExp; message: string; suggestion: string }[] = [
  {
    keywords: /error|fail|invalid|exception/i,
    message: 'No error-handling requirements found',
    suggestion: 'Add requirements covering failure paths — invalid input, timeouts, and error messaging.',
  },
  {
    keywords: /auth|security|permission|access control/i,
    message: 'No security or access-control requirements found',
    suggestion: 'Add requirements for authentication, authorization, and permission checks.',
  },
  {
    keywords: /loading|empty|no data|placeholder|skeleton/i,
    message: 'No loading or empty-state requirements found',
    suggestion: 'Specify what the UI shows while data loads and when a list or view is empty.',
  },
  {
    keywords: /mobile|responsive|viewport|breakpoint/i,
    message: 'No responsive/mobile requirements found',
    suggestion: 'Define how the layout adapts across mobile, tablet, and desktop viewports.',
  },
  {
    keywords: /accessib|wcag|aria|keyboard|screen reader/i,
    message: 'No accessibility requirements found',
    suggestion: 'Add WCAG, keyboard-navigation, and screen-reader requirements.',
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
          message: check.message,
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
        message: `Only ${requirements.length} requirement${requirements.length === 1 ? '' : 's'} parsed — the spec looks light`,
        suggestion: 'Break broad requirements into smaller, individually testable statements.',
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
