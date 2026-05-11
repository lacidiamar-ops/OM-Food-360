"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Check,
  Edit3,
  HelpCircle,
  X,
  Clock,
  MapPin,
  UtensilsCrossed,
} from "lucide-react";
import type {
  FPArticle,
  FPOrder,
  FPOrderItem,
  FPOrderValidationLog,
  OrderStatus,
} from "@/lib/supabase/food-passport.types";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderTimeline from "./OrderTimeline";
import ValidationModal, { type ValidationMode } from "./ValidationModal";

type ItemWithArticle = FPOrderItem & {
  article: Pick<FPArticle, "id" | "name" | "category" | "photo_url">;
};

interface Props {
  order: FPOrder;
  items: ItemWithArticle[];
  logs: FPOrderValidationLog[];
  catalog: FPArticle[];
  playerName?: string | null;
}

const ACTIONABLE: OrderStatus[] = [
  "envoyee_joueur",
  "en_attente_nutri",
  "precision_demandee",
];

function formatTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function NutriOrderDetail({
  order,
  items,
  logs,
  catalog,
  playerName,
}: Props) {
  const t = useTranslations("nutriQueue");
  const tOrders = useTranslations("orders");
  const tservice = useTranslations("service");
  const tcat = useTranslations("category");
  const locale = useLocale();
  const [mode, setMode] = useState<ValidationMode>(null);

  const canAct = ACTIONABLE.includes(order.status);

  return (
    <>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6 pb-32">
        <header className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">
              {order.reference}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <h1 className="font-bold text-lg">
            {playerName ?? order.player_id.slice(0, 8)}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{tservice(order.service as Parameters<typeof tservice>[0])}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(order.scheduled_at, locale)}
            </span>
            {order.location_label && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {order.location_label}
              </span>
            )}
          </div>
        </header>

        {order.player_comment_original && (
          <section className="space-y-1.5">
            <h2 className="font-semibold text-sm">{tOrders("playerComment")}</h2>
            <p className="text-sm rounded-2xl border border-border bg-card p-3">
              {order.player_comment_original}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="font-semibold text-sm">{tOrders("items")}</h2>
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className={`rounded-2xl border p-3 flex gap-3 items-center ${
                  it.removed_by_nutri
                    ? "border-red-500/30 bg-red-500/5 opacity-70"
                    : it.added_by_nutri
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-card"
                }`}
              >
                {it.article.photo_url ? (
                  <img
                    src={it.article.photo_url}
                    alt={it.article.name}
                    className="h-14 w-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                    <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div
                    className={`text-sm font-medium ${
                      it.removed_by_nutri ? "line-through" : ""
                    }`}
                  >
                    {it.article.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tcat(it.article.category as Parameters<typeof tcat>[0])} · ×
                    {it.quantity}
                    {it.portion_g ? ` · ${it.portion_g} g` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <OrderTimeline logs={logs} currentStatus={order.status} />
      </div>

      {/* Action bar fixée en bas — seulement si commande en attente d'action */}
      {canAct && (
        <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 px-4 z-40 pointer-events-none">
          <div className="max-w-xl mx-auto pointer-events-auto rounded-2xl border border-border bg-background/95 backdrop-blur shadow-xl p-2 grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => setMode("validate")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-green-600 text-white px-2 py-2.5 text-[11px] font-semibold active:scale-95"
            >
              <Check className="h-4 w-4" />
              {t("validate")}
            </button>
            <button
              type="button"
              onClick={() => setMode("adjust")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-amber-500 text-white px-2 py-2.5 text-[11px] font-semibold active:scale-95"
            >
              <Edit3 className="h-4 w-4" />
              {t("adjust")}
            </button>
            <button
              type="button"
              onClick={() => setMode("precision")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-blue-500 text-white px-2 py-2.5 text-[11px] font-semibold active:scale-95"
            >
              <HelpCircle className="h-4 w-4" />
              {t("askPrecision")}
            </button>
            <button
              type="button"
              onClick={() => setMode("refuse")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl bg-destructive text-destructive-foreground px-2 py-2.5 text-[11px] font-semibold active:scale-95"
            >
              <X className="h-4 w-4" />
              {t("refuse")}
            </button>
          </div>
        </div>
      )}

      <ValidationModal
        mode={mode}
        onClose={() => setMode(null)}
        order={order}
        items={items}
        catalog={catalog}
      />
    </>
  );
}
