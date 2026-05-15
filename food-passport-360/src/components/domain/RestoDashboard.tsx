"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Printer } from "lucide-react";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";
import RestoDashboardKpi from "./RestoDashboardKpi";
import OrderStatusBadge from "./OrderStatusBadge";
import type { KitchenStats, RestoOrder } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

interface Props {
  stats: KitchenStats;
  orders: RestoOrder[];
  date: string;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-destructive",
  important: "bg-amber-500",
  normal: "bg-transparent",
};

export default function RestoDashboard({ stats, orders, date }: Props) {
  useOrdersQueueRealtime();
  const t = useTranslations("restoDashboard");

  const today = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-4 lg:px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        <Link
          href="/resto/print"
          className={cn(
            "flex items-center gap-2 rounded-md border border-border px-3 py-2",
            "text-sm font-medium text-foreground",
            "hover:bg-muted transition-colors duration-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Printer size={16} />
          <span className="hidden sm:inline">{t("print")}</span>
        </Link>
      </div>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <RestoDashboardKpi
          label={t("kpiTotal")}
          value={stats.total_validated_today}
          variant="default"
        />
        <RestoDashboardKpi
          label={t("kpiToPrepare")}
          value={stats.transmise_cuisine}
          variant="warning"
        />
        <RestoDashboardKpi
          label={t("kpiInPrep")}
          value={stats.en_preparation}
          variant="default"
        />
        <RestoDashboardKpi
          label={t("kpiReady")}
          value={stats.prete}
          variant="success"
        />
        <RestoDashboardKpi
          label={t("kpiDelivered")}
          value={stats.livree_today}
          variant="muted"
        />
      </div>

      {/* Orders table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <span className="text-sm font-medium">{t("ordersToday")}</span>
          <span className="text-xs text-muted-foreground">
            {orders.length} {t("ordersCount")}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("noOrders")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Priority dot */}
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    PRIORITY_DOT[order.priority] ?? "bg-transparent"
                  )}
                />

                {/* Player */}
                <span className="w-36 shrink-0 truncate text-sm font-medium">
                  {order.player_first_name} {order.player_last_name}
                </span>

                {/* Service + time */}
                <span className="hidden text-xs text-muted-foreground sm:block w-24 shrink-0 truncate">
                  {order.service.replace(/_/g, " ")}
                </span>
                <span className="hidden text-xs tabular-nums text-muted-foreground md:block w-12 shrink-0">
                  {new Date(order.scheduled_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Paris",
                  })}
                </span>

                {/* Items count */}
                <span className="hidden text-xs text-muted-foreground lg:block w-16 shrink-0">
                  {order.items_count} plat{order.items_count > 1 ? "s" : ""}
                </span>

                {/* Status */}
                <div className="ml-auto shrink-0">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
