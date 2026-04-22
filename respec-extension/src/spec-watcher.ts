import * as vscode from 'vscode';
import * as path from 'path';
import type { ParsedSpec } from './types';
import { SpecReader } from './spec-reader';

export class SpecWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher;
  private reader: SpecReader;
  private debounceTimer: NodeJS.Timeout | undefined;

  constructor(private onSpecChange: (spec: ParsedSpec) => void) {
    this.reader = new SpecReader();
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.kiro/specs/**/*.md');

    const handleChange = () => this.debouncedRead();
    this.watcher.onDidChange(handleChange);
    this.watcher.onDidCreate(handleChange);
    this.watcher.onDidDelete(handleChange);
  }

  private debouncedRead() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const spec = await this.reader.readSpecs();
      if (spec) this.onSpecChange(spec);
    }, 500);
  }

  dispose() {
    this.watcher.dispose();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
