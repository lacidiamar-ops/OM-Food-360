"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItemsByRole } from "./nav-items";
import type { UserRole } from "@/lib/rbac/types";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

interface SidebarProps {
  role: UserRole;
  className?: string;
}

export default function Sidebar({ role, className }: SidebarProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = navItemsByRole[role] ?? navItemsByRole.joueur;

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col",
        "fixed inset-y-0 left-0 z-40 w-60",
        "border-r border-sidebar-border bg-sidebar",
        className
      )}
      aria-label="Navigation latérale"
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6">
        <span className="text-sm font-bold tracking-widest text-sidebar-foreground">
          FOOD PASSPORT 360
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium",
                "transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span className="capitalize">
                {t(key as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — déconnexion */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
            "text-sidebar-foreground transition-colors duration-100",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
