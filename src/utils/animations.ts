import type { Variants } from "framer-motion";

/**
 * THE GOLDEN RULES (as per user manual):
 * - Duration: 200-500ms
 * - Easing: Ease-Out for appearing, Ease-In for disappearing, Standard for movement.
 */

export const DURATIONS = {
  fast: 0,
  standard: 0.05, // Almost instant
  slow: 0.1,
};

export const EASINGS = {
  out: [0.33, 1, 0.68, 1] as [number, number, number, number],
  in: [0.32, 0, 0.67, 0] as [number, number, number, number],
  standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 1000, damping: 50 } as const, // Very stiff, no bounce
};

// 1. MACRO: Page Transitions - Simplified to instant
export const pageVariants: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.05 },
  },
};

// 2. MICRO: Shared Elements / Cards - Disabled stagger and movement
export const cardVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.05,
    },
  },
};

// 3. MICRO: Interactive Feedback (Buttons, Toggles)
export const pressAnimation = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.02 },
  transition: { type: "spring", stiffness: 500, damping: 15 } as const,
};

// 4. SKELETON: Polished Pulse
export const skeletonPulse: Variants = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.5, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// 5. NARRATIVE: Micro-moments
export const shakeAnimation: Variants = {
  shake: {
    x: [0, -5, 5, -5, 5, 0],
    transition: { duration: 0.4 },
  },
};
