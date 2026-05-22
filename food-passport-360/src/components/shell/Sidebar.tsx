"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { navItemsByRole } from "./nav-items";
import type { UserRole } from "@/lib/rbac/types";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  role: UserRole;
  className?: string;
}

export default function Sidebar({ role, className }: SidebarProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const items = navItemsByRole[role] ?? navItemsByRole.joueur;

  return (
    <motion.aside
      className={cn(
        "hidden lg:flex lg:flex-col",
        "fixed inset-y-0 left-0 z-40 w-60",
        "border-r border-sidebar-border bg-sidebar",
        className
      )}
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Navigation latérale"
    >
      {/* Logo */}
      <motion.div
        className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <span className="text-sm font-bold tracking-widest text-sidebar-foreground">
          FOOD PASSPORT 360
        </span>
      </motion.div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {items.map(({ key, href, icon: Icon }, index) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative" }}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-md"
                  style={{ background: "var(--sidebar-primary)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Link
                href={href}
                className={cn(
                  "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  "transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <motion.span
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.5} />
                </motion.span>
                <span className="capitalize">{t(key as Parameters<typeof t>[0])}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer — déconnexion */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <motion.button
          className={cn(
            "flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium",
            "text-sidebar-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          whileHover={{ background: "var(--sidebar-accent)", color: "var(--sidebar-accent-foreground)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
        >
          <LogOut size={18} strokeWidth={1.5} />
          <span>{t("logout")}</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
