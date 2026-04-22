import { NextRequest, NextResponse } from 'next/server';
import { parseSpec } from '@/lib/spec-parser';

export async function POST(request: NextRequest) {
  try {
    const { requirements, design, tasks } = await request.json();

    if (!requirements && !design && !tasks) {
      return NextResponse.json(
        { error: 'At least one of requirements, design, or tasks must be provided' },
        { status: 400 }
      );
    }

    const spec = parseSpec(
      requirements ?? '',
      design ?? '',
      tasks ?? ''
    );

    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse spec' },
      { status: 500 }
    );
  }
}
