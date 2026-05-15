"use client";

import { useTranslations } from "next-intl";
import { UtensilsCrossed, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";
import type { HotelOrder } from "@/lib/supabase/queries";

interface Props {
  orders: HotelOrder[];
  date: string;
}

const SERVICE_LABEL: Record<string, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation_pre: "Collation avant",
  collation_post: "Collation après",
  collation_recup: "Récupération",
  diner: "Dîner",
  room_service: "Room service",
  after_match: "Après match",
  pre_match: "Avant match",
};

export default function HotelPortal({ orders, date }: Props) {
  useOrdersQueueRealtime();
  const t = useTranslations("hotelPortal");

  const today = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
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
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <UtensilsCrossed size={32} className="text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">{t("noOrders")}</p>
          <p className="text-sm text-muted-foreground">{t("noOrdersDesc")}</p>
        </div>
      ) : (
        Object.entries(byService).map(([service, serviceOrders]) => (
          <div key={service} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {SERVICE_LABEL[service] ?? service}
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {serviceOrders.length}
              </span>
            </h2>

            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {serviceOrders.map(order => (
                <div key={order.id} className="px-4 py-3 space-y-2">
                  {/* Player + time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-sm truncate">
                        {order.player_first_name} {order.player_last_name}
                      </span>
                      {order.room_number && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Ch. {order.room_number}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
                      <Clock size={11} />
                      {new Date(order.scheduled_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
                      })}
                    </span>
                  </div>

                  {/* Diet badges */}
                  {(order.is_halal || order.is_gluten_free || order.is_vegetarian) && (
                    <div className="flex flex-wrap gap-1">
                      {order.is_halal && (
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          Halal
                        </span>
                      )}
                      {order.is_gluten_free && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                          Sans gluten
                        </span>
                      )}
                      {order.is_vegetarian && (
                        <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:text-green-400">
                          Végétarien
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <ul className="space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 w-5 text-right tabular-nums text-muted-foreground">
                          {item.quantity}×
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.nutri_note && (
                          <span className="shrink-0 text-[11px] italic text-muted-foreground">
                            {item.nutri_note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Nutri note */}
                  {order.nutri_adjustment_notes && (
                    <div className="flex items-start gap-1.5 rounded-lg bg-blue-500/8 border border-blue-500/20 px-3 py-2 text-[11px] text-blue-700 dark:text-blue-400">
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

      {/* Read-only notice */}
      <p className={cn(
        "text-center text-[11px] text-muted-foreground/60 pb-4",
      )}>
        {t("readOnlyNotice")}
      </p>
    </div>
  );
}
