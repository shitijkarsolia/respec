'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Makes every framer-motion animation honor the OS "reduce motion" setting.
 * The CSS @media block in globals.css only catches CSS animations — this covers
 * the JS-driven transforms (card hovers, entrances, drawer slides, etc.).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
