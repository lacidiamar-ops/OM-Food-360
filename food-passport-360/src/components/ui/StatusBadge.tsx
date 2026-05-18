type Status = "pending" | "validated" | "refused" | "urgent" | "info" | "processing";

interface Props {
  status: Status;
}

const STYLES: Record<Status, { bg: string; color: string; border: string; shadow?: string }> = {
  pending: {
    bg:     "var(--warning-bg, rgba(255,215,0,0.10))",
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

export default function StatusBadge({ status }: Props) {
  const s = STYLES[status];
  return (
    <span
      style={{
        background:   s.bg,
        color:        s.color,
        border:       `1px solid ${s.border}`,
        boxShadow:    s.shadow,
        borderRadius: "999px",
        padding:      "3px 10px",
        fontSize:     "11px",
        fontWeight:   600,
        display:      "inline-flex",
        alignItems:   "center",
      }}
    >
      {LABELS[status]}
    </span>
  );
}
