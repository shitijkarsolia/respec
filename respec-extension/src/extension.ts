import * as vscode from 'vscode';
import { SpecReader } from './spec-reader';
import { SpecWatcher } from './spec-watcher';
import { InsightWatcher } from './insight-watcher';
import { FeedbackWriter } from './feedback-writer';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  const specReader = new SpecReader();
  const feedbackWriter = new FeedbackWriter();

  const openCanvas = vscode.commands.registerCommand('respec.openCanvas', () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'respecCanvas',
      'Respec',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist'),
        ],
      }
    );

    panel.webview.html = getWebviewHtml(panel.webview, context.extensionUri);

    // Send initial spec data once webview is ready
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'webview:ready': {
            const spec = await specReader.readSpecs();
            if (spec) {
              panel?.webview.postMessage({ type: 'spec:loaded', payload: spec });
            }
            const insights = await specReader.readInsights();
            if (insights.length > 0) {
              panel?.webview.postMessage({ type: 'insights:updated', payload: insights });
            }
            break;
          }
          case 'feedback:submit': {
            await feedbackWriter.writeFeedback(message.payload);
            break;
          }
          case 'spec:approve': {
            await feedbackWriter.writeApproval();
            vscode.window.showInformationMessage('Spec approved! Kiro will begin executing tasks.');
            break;
          }
          case 'spec:refresh': {
            const spec = await specReader.readSpecs();
            if (spec) {
              panel?.webview.postMessage({ type: 'spec:loaded', payload: spec });
            }
            break;
          }
        }
      },
      undefined,
      context.subscriptions
    );

    panel.onDidDispose(() => {
      panel = undefined;
    });
  });

  // File watchers
  const specWatcher = new SpecWatcher((spec) => {
    panel?.webview.postMessage({ type: 'spec:loaded', payload: spec });
  });

  const insightWatcher = new InsightWatcher((insights) => {
    panel?.webview.postMessage({ type: 'insights:updated', payload: insights });
  });

  context.subscriptions.push(openCanvas, specWatcher, insightWatcher);

  // Auto-open if .kiro/specs exists
  specReader.hasSpecs().then((has) => {
    if (has && !panel) {
      vscode.commands.executeCommand('respec.openCanvas');
    }
  });
}

export function deactivate() {
  panel?.dispose();
}

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const distUri = vscode.Uri.joinPath(extensionUri, 'webview', 'dist');
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'index.css'));
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
  <link rel="stylesheet" href="${styleUri}">
  <title>Respec</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
