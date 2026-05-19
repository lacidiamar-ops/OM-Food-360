"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, Clock, ChevronRight, MapPin, Users } from "lucide-react";
import type { FPMenu, MenuStatus } from "@/lib/supabase/food-passport.types";
import { StatusBadge } from "@/components/ui";

interface Props {
  menu: FPMenu;
  itemsCount?: number;
  href?: string;
  variant?: "resto" | "player";
}

type MenuStatusBadge = "pending" | "info" | "validated" | "refused";

const MENU_STATUS_BADGE: Record<MenuStatus, MenuStatusBadge> = {
  draft:     "pending",
  validated: "info",
  published: "validated",
  archived:  "refused",
};

function formatDate(date: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function MenuCard({ menu, itemsCount, href, variant = "resto" }: Props) {
  const t = useTranslations("menus");
  const tservice = useTranslations("service");
  const tstatus = useTranslations("menuStatus");
  const locale = useLocale();

  const inner = (
    <div
      className="p-4 space-y-2 transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-sm truncate">{menu.title}</h3>
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1"
            style={{ fontSize: "12px", color: "var(--muted-foreground)" }}
          >
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(menu.date, locale)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tservice(menu.service as Parameters<typeof tservice>[0])}
            </span>
            {menu.location_name && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {menu.location_name}
              </span>
            )}
          </div>
        </div>
        {href && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 self-center" />}
      </div>

      <div className="flex items-center gap-2">
        {variant === "resto" && (
          <StatusBadge status={MENU_STATUS_BADGE[menu.status] ?? "pending"} />
        )}
        {itemsCount !== undefined && (
          <span
            className="inline-flex items-center gap-1"
            style={{ fontSize: "12px", color: "var(--muted-foreground)" }}
          >
            <Users className="h-3 w-3" />
            {itemsCount} {t("articles", { count: itemsCount })}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={`/${locale}${href}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
