"use client";

import { usePathname } from "next/navigation";

export type TransitionVariant = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
  transition: {
    type?: string;
    stiffness?: number;
    damping?: number;
    duration?: number;
    ease?: string | number[] | ((t: number) => number);
    delay?: number;
  };
};

export const defaultTransitions = {
  default: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: {
      type: "tween",
      duration: 0.25,
      ease: "easeInOut",
    },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.03 },
    transition: {
      type: "tween",
      duration: 0.25,
      ease: "easeInOut",
    },
  },
} as const;

export type TransitionType = keyof typeof defaultTransitions;

interface UsePageTransitionOptions {
  variant?: TransitionType | TransitionVariant;
  pathMapping?: Record<string, TransitionType>;
}

export default function usePageTransition(
  options: UsePageTransitionOptions = {}
) {
  const pathname = usePathname() || "";
  const { variant = "default", pathMapping = {} } = options;

  // Determine transition type based on path mapping
  let transitionType: TransitionType | TransitionVariant = variant;

  // Check if we have a specific mapping for this path
  for (const [path, mappedVariant] of Object.entries(pathMapping)) {
    if (pathname.startsWith(path)) {
      transitionType = mappedVariant;
      break;
    }
  }

  // Get the transition object
  let transitionVariant: TransitionVariant;

  if (typeof transitionType === "string") {
    transitionVariant = defaultTransitions[transitionType] as TransitionVariant;
  } else {
    transitionVariant = transitionType;
  }

  return {
    ...transitionVariant,
    key: pathname,
  };
}
