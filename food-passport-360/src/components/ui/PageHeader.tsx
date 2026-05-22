"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ActionButton {
  label: string;
  onClick: () => void;
}

interface Props {
  title: string;
  subtitle?: string;
  label?: string;
  action?: ActionButton | ReactNode;
  showLogo?: boolean;
}

function isActionButton(action: ActionButton | ReactNode): action is ActionButton {
  return typeof action === "object" && action !== null && "label" in action && "onClick" in action;
}

export default function PageHeader({ title, subtitle, label, action, showLogo }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      {/* Left: optional logo + text */}
      <div className="flex items-start gap-3 min-w-0">
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, rotate: -8 }}
            animate={{ opacity: 0.85, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Image
              src="/logo-om-white.svg"
              alt="OM"
              width={24}
              height={24}
              className="mt-1 shrink-0"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </motion.div>
        )}

        <div className="space-y-1 min-w-0">
          {label && (
            <motion.p
              className="text-[color:var(--color-active)] font-semibold"
              style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {label}
            </motion.p>
          )}

          <motion.h1
            className="truncate"
            style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              style={{ fontSize: "14px", color: "var(--muted-foreground)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Right: action */}
      {action && (
        <motion.div
          className="shrink-0 flex items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {isActionButton(action) ? (
            <motion.button
              type="button"
              onClick={action.onClick}
              className="btn-primary px-4 py-2 text-sm"
              whileHover={{ scale: 1.03, opacity: 0.9 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              {action.label}
            </motion.button>
          ) : (
            action
          )}
        </motion.div>
      )}
    </div>
  );
}
