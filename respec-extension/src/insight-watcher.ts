import * as vscode from 'vscode';
import * as path from 'path';
import type { AgentInsight } from './types';

export class InsightWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor(private onInsightsChange: (insights: AgentInsight[]) => void) {
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.kiro/respec/insights.json');

    const handleChange = () => this.debouncedRead();
    this.watcher.onDidChange(handleChange);
    this.watcher.onDidCreate(handleChange);
  }

  private debouncedRead() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!root) return;
      const filePath = path.join(root, '.kiro', 'respec', 'insights.json');
      try {
        const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        const content = Buffer.from(bytes).toString('utf-8');
        const insights: AgentInsight[] = JSON.parse(content);
        this.onInsightsChange(insights);
      } catch {
        // File doesn't exist yet or invalid JSON
      }
    }, 300);
  }

  dispose() {
    this.watcher.dispose();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
