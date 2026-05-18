"use client";

import type { ReactNode } from "react";

interface ActionButton {
  label: string;
  onClick: () => void;
}

interface Props {
  title: string;
  subtitle?: string;
  label?: string;
  action?: ActionButton | ReactNode;
}

function isActionButton(action: ActionButton | ReactNode): action is ActionButton {
  return typeof action === "object" && action !== null && "label" in action && "onClick" in action;
}

export default function PageHeader({ title, subtitle, label, action }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        {label && (
          <p
            className="text-active font-semibold"
            style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase" }}
          >
            {label}
          </p>
        )}
        <h1 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>{subtitle}</p>
        )}
      </div>

      {action && (
        <div className="shrink-0 flex items-center">
          {isActionButton(action) ? (
            <button type="button" onClick={action.onClick} className="btn-primary px-4 py-2 text-sm">
              {action.label}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
