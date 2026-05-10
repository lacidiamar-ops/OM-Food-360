"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItemsByRole } from "./nav-items";
import type { UserRole } from "@/lib/rbac/types";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: UserRole;
}

export default function BottomNav({ role }: BottomNavProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = navItemsByRole[role] ?? navItemsByRole.joueur;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation principale"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
                "rounded-lg py-1 text-[10px] font-medium transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md transition-all duration-100",
                  isActive && "scale-110"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              </span>
              <span className="max-w-[52px] truncate capitalize">
                {t(key as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
