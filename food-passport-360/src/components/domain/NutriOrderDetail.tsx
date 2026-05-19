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
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import type {
  FPArticle,
  FPOrder,
  FPOrderItem,
  FPOrderValidationLog,
  OrderStatus,
} from "@/lib/supabase/food-passport.types";
import { PageHeader, StatusBadge } from "@/components/ui";
import OrderTimeline from "./OrderTimeline";
import ValidationModal, { type ValidationMode } from "./ValidationModal";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import DietBadges from "./DietBadges";

type ItemWithArticle = FPOrderItem & {
  article: Pick<FPArticle, "id" | "name" | "category" | "photo_url"> & {
    is_halal?: boolean;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    is_lactose_free?: boolean;
  };
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

function orderToStatusBadge(status: OrderStatus): "pending" | "processing" | "validated" | "refused" | "info" {
  if (["en_attente_nutri", "envoyee_joueur", "precision_demandee"].includes(status)) return "pending";
  if (["validee_nutri", "ajustee_nutri", "transmise_cuisine", "en_preparation"].includes(status)) return "processing";
  if (status === "livree") return "validated";
  if (status === "refusee_nutri") return "refused";
  return "info";
}

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

export default function NutriOrderDetail({ order, items, logs, catalog, playerName }: Props) {
  const t = useTranslations("nutriQueue");
  const tOrders = useTranslations("orders");
  const tservice = useTranslations("service");
  const tcat = useTranslations("category");
  const locale = useLocale();
  const [mode, setMode] = useState<ValidationMode>(null);

  useOrderRealtime(order.id);

  const canAct = ACTIONABLE.includes(order.status);

  return (
    <>
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5 pb-36">
        <PageHeader
          label={t("validationLabel")}
          title={`${tOrders("orderRef")} ${order.reference}`}
          subtitle={`${playerName ?? ""} · ${tservice(order.service as Parameters<typeof tservice>[0])}`}
          action={<StatusBadge status={orderToStatusBadge(order.status)} />}
        />

        {/* Schedule + location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(order.scheduled_at, locale)}
          </span>
          {order.location_label && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {order.location_label}
            </span>
          )}
        </div>

        {/* Player comment */}
        {order.player_comment_original && (
          <section
            className="p-3 space-y-1"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
            }}
          >
            <p className="text-xs font-medium text-muted-foreground">{tOrders("playerComment")}</p>
            <p className="text-sm italic">{order.player_comment_original}</p>
          </section>
        )}

        {/* Items */}
        <section className="space-y-2">
          <h2 className="font-semibold text-sm">{tOrders("items")}</h2>
          <ul className="space-y-2">
            {items.map((it) => {
              const removed = it.removed_by_nutri;
              const added = it.added_by_nutri;
              return (
                <li
                  key={it.id}
                  className="flex gap-3 items-center p-3"
                  style={{
                    background: removed
                      ? "rgba(255,77,106,0.05)"
                      : added
                        ? "rgba(77,255,180,0.05)"
                        : "rgba(255,255,255,0.03)",
                    border: removed
                      ? "0.5px solid rgba(255,77,106,0.30)"
                      : added
                        ? "0.5px solid rgba(77,255,180,0.30)"
                        : "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: "14px",
                    opacity: removed ? 0.7 : 1,
                  }}
                >
                  {it.article.photo_url ? (
                    <img
                      src={it.article.photo_url}
                      alt={it.article.name}
                      className="h-14 w-14 object-cover flex-shrink-0"
                      style={{ borderRadius: "10px", filter: removed ? "grayscale(1)" : undefined }}
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center flex-shrink-0"
                      style={{ background: "var(--muted)", borderRadius: "10px" }}
                    >
                      <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {removed && <MinusCircle className="h-3.5 w-3.5 text-danger flex-shrink-0" />}
                      {added && <PlusCircle className="h-3.5 w-3.5 text-active flex-shrink-0" />}
                      <span className={removed ? "line-through" : ""}>{it.article.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tcat(it.article.category as Parameters<typeof tcat>[0])} · ×{it.quantity}
                      {it.portion_g ? ` · ${it.portion_g} g` : ""}
                    </p>
                    {(it.article.is_halal != null || it.article.is_gluten_free != null) && (
                      <DietBadges article={it.article as FPArticle} size="sm" />
                    )}
                    {it.nutri_note && (
                      <p className="text-[11px] text-muted-foreground italic">{it.nutri_note}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <OrderTimeline logs={logs} currentStatus={order.status} />
      </div>

      {/* Sticky action bar */}
      {canAct && (
        <div
          className="fixed bottom-16 lg:bottom-4 left-0 right-0 px-4 z-40"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div
            className="max-w-xl mx-auto p-2 grid grid-cols-4 gap-1.5"
            style={{
              background: "rgba(13,15,30,0.95)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "20px",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Valider */}
            <button
              type="button"
              onClick={() => setMode("validate")}
              className="btn-primary inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold active:scale-95"
            >
              <Check className="h-4 w-4" />
              {t("validate")}
            </button>
            {/* Ajuster */}
            <button
              type="button"
              onClick={() => setMode("adjust")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold active:scale-95"
              style={{
                background: "rgba(255,215,0,0.10)",
                border: "1px solid rgba(255,215,0,0.30)",
                color: "var(--warning)",
              }}
            >
              <Edit3 className="h-4 w-4" />
              {t("adjust")}
            </button>
            {/* Précision */}
            <button
              type="button"
              onClick={() => setMode("precision")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold active:scale-95"
              style={{
                background: "rgba(0,91,172,0.15)",
                border: "1px solid rgba(0,91,172,0.40)",
                color: "var(--color-om)",
              }}
            >
              <HelpCircle className="h-4 w-4" />
              {t("askPrecision")}
            </button>
            {/* Refuser */}
            <button
              type="button"
              onClick={() => setMode("refuse")}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold active:scale-95"
              style={{
                background: "rgba(255,77,106,0.10)",
                border: "1px solid rgba(255,77,106,0.30)",
                color: "var(--danger)",
              }}
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
