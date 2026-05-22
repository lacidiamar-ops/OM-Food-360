"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItemsByRole } from "./nav-items";
import type { UserRole } from "@/lib/rbac/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BottomNavProps {
  role: UserRole;
  className?: string;
}

export default function BottomNav({ role, className }: BottomNavProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = navItemsByRole[role] ?? navItemsByRole.joueur;

  return (
    <motion.nav
      className={cn("fixed bottom-0 left-0 right-0 z-40 lg:hidden", className)}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
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
          style={{ opacity: 0.05, filter: "brightness(0) invert(1)" }}
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
                "relative flex min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
                "rounded-lg py-1 text-[10px] font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-colors duration-150",
                isActive ? "text-[color:var(--color-active)]" : "text-[color:var(--nav-inactive)] hover:text-[color:var(--muted-foreground)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Active pill background */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-x-1 inset-y-0.5 -z-10 rounded-xl"
                    style={{ background: "rgba(77,255,180,0.08)" }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <motion.span
                className="flex h-6 w-6 items-center justify-center rounded-md"
                animate={
                  isActive
                    ? { scale: 1.15, filter: "drop-shadow(0 0 6px rgba(77,255,180,0.55))" }
                    : { scale: 1,    filter: "drop-shadow(0 0 0px transparent)" }
                }
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              </motion.span>

              <motion.span
                className="max-w-[52px] truncate capitalize"
                animate={{ opacity: isActive ? 1 : 0.55 }}
                transition={{ duration: 0.15 }}
              >
                {t(key as Parameters<typeof t>[0])}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
