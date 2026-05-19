"use client";

import { useTranslations, useLocale } from "next-intl";
import { Clock, MessageSquare } from "lucide-react";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";
import type { HotelOrder } from "@/lib/supabase/queries";
import { PageHeader, EmptyState } from "@/components/ui";

interface Props {
  orders: HotelOrder[];
  date: string;
  hotelName?: string;
}

const DIET_TAG: Record<string, { label: string; bg: string; color: string }> = {
  halal:      { label: "Halal",      bg: "rgba(77,255,180,0.10)",  color: "var(--color-active)" },
  gluten_free:{ label: "Sans gluten",bg: "rgba(255,215,0,0.10)",   color: "var(--warning)" },
  vegetarian: { label: "Végétarien", bg: "rgba(139,127,245,0.10)", color: "var(--color-energy)" },
};

export default function HotelPortal({ orders, date, hotelName }: Props) {
  useOrdersQueueRealtime();
  const t = useTranslations("hotelPortal");
  const tservice = useTranslations("service");
  const locale = useLocale();

  const today = new Date(date + "T12:00:00").toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long",
  });

  // Group by service
  const byService: Record<string, HotelOrder[]> = {};
  for (const o of orders) {
    if (!byService[o.service]) byService[o.service] = [];
    byService[o.service].push(o);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        label={t("portalLabel")}
        title={hotelName ?? t("title")}
        subtitle={today}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title={t("noOrders")}
          description={t("noOrdersDesc")}
        />
      ) : (
        Object.entries(byService).map(([service, serviceOrders]) => (
          <div key={service} className="space-y-2">
            {/* Service header */}
            <div className="flex items-center gap-2 px-1">
              <h2
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {tservice(service as Parameters<typeof tservice>[0])}
              </h2>
              <span
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--muted-foreground)",
                  borderRadius: "999px",
                  padding: "0 7px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {serviceOrders.length}
              </span>
            </div>

            {/* Orders */}
            <div className="space-y-2">
              {serviceOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 space-y-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                  }}
                >
                  {/* Player + room + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm truncate">
                        {order.player_first_name} {order.player_last_name}
                      </span>
                      {order.room_number && (
                        <span
                          style={{
                            background: "rgba(77,255,180,0.08)",
                            color: "var(--color-active)",
                            borderRadius: "999px",
                            padding: "1px 7px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          Ch. {order.room_number}
                        </span>
                      )}
                    </div>
                    <span
                      className="shrink-0 flex items-center gap-1 tabular-nums text-muted-foreground"
                      style={{ fontSize: "11px" }}
                    >
                      <Clock size={11} />
                      {new Date(order.scheduled_at).toLocaleTimeString(locale, {
                        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
                      })}
                    </span>
                  </div>

                  {/* Diet badges */}
                  {(order.is_halal || order.is_gluten_free || order.is_vegetarian) && (
                    <div className="flex flex-wrap gap-1">
                      {order.is_halal && (
                        <span
                          style={{
                            background: DIET_TAG.halal.bg,
                            color: DIET_TAG.halal.color,
                            borderRadius: "999px",
                            padding: "1px 7px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {DIET_TAG.halal.label}
                        </span>
                      )}
                      {order.is_gluten_free && (
                        <span
                          style={{
                            background: DIET_TAG.gluten_free.bg,
                            color: DIET_TAG.gluten_free.color,
                            borderRadius: "999px",
                            padding: "1px 7px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {DIET_TAG.gluten_free.label}
                        </span>
                      )}
                      {order.is_vegetarian && (
                        <span
                          style={{
                            background: DIET_TAG.vegetarian.bg,
                            color: DIET_TAG.vegetarian.color,
                            borderRadius: "999px",
                            padding: "1px 7px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          {DIET_TAG.vegetarian.label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <ul className="space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                          className="shrink-0 w-5 text-right tabular-nums text-muted-foreground"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {item.quantity}×
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.nutri_note && (
                          <span className="shrink-0 italic text-muted-foreground" style={{ fontSize: "11px" }}>
                            {item.nutri_note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Nutri note */}
                  {order.nutri_adjustment_notes && (
                    <div
                      className="flex items-start gap-1.5 px-3 py-2"
                      style={{
                        background: "rgba(0,91,172,0.08)",
                        border: "0.5px solid rgba(0,91,172,0.20)",
                        borderRadius: "10px",
                        color: "var(--color-om)",
                        fontSize: "11px",
                      }}
                    >
                      <MessageSquare size={12} className="mt-0.5 shrink-0" />
                      <span className="italic">{order.nutri_adjustment_notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <p className="text-center text-[11px] text-muted-foreground/60 pb-4">
        {t("readOnlyNotice")}
      </p>
    </div>
  );
}
