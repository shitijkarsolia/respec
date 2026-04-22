import * as vscode from 'vscode';
import * as path from 'path';
import type { Annotation, ParsedSpec } from './types';

export class FeedbackWriter {
  private async getRespecDir(): Promise<string | undefined> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) return undefined;
    const dir = path.join(root, '.kiro', 'respec');
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dir));
    return dir;
  }

  async writeFeedback(payload: {
    annotations: Record<string, Annotation[]>;
    spec: ParsedSpec;
  }): Promise<void> {
    const dir = await this.getRespecDir();
    if (!dir) return;

    const grouped: Record<string, Annotation[]> = {
      requirement: [],
      design: [],
      task: [],
    };

    for (const list of Object.values(payload.annotations)) {
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
    const feedbackPath = path.join(dir, 'feedback.md');
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(feedbackPath),
      Buffer.from(feedback, 'utf-8')
    );

    vscode.window.showInformationMessage('Feedback sent to Kiro via hook.');
  }

  async writeApproval(): Promise<void> {
    const dir = await this.getRespecDir();
    if (!dir) return;

    const statusPath = path.join(dir, 'status.json');
    const status = JSON.stringify({
      approved: true,
      timestamp: new Date().toISOString(),
    }, null, 2);

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(statusPath),
      Buffer.from(status, 'utf-8')
    );
  }
}
