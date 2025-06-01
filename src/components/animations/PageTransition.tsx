"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import usePageTransition, { TransitionType } from "./usePageTransition";

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionType;
}

export default function PageTransition({
  children,
  variant = "default",
}: PageTransitionProps) {
  // Use the custom hook with path-based mappings
  const transition = usePageTransition({
    variant,
    pathMapping: {
      "/events/": "slideRight",
      "/profile/": "fade",
      "/settings/": "fade",
      "/create-event/": "scale",
      "/auth/": "scale",
      "/messages/": "slideRight",
      "/recommendations/": "scale",
      "/search/": "fade",
    },
  });

  return (
    <motion.div
      key={transition.key}
      className="page-transition-wrapper"
      initial={transition.initial}
      animate={transition.animate}
      exit={transition.exit}
      transition={{
        ...transition.transition,
        // Adding slight delay to prevent flashing between transitions
        exit: {
          ...transition.transition,
          delay: 0.05,
        },
      }}
    >
      {children}
    </motion.div>
  );
}
