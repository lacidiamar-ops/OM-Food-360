"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ActionProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Props {
  icon: ReactNode | string;
  title: string;
  description?: string;
  action?: ActionProps;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="empty-state__icon"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {typeof icon === "string" ? <span style={{ fontSize: "28px" }}>{icon}</span> : icon}
      </motion.div>

      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <p className="empty-state__title">{title}</p>
        {description && <p className="empty-state__sub">{description}</p>}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.22 }}
        >
          {action.href ? (
            <Link href={action.href} className="btn-primary inline-flex items-center px-5 py-2.5 text-sm">
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="btn-primary inline-flex items-center px-5 py-2.5 text-sm">
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
