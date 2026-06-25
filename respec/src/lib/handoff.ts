import type { ParsedSpec } from './types';
import { findUnlinkedTasks } from './cross-linker';

/**
 * Helpers that turn an approved spec into a handoff artifact — the thing a
 * reviewer passes back to Kiro (or a teammate) to start implementation.
 */

export interface HandoffStats {
  requirements: number;
  design: number;
  tasks: number;
  linkedTasks: number;
  unlinkedTasks: number;
  coveredRequirements: number;
  coveragePct: number;
}

export function computeHandoffStats(spec: ParsedSpec): HandoffStats {
  const reqIds = new Set(spec.requirements.map((r) => r.id));
  const covered = new Set<string>();
  for (const t of spec.tasks) {
    for (const r of t.implementsRequirements) {
      if (reqIds.has(r)) covered.add(r);
    }
  }
  const unlinked = findUnlinkedTasks(spec).length;
  const requirements = spec.requirements.length;
  return {
    requirements,
    design: spec.design.length,
    tasks: spec.tasks.length,
    linkedTasks: spec.tasks.length - unlinked,
    unlinkedTasks: unlinked,
    coveredRequirements: covered.size,
    coveragePct: requirements ? Math.round((covered.size / requirements) * 100) : 0,
  };
}

/** Short message to paste back into Kiro / a coding agent to kick off the build. */
export function buildHandoffNote(spec: ParsedSpec, specName: string): string {
  const s = computeHandoffStats(spec);
  return [
    `Spec "${specName}" is approved for implementation.`,
    '',
    `Scope: ${s.requirements} requirements, ${s.design} design element${s.design === 1 ? '' : 's'}, ${s.tasks} tasks. ` +
      `${s.coveredRequirements}/${s.requirements} requirements are traced to tasks.`,
    '',
    `Next: generate code from the approved task list and implement each task in order.`,
  ].join('\n');
}

/** Fuller Markdown approval record, suitable for download / a PR description. */
export function buildApprovalSummary(spec: ParsedSpec, specName: string, date: string): string {
  const s = computeHandoffStats(spec);
  const lines: string[] = [
    `# Approval Summary — ${specName}`,
    '',
    `**Status:** Approved for implementation`,
    `**Reviewed:** ${date}`,
    `**Reviewer:** reviewer`,
    '',
    '## Coverage',
    `- Requirements: ${s.requirements}`,
    `- Design elements: ${s.design}`,
    `- Tasks: ${s.tasks} (${s.linkedTasks} traced, ${s.unlinkedTasks} unlinked)`,
    `- Requirements traced to tasks: ${s.coveredRequirements}/${s.requirements} (${s.coveragePct}%)`,
    '',
    '## Tasks',
  ];
  for (const t of spec.tasks) {
    const impl = t.implementsRequirements.length
      ? `implements ${t.implementsRequirements.join(', ')}`
      : 'no requirement linked';
    lines.push(`- [${t.status === 'done' ? 'x' : ' '}] ${t.id}: ${t.title} — ${impl}`);
  }
  lines.push('', '## Next step', 'Hand this approved spec back to Kiro to generate code from the task list.');
  return lines.join('\n');
}
