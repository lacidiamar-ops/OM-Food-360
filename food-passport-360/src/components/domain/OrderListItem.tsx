"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight, Clock } from "lucide-react";
import type { FPOrder } from "@/lib/supabase/food-passport.types";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: FPOrder;
}

function formatScheduled(iso: string, locale: string) {
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

export default function OrderListItem({ order }: Props) {
  const t = useTranslations("service");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/joueur/orders/${order.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {order.reference}
          </span>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>
        <div className="text-sm font-medium">
          {t(order.service as Parameters<typeof t>[0])}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatScheduled(order.scheduled_at, locale)}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}
