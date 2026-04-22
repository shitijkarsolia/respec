import * as vscode from 'vscode';
import * as path from 'path';
import type { ParsedSpec, Requirement, DesignElement, Task, AgentInsight } from './types';

export class SpecReader {
  private async getWorkspaceRoot(): Promise<string | undefined> {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  async hasSpecs(): Promise<boolean> {
    const root = await this.getWorkspaceRoot();
    if (!root) return false;
    const specDir = path.join(root, '.kiro', 'specs');
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(specDir));
      return true;
    } catch {
      return false;
    }
  }

  async readSpecs(): Promise<ParsedSpec | null> {
    const root = await this.getWorkspaceRoot();
    if (!root) return null;

    const specDir = path.join(root, '.kiro', 'specs');
    try {
      const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(specDir));
      const dirs = entries.filter(([, type]) => type === vscode.FileType.Directory);

      if (dirs.length === 0) return null;

      // Use the first spec directory found
      const specSubDir = path.join(specDir, dirs[0][0]);

      const reqMd = await this.readFile(path.join(specSubDir, 'requirements.md'));
      const designMd = await this.readFile(path.join(specSubDir, 'design.md'));
      const tasksMd = await this.readFile(path.join(specSubDir, 'tasks.md'));

      return {
        requirements: parseRequirements(reqMd),
        design: parseDesign(designMd),
        tasks: parseTasks(tasksMd),
      };
    } catch {
      return null;
    }
  }

  async readInsights(): Promise<AgentInsight[]> {
    const root = await this.getWorkspaceRoot();
    if (!root) return [];
    const insightsPath = path.join(root, '.kiro', 'respec', 'insights.json');
    try {
      const content = await this.readFile(insightsPath);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      return Buffer.from(bytes).toString('utf-8');
    } catch {
      return '';
    }
  }
}

function parseRequirements(markdown: string): Requirement[] {
  const requirements: Requirement[] = [];
  const lines = markdown.split('\n');
  let currentReq: Partial<Requirement> | null = null;
  let currentRawLines: string[] = [];

  for (const line of lines) {
    const reqMatch = line.match(/[-*]\s+\*\*([A-Z]+-[\d.]+)\*\*\s+(.*)/);
    if (reqMatch) {
      if (currentReq?.id) {
        requirements.push(finalizeReq(currentReq, currentRawLines.join(' ')));
      }
      const [, id, text] = reqMatch;
      const fullText = text.trim();
      currentReq = { id };
      currentRawLines = [fullText];

      if (/^WHEN\b/i.test(fullText)) currentReq.type = 'WHEN';
      else if (/^WHILE\b/i.test(fullText)) currentReq.type = 'WHILE';
      else if (/^WHERE\b/i.test(fullText)) currentReq.type = 'WHERE';
      else if (/^IF\b/i.test(fullText)) currentReq.type = 'IF';
      else currentReq.type = 'SHALL';

      const shallSplit = fullText.split(/THE SYSTEM SHALL\s*/i);
      if (shallSplit.length >= 2) {
        currentReq.trigger = shallSplit[0].trim();
        currentReq.response = shallSplit.slice(1).join(' ').replace(/\.$/, '').trim();
      } else {
        currentReq.trigger = fullText;
        currentReq.response = '';
      }

      const lower = fullText.toLowerCase();
      currentReq.priority = lower.includes('shall') || lower.includes('must') ? 'must'
        : lower.includes('should') ? 'should' : 'could';
    } else if (currentReq && line.match(/^\s{2,}/) && line.trim()) {
      currentRawLines.push(line.trim());
    }
  }
  if (currentReq?.id) {
    requirements.push(finalizeReq(currentReq, currentRawLines.join(' ')));
  }
  return requirements;
}

function finalizeReq(partial: Partial<Requirement>, rawText: string): Requirement {
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

function parseDesign(markdown: string): DesignElement[] {
  const elements: DesignElement[] = [];
  const sections = markdown.split(/^### /m).filter(Boolean);
  let counter = 1;

  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim().replace(/^#+\s*/, '') || '';
    if (!title || title.startsWith('#')) continue;

    const id = `DE-${counter++}`;
    const body = lines.slice(1).join('\n');
    const mermaidMatch = body.match(/```mermaid\n([\s\S]*?)```/);
    const reqRefs = (body.match(/[A-Z]+-[\d.]+/g) || []).filter((v, i, a) => a.indexOf(v) === i);

    let type: DesignElement['type'] = 'component';
    if (mermaidMatch) type = 'diagram';
    else if (/api|endpoint|route/i.test(title)) type = 'api';
    else if (/data|model|schema/i.test(title)) type = 'dataModel';

    const bullets = lines.slice(1)
      .filter((l) => l.match(/^[-*]\s/))
      .map((l) => l.replace(/^[-*]\s+/, '').trim())
      .slice(0, 5);

    elements.push({
      id, type, title,
      description: bullets.join('. ') || body.slice(0, 200).trim(),
      mermaidCode: mermaidMatch ? mermaidMatch[1].trim() : undefined,
      implementsRequirements: reqRefs,
    });
  }
  return elements;
}

function parseTasks(markdown: string): Task[] {
  const tasks: Task[] = [];
  const lines = markdown.split('\n');
  let currentTask: Partial<Task> | null = null;

  for (const line of lines) {
    const taskHeaderMatch = line.match(/^###\s+(T-\d+):\s+(.*)/);
    if (taskHeaderMatch) {
      if (currentTask?.id) tasks.push(finalizeTask(currentTask));
      const [, id, title] = taskHeaderMatch;
      currentTask = { id, title: title.trim(), status: 'todo', implementsRequirements: [], implementsDesign: [], subtasks: [] };
      continue;
    }
    if (!currentTask) continue;

    const checkboxMatch = line.match(/^[-*]\s+\[([ x-])\]\s+(.*)/);
    if (checkboxMatch) {
      const [, state, text] = checkboxMatch;
      currentTask.subtasks = currentTask.subtasks || [];
      currentTask.subtasks.push(text.trim());
      if (state === 'x') currentTask.status = currentTask.status === 'todo' ? 'in-progress' : currentTask.status;
      else if (state === '-') currentTask.status = 'in-progress';
      continue;
    }

    const implMatch = line.match(/\*\*Implements:\*\*\s*(.*)/);
    if (implMatch) {
      const refs = (implMatch[1].match(/[A-Z]+-[\d.]+/g) || []).filter((v, i, a) => a.indexOf(v) === i);
      currentTask.implementsRequirements = refs;
    }
  }
  if (currentTask?.id) tasks.push(finalizeTask(currentTask));
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
