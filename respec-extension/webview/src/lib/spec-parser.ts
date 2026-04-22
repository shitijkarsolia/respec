import type { ParsedSpec, Requirement, DesignElement, Task } from './types';

/**
 * Parse Kiro spec markdown files into structured JSON.
 * Handles requirements.md, design.md, and tasks.md formats.
 */

export function parseRequirements(markdown: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = markdown.split('\n');

  // Match patterns like: - **FR-1.1** WHEN ... THE SYSTEM SHALL ...
  // Also handles multi-line requirements
  let currentReq: Partial<Requirement> | null = null;
  let currentRawLines: string[] = [];

  for (const line of lines) {
    const reqMatch = line.match(
      /[-*]\s+\*\*([A-Z]+-[\d.]+)\*\*\s+(.*)/
    );

    if (reqMatch) {
      // Save previous requirement if exists
      if (currentReq?.id) {
        requirements.push(finalizeRequirement(currentReq, currentRawLines.join(' ')));
      }

      const [, id, text] = reqMatch;
      const fullText = text.trim();
      currentReq = { id };
      currentRawLines = [fullText];

      // Detect EARS keyword
      if (/^WHEN\b/i.test(fullText)) currentReq.type = 'WHEN';
      else if (/^WHILE\b/i.test(fullText)) currentReq.type = 'WHILE';
      else if (/^WHERE\b/i.test(fullText)) currentReq.type = 'WHERE';
      else if (/^IF\b/i.test(fullText)) currentReq.type = 'IF';
      else currentReq.type = 'SHALL';

      // Extract trigger and response
      const shallSplit = fullText.split(/THE SYSTEM SHALL\s*/i);
      if (shallSplit.length >= 2) {
        currentReq.trigger = shallSplit[0].trim();
        currentReq.response = shallSplit.slice(1).join(' ').replace(/\.$/, '').trim();
      } else {
        currentReq.trigger = fullText;
        currentReq.response = '';
      }

      // Detect priority from context
      currentReq.priority = detectPriority(fullText);
    } else if (currentReq && line.match(/^\s{2,}/) && line.trim()) {
      // Continuation line (indented)
      currentRawLines.push(line.trim());
      if (!currentReq.response && line.toLowerCase().includes('shall')) {
        const shallSplit = line.split(/THE SYSTEM SHALL\s*/i);
        if (shallSplit.length >= 2) {
          currentReq.response = shallSplit.slice(1).join(' ').replace(/\.$/, '').trim();
        }
      }
    }
  }

  // Don't forget the last one
  if (currentReq?.id) {
    requirements.push(finalizeRequirement(currentReq, currentRawLines.join(' ')));
  }

  return requirements;
}

function detectPriority(text: string): 'must' | 'should' | 'could' {
  const lower = text.toLowerCase();
  if (lower.includes('shall') || lower.includes('must')) return 'must';
  if (lower.includes('should')) return 'should';
  if (lower.includes('could') || lower.includes('may')) return 'could';
  return 'must'; // default
}

function finalizeRequirement(partial: Partial<Requirement>, rawText: string): Requirement {
  return {
    id: partial.id || 'UNKNOWN',
    type: partial.type || 'SHALL',
    trigger: partial.trigger || '',
    response: partial.response || rawText,
    priority: partial.priority || 'must',
    status: 'draft',
    rawText,
  };
}

export function parseDesign(markdown: string): DesignElement[] {
  const elements: DesignElement[] = [];
  const sections = markdown.split(/^### /m).filter(Boolean);
  let counter = 1;

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim().replace(/^#+\s*/, '') || '';
    if (!title || title.startsWith('#')) continue;

    const id = `DE-${counter++}`;
    const bodyLines = lines.slice(1);
    const body = bodyLines.join('\n');

    // Extract mermaid code blocks
    const mermaidMatch = body.match(/```mermaid\n([\s\S]*?)```/);
    const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : undefined;

    // Extract requirement references
    const reqRefs = extractReqReferences(body);

    // Determine type
    let type: DesignElement['type'] = 'component';
    if (mermaidCode) type = 'diagram';
    else if (/api|endpoint|route/i.test(title)) type = 'api';
    else if (/data|model|schema|database/i.test(title)) type = 'dataModel';

    // Build description from bullet points
    const bullets = bodyLines
      .filter((l) => l.match(/^[-*]\s/))
      .map((l) => l.replace(/^[-*]\s+/, '').trim())
      .slice(0, 5);

    elements.push({
      id,
      type,
      title,
      description: bullets.join('. ') || body.slice(0, 200).trim(),
      mermaidCode,
      implementsRequirements: reqRefs,
    });
  }

  return elements;
}

export function parseTasks(markdown: string): Task[] {
  const tasks: Task[] = [];
  const lines = markdown.split('\n');
  let currentTask: Partial<Task> | null = null;

  for (const line of lines) {
    // Match task headers like: ### T-1: Project Scaffolding
    const taskHeaderMatch = line.match(/^###\s+(T-\d+):\s+(.*)/);
    if (taskHeaderMatch) {
      if (currentTask?.id) {
        tasks.push(finalizeTask(currentTask));
      }
      const [, id, title] = taskHeaderMatch;
      currentTask = {
        id,
        title: title.trim(),
        status: 'todo',
        implementsRequirements: [],
        implementsDesign: [],
        subtasks: [],
      };
      continue;
    }

    if (!currentTask) continue;

    // Match checkbox items: - [ ] / - [x] / - [-]
    const checkboxMatch = line.match(/^[-*]\s+\[([ x-])\]\s+(.*)/);
    if (checkboxMatch) {
      const [, state, text] = checkboxMatch;
      currentTask.subtasks = currentTask.subtasks || [];
      currentTask.subtasks.push(text.trim());

      // If any subtask is done, task is in-progress; if all done, task is done
      if (state === 'x') {
        currentTask.status = currentTask.status === 'todo' ? 'in-progress' : currentTask.status;
      } else if (state === '-') {
        currentTask.status = 'in-progress';
      }
      continue;
    }

    // Match implements line: - **Implements:** FR-1.1, FR-1.2
    const implMatch = line.match(/\*\*Implements:\*\*\s*(.*)/);
    if (implMatch) {
      const refs = extractReqReferences(implMatch[1]);
      currentTask.implementsRequirements = refs;
    }
  }

  // Don't forget the last task
  if (currentTask?.id) {
    tasks.push(finalizeTask(currentTask));
  }

  return tasks;
}

function finalizeTask(partial: Partial<Task>): Task {
  return {
    id: partial.id || 'UNKNOWN',
    title: partial.title || '',
    status: partial.status || 'todo',
    implementsRequirements: partial.implementsRequirements || [],
    implementsDesign: partial.implementsDesign || [],
    subtasks: partial.subtasks || [],
  };
}

function extractReqReferences(text: string): string[] {
  const matches = text.match(/[A-Z]+-[\d.]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function parseSpec(
  requirementsMd: string,
  designMd: string,
  tasksMd: string
): ParsedSpec {
  return {
    requirements: parseRequirements(requirementsMd),
    design: parseDesign(designMd),
    tasks: parseTasks(tasksMd),
  };
}
