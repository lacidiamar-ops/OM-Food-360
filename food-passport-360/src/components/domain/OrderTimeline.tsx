"use client";

import { useTranslations, useLocale } from "next-intl";
import type {
  FPOrderValidationLog,
  OrderStatus,
} from "@/lib/supabase/food-passport.types";

interface Props {
  logs: FPOrderValidationLog[];
  currentStatus: OrderStatus;
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

export default function OrderTimeline({ logs }: Props) {
  const t = useTranslations("orderStatus");
  const tOrders = useTranslations("orders");
  const locale = useLocale();

  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-sm">{tOrders("timeline")}</h2>
      <ol className="relative border-l border-border ml-2 space-y-4">
        {logs.map((log) => {
          const to = log.to_status as OrderStatus | null;
          return (
            <li key={log.id} className="ml-4">
              <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="text-xs text-muted-foreground">
                {formatTime(log.created_at, locale)}
              </div>
              <div className="text-sm font-medium">
                {to ? t(to) : log.action}
              </div>
              {log.notes && (
                <p className="text-xs text-muted-foreground italic mt-0.5">
                  {log.notes}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
