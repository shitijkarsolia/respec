interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

let api: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi | undefined {
  if (api) return api;
  try {
    api = acquireVsCodeApi();
    return api;
  } catch {
    return undefined;
  }
}

export function postToExtension(message: { type: string; payload?: unknown }) {
  const vscode = getVsCodeApi();
  if (vscode) {
    vscode.postMessage(message);
  }
}

type MessageHandler = (message: { type: string; payload?: unknown }) => void;

export function onExtensionMessage(handler: MessageHandler) {
  const listener = (event: MessageEvent) => {
    handler(event.data);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
