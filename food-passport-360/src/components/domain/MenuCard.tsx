"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, Clock, ChevronRight, MapPin, Users } from "lucide-react";
import type { FPMenu, MenuStatus } from "@/lib/supabase/food-passport.types";

interface Props {
  menu: FPMenu;
  itemsCount?: number;
  href?: string;
  variant?: "resto" | "player";
}

const STATUS_STYLES: Record<MenuStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  validated: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  published: "bg-green-500/15 text-green-700 dark:text-green-400",
  archived: "bg-zinc-500/15 text-muted-foreground",
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
    <div className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors active:scale-[0.99] space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-sm truncate">{menu.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[menu.status]}`}>
            {tstatus(menu.status)}
          </span>
        )}
        {itemsCount !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
