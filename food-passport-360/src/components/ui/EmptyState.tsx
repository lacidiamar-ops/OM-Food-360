import type { ReactNode } from "react";
import Link from "next/link";

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
    <div className="empty-state">
      <div className="empty-state__icon">
        {typeof icon === "string" ? <span style={{ fontSize: "28px" }}>{icon}</span> : icon}
      </div>

      <div className="space-y-1">
        <p className="empty-state__title">{title}</p>
        {description && <p className="empty-state__sub">{description}</p>}
      </div>

      {action && (
        action.href ? (
          <Link href={action.href} className="btn-primary inline-flex items-center px-5 py-2.5 text-sm">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="btn-primary inline-flex items-center px-5 py-2.5 text-sm">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
