"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";
import type { FPOrder } from "@/lib/supabase/food-passport.types";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: FPOrder;
  playerName?: string;
}

function formatTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  critique: "Critique",
};

export default function NutriOrderQueueItem({ order, playerName }: Props) {
  const tservice = useTranslations("service");
  const locale = useLocale();

  const urgent = order.priority === "urgent" || order.priority === "critique";

  return (
    <Link
      href={`/${locale}/nutri/orders/${order.id}`}
      className={`flex items-center gap-3 rounded-2xl border bg-card p-3 hover:bg-muted/50 transition-colors active:scale-[0.99] ${
        urgent ? "border-red-500/40" : "border-border"
      }`}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-muted-foreground">
            {order.reference}
          </span>
          <OrderStatusBadge status={order.status} size="sm" />
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 text-[10px] font-medium px-1.5 py-0.5">
              <AlertCircle className="h-3 w-3" />
              {PRIORITY_LABEL[order.priority] ?? order.priority}
            </span>
          )}
        </div>
        <div className="text-sm font-medium">
          {playerName ?? order.player_id.slice(0, 8)} ·{" "}
          {tservice(order.service as Parameters<typeof tservice>[0])}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(order.scheduled_at, locale)}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}
