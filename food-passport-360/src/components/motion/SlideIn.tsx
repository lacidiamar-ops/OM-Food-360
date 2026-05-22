"use client";

import { motion, useReducedMotion } from "framer-motion";

type Direction = "up" | "down" | "left" | "right";

interface SlideInProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,  y: 16 },
  down:  { x: 0,  y: -16 },
  left:  { x: 16, y: 0 },
  right: { x: -16, y: 0 },
};

export default function SlideIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.35,
  distance,
  className,
}: SlideInProps) {
  const reduce = useReducedMotion();
  const base = OFFSETS[direction];
  const factor = distance ?? 1;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: reduce ? 0 : base.x * factor, y: reduce ? 0 : base.y * factor }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: reduce ? 0 : duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
