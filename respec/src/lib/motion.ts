import type { Transition } from 'framer-motion';

/**
 * One spring vocabulary for the whole app so motion feels coherent.
 * Use these instead of ad-hoc stiffness/damping values.
 */
export const spring = {
  /** Buttons, toggles, small press/hover feedback — instant. */
  snappy: { type: 'spring', stiffness: 400, damping: 32 } as Transition,
  /** Default for panels, cards, popovers, toasts. */
  smooth: { type: 'spring', stiffness: 220, damping: 26 } as Transition,
  /** Large surfaces, drawers, page transitions. */
  gentle: { type: 'spring', stiffness: 150, damping: 24 } as Transition,
  /** Celebratory / attention pops (approve, success check). */
  emphasis: { type: 'spring', stiffness: 500, damping: 18 } as Transition,
};

/** Standard entrance for a card/panel: fade + rise + settle. */
export const riseIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: spring.smooth,
};
