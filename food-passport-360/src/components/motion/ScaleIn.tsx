"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: number;
  className?: string;
}

export default function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  from = 0.92,
  className,
}: ScaleInProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: reduce ? 1 : from }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: reduce ? 0 : duration,
        delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
