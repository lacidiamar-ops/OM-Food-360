"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItemsByRole } from "./nav-items";
import type { UserRole } from "@/lib/rbac/types";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: UserRole;
  className?: string;
}

export default function BottomNav({ role, className }: BottomNavProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = navItemsByRole[role] ?? navItemsByRole.joueur;

  return (
    <nav
      className={cn("fixed bottom-0 left-0 right-0 z-40 lg:hidden", className)}
      style={{
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--nav-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Navigation principale"
    >
      {/* OM watermark behind nav items */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <Image
          src="/logo-om-white.svg"
          alt=""
          width={48}
          height={48}
          style={{ opacity: 0.06, filter: "brightness(0) invert(1)" }}
        />
      </div>

      <div className="relative flex h-16 items-center justify-around px-1">
        {items.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={key}
              href={href}
              className={cn(
                "flex min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
                "rounded-lg py-1 text-[10px] font-semibold transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-active" : "text-nav-inactive hover:text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150",
                  isActive && "scale-110 drop-shadow-[0_0_6px_rgba(77,255,180,0.5)]"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
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
