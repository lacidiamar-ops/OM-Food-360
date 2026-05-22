"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

interface PressScaleProps extends HTMLMotionProps<"div"> {
  scale?: number;
  children: React.ReactNode;
}

export default function PressScale({ scale = 0.96, children, ...props }: PressScaleProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.01 }}
      whileTap={reduce ? undefined : { scale }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
