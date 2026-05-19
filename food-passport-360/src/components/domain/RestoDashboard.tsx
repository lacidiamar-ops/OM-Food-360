"use client";

import { useTranslations, useLocale } from "next-intl";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import type { KitchenStats, RestoOrder } from "@/lib/supabase/queries";
import type { OrderStatus } from "@/lib/supabase/food-passport.types";

interface Props {
  stats: KitchenStats;
  orders: RestoOrder[];
  date: string;
}

function orderToStatusBadge(status: OrderStatus): "pending" | "processing" | "validated" | "refused" | "info" {
  switch (status) {
    case "brouillon":
    case "envoyee_joueur":
    case "en_attente_nutri":
    case "precision_demandee":
      return "pending";
    case "validee_nutri":
    case "ajustee_nutri":
    case "transmise_resto":
    case "validee_resto":
    case "transmise_cuisine":
    case "transmise_hotel":
    case "en_preparation":
      return "processing";
    case "prete":
      return "info";
    case "livree":
      return "validated";
    case "refusee_nutri":
      return "refused";
    default:
      return "pending";
  }
}

export default function RestoDashboard({ stats, orders, date }: Props) {
  useOrdersQueueRealtime();
  const t = useTranslations("restoDashboard");
  const tservice = useTranslations("service");
  const locale = useLocale();

  const today = new Date(date + "T12:00:00").toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const annulee = (stats as unknown as { annulee_today?: number }).annulee_today ?? 0;

  return (
    <div className="flex flex-col gap-6 px-4 py-4 lg:px-6">
      <PageHeader
        label={t("label")}
        title={t("title")}
        subtitle={today}
      />

      {/* 4 StatCards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label={t("kpiTotal")}
          value={stats.total_validated_today}
          variant="default"
        />
        <StatCard
          label={t("kpiToPrepare")}
          value={stats.transmise_cuisine}
          variant={stats.transmise_cuisine > 0 ? "warning" : "default"}
        />
        <StatCard
          label={t("kpiDelivered")}
          value={stats.livree_today}
          variant="success"
        />
        <StatCard
          label={t("kpiCancelled")}
          value={annulee}
          variant={annulee > 0 ? "danger" : "default"}
        />
      </div>

      {/* Orders table */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          <span className="text-sm font-semibold">{t("ordersToday")}</span>
          <span className="text-xs text-muted-foreground">
            {orders.length} {t("ordersCount")}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-6">
            <EmptyState icon="🍽️" title={t("noOrders")} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  {["Heure", "Joueur", "Service", "Articles", "Statut"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const urgent = order.priority === "urgent" || order.priority === "critique";
                  return (
                    <tr
                      key={order.id}
                      style={{
                        background: i % 2 === 0
                          ? "rgba(255,255,255,0.015)"
                          : "transparent",
                        borderLeft: urgent
                          ? "2px solid var(--danger)"
                          : "2px solid transparent",
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.scheduled_at).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Paris",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap">
                        {order.player_first_name} {order.player_last_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {tservice(order.service as Parameters<typeof tservice>[0])}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {order.items_count} plat{order.items_count > 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={orderToStatusBadge(order.status)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
