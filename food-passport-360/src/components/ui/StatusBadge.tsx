"use client";

import { motion } from "framer-motion";

type Status = "pending" | "validated" | "refused" | "urgent" | "info" | "processing";

interface Props {
  status: Status;
}

const STYLES: Record<Status, { bg: string; color: string; border: string; shadow?: string }> = {
  pending: {
    bg:     "rgba(255,215,0,0.10)",
    color:  "var(--warning)",
    border: "rgba(255,215,0,0.20)",
  },
  validated: {
    bg:     "rgba(77,255,180,0.10)",
    color:  "var(--color-active)",
    border: "rgba(77,255,180,0.20)",
  },
  refused: {
    bg:     "rgba(255,77,106,0.10)",
    color:  "var(--danger)",
    border: "rgba(255,77,106,0.20)",
  },
  urgent: {
    bg:     "rgba(255,77,106,0.20)",
    color:  "var(--danger)",
    border: "rgba(255,77,106,0.40)",
    shadow: "0 0 8px rgba(255,77,106,0.30)",
  },
  info: {
    bg:     "var(--primary)",
    color:  "var(--primary-foreground)",
    border: "var(--primary-border)",
  },
  processing: {
    bg:     "var(--primary)",
    color:  "var(--primary-foreground)",
    border: "var(--primary-border)",
  },
};

const LABELS: Record<Status, string> = {
  pending:    "En attente",
  validated:  "Validé",
  refused:    "Refusé",
  urgent:     "Urgent",
  info:       "Info",
  processing: "En cours",
};

const PULSE_STATUSES: Status[] = ["pending", "urgent", "processing"];

export default function StatusBadge({ status }: Props) {
  const s = STYLES[status];
  const shouldPulse = PULSE_STATUSES.includes(status);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background:   s.bg,
        color:        s.color,
        border:       `1px solid ${s.border}`,
        boxShadow:    s.shadow,
        borderRadius: "999px",
        padding:      "3px 10px",
        fontSize:     "11px",
        fontWeight:   600,
      }}
    >
      {shouldPulse && (
        <span style={{ position: "relative", display: "inline-flex", width: 6, height: 6 }}>
          <motion.span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: s.color,
              opacity: 0.6,
            }}
            animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            style={{
              position: "relative",
              borderRadius: "50%",
              width: 6,
              height: 6,
              background: s.color,
            }}
          />
        </span>
      )}
      {LABELS[status]}
    </motion.span>
  );
}
