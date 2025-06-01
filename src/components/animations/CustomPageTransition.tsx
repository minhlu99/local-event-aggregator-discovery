"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { TransitionType, TransitionVariant } from "./usePageTransition";

interface CustomPageTransitionProps {
  children: ReactNode;
  variant?: TransitionType;
  customTransition?: TransitionVariant;
}

// Define some additional custom transitions
const customTransitions: Record<string, TransitionVariant> = {
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    transition: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
    transition: {
      type: "tween",
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.2 },
    transition: {
      type: "tween",
      duration: 0.25,
      ease: "easeInOut",
    },
  },
};

export default function CustomPageTransition({
  children,
  variant,
  customTransition,
}: CustomPageTransitionProps) {
  const pathname = usePathname() || "";

  // Determine which transition to use
  let transitionProps: TransitionVariant;

  if (customTransition) {
    // Use custom transition if provided
    transitionProps = customTransition;
  } else if (variant && customTransitions[variant]) {
    // Use named custom transition if it exists
    transitionProps = customTransitions[variant];
  } else {
    // Default fallback
    transitionProps = customTransitions.slideUp;
  }

  return (
    <motion.div
      key={pathname}
      className="page-transition-wrapper"
      initial={transitionProps.initial}
      animate={transitionProps.animate}
      exit={transitionProps.exit}
      transition={{
        ...transitionProps.transition,
        exit: {
          ...transitionProps.transition,
          delay: 0.05,
        },
      }}
    >
      {children}
    </motion.div>
  );
}
