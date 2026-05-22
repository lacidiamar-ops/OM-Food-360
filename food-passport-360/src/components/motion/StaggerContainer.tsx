"use client";

import { motion, useReducedMotion } from "framer-motion";

interface StaggerContainerProps {
  children: React.ReactNode;
  stagger?: number;
  delayStart?: number;
  className?: string;
}

export default function StaggerContainer({
  children,
  stagger = 0.07,
  delayStart = 0,
  className,
}: StaggerContainerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delayStart,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden:  { opacity: 0, y: reduce ? 0 : 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
