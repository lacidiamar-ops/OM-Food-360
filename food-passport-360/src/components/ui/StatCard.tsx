"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import AnimatedCounter from "@/components/motion/AnimatedCounter";

type Variant = "default" | "warning" | "success" | "danger";

interface Props {
  label: string;
  value: string | number;
  variant?: Variant;
  icon?: ReactNode;
  animateValue?: boolean;
}

const VALUE_COLOR: Record<Variant, string> = {
  default: "var(--foreground)",
  warning: "var(--warning)",
  success: "var(--color-active)",
  danger:  "var(--danger)",
};

const GLOW_COLOR: Record<Variant, string> = {
  default: "rgba(255,255,255,0.1)",
  warning: "rgba(255,215,0,0.15)",
  success: "rgba(77,255,180,0.15)",
  danger:  "rgba(255,77,106,0.15)",
};

const BORDER_HOVER: Record<Variant, string> = {
  default: "rgba(255,255,255,0.18)",
  warning: "rgba(255,215,0,0.45)",
  success: "rgba(77,255,180,0.45)",
  danger:  "rgba(255,77,106,0.45)",
};

export default function StatCard({ label, value, variant = "default", icon, animateValue = true }: Props) {
  const reduce = useReducedMotion();
  const isNumeric = typeof value === "number" && animateValue;

  return (
    <motion.div
      className="flex flex-col gap-2 p-4"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "0.5px solid rgba(255, 255, 255, 0.07)",
        borderRadius: "16px",
      }}
      whileHover={reduce ? undefined : {
        scale: 1.02,
        borderColor: BORDER_HOVER[variant],
        boxShadow: `0 0 20px ${GLOW_COLOR[variant]}, inset 0 0 20px ${GLOW_COLOR[variant]}`,
      }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      {icon && (
        <motion.div
          style={{ color: VALUE_COLOR[variant] }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {icon}
        </motion.div>
      )}

      <p style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: VALUE_COLOR[variant] }}>
        {isNumeric ? (
          <AnimatedCounter value={value as number} />
        ) : (
          value
        )}
      </p>

      <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{label}</p>
    </motion.div>
  );
}
