"use client";

import type { ReactNode } from "react";

type Variant = "default" | "warning" | "success" | "danger";

interface Props {
  label: string;
  value: string | number;
  variant?: Variant;
  icon?: ReactNode;
}

const VALUE_COLOR: Record<Variant, string> = {
  default: "var(--foreground)",
  warning: "var(--warning)",
  success: "var(--color-active)",
  danger:  "var(--danger)",
};

export default function StatCard({ label, value, variant = "default", icon }: Props) {
  return (
    <div
      className="group flex flex-col gap-2 p-4 transition-colors duration-200"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "0.5px solid rgba(255, 255, 255, 0.07)",
        borderRadius: "16px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-active)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255, 255, 255, 0.07)";
      }}
    >
      {icon && <div style={{ color: VALUE_COLOR[variant] }}>{icon}</div>}
      <p
        style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1, color: VALUE_COLOR[variant] }}
      >
        {value}
      </p>
      <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{label}</p>
    </div>
  );
}
