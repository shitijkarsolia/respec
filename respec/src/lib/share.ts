import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import type { Annotation, ApprovalStatus } from './types';

/**
 * Backend-free sharing: the entire review (which spec + annotations + approval
 * state) is serialized, compressed, and packed into the URL hash. Opening the
 * link rehydrates the canvas exactly as the reviewer left it.
 *
 * Built-in demos store only their `demoId` so the link stays short; uploaded
 * specs carry their raw markdown.
 */

export interface ShareState {
  v: 1;
  demoId?: string;
  raw?: { requirements: string; design: string; tasks: string };
  annotations: Record<string, Annotation[]>;
  approvalStatus: ApprovalStatus;
}

const HASH_PREFIX = '#review=';

export function encodeShareState(state: ShareState): string {
  return compressToEncodedURIComponent(JSON.stringify(state));
}

export function decodeShareState(encoded: string): ShareState | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as ShareState;
    if (parsed?.v !== 1) return null;
    // Minimal shape guard.
    parsed.annotations ??= {};
    parsed.approvalStatus ??= 'pending';
    return parsed;
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current origin + /canvas. */
export function buildShareUrl(state: ShareState): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://respec-ai.vercel.app';
  return `${origin}/canvas${HASH_PREFIX}${encodeShareState(state)}`;
}

/** Read and decode shared review state from the current URL hash, if present. */
export function readShareFromHash(): ShareState | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.startsWith(HASH_PREFIX)) return null;
  return decodeShareState(hash.slice(HASH_PREFIX.length));
}

/** Remove the review hash from the URL without reloading (after hydration). */
export function clearShareHash(): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash.startsWith(HASH_PREFIX)) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
