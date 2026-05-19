"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Camera, Clock, MapPin, MessageCircle, MinusCircle, PlusCircle, UtensilsCrossed, XCircle } from "lucide-react";
import Link from "next/link";
import type {
  FPArticle,
  FPOrder,
  FPOrderItem,
  FPOrderValidationLog,
  OrderStatus,
} from "@/lib/supabase/food-passport.types";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderTimeline from "./OrderTimeline";
import { cancelOrderAction } from "@/app/[locale]/(joueur)/joueur/orders/[id]/actions";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import { PageHeader } from "@/components/ui";

const CANCELLABLE: OrderStatus[] = [
  "brouillon",
  "envoyee_joueur",
  "en_attente_nutri",
  "precision_demandee",
  "ajustee_nutri",
];

type ItemWithArticle = FPOrderItem & {
  article: Pick<FPArticle, "id" | "name" | "category" | "photo_url">;
};

interface Props {
  order: FPOrder;
  items: ItemWithArticle[];
  logs: FPOrderValidationLog[];
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

export default function PlayerOrderDetail({ order, items, logs }: Props) {
  const t = useTranslations("orders");
  const tservice = useTranslations("service");
  const tcat = useTranslations("category");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useOrderRealtime(order.id);

  const canCancel = CANCELLABLE.includes(order.status);

  function handleCancel() {
    if (!confirm(t("cancelConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelOrderAction(order.id);
      if (result.error) {
        setError(t("cantCancel"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-12">
      <PageHeader
        label={t("orderRef")}
        title={tservice(order.service as Parameters<typeof tservice>[0])}
        subtitle={formatTime(order.scheduled_at, locale) + (order.location_label ? ` · ${order.location_label}` : "")}
        action={<OrderStatusBadge status={order.status} />}
      />

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground -mt-3">
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

      {/* Refusal reason */}
      {order.nutri_refusal_reason && (
        <div
          className="p-3 space-y-1"
          style={{
            background: "rgba(255,77,106,0.06)",
            border: "0.5px solid rgba(255,77,106,0.25)",
            borderRadius: "16px",
          }}
        >
          <div
            className="font-medium text-sm flex items-center gap-1.5"
            style={{ color: "var(--danger)" }}
          >
            <XCircle className="h-4 w-4" />
            {t("nutriRefusalReason")}
          </div>
          <p className="text-sm">{order.nutri_refusal_reason}</p>
        </div>
      )}

      {/* Nutri adjustment notes */}
      {order.nutri_adjustment_notes && (
        <div
          className="p-3 space-y-1"
          style={{
            background: "rgba(255,215,0,0.06)",
            border: "0.5px solid rgba(255,215,0,0.25)",
            borderRadius: "16px",
          }}
        >
          <div className="font-medium text-sm" style={{ color: "var(--warning)" }}>
            {t("nutriComment")}
          </div>
          <p className="text-sm">{order.nutri_adjustment_notes}</p>
        </div>
      )}

      {/* Items */}
      <section className="space-y-2">
        <h2 className="font-semibold text-sm">{t("items")}</h2>
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="p-3 flex gap-3 items-stretch"
              style={{
                background: it.removed_by_nutri
                  ? "rgba(255,77,106,0.05)"
                  : it.added_by_nutri
                  ? "rgba(77,255,180,0.05)"
                  : "rgba(255,255,255,0.03)",
                border: it.removed_by_nutri
                  ? "0.5px solid rgba(255,77,106,0.25)"
                  : it.added_by_nutri
                  ? "0.5px solid rgba(77,255,180,0.25)"
                  : "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
                opacity: it.removed_by_nutri ? 0.75 : 1,
              }}
            >
              {it.article.photo_url ? (
                <img
                  src={it.article.photo_url}
                  alt={it.article.name}
                  className="flex-shrink-0 object-cover"
                  style={{
                    height: 56, width: 56,
                    borderRadius: 12,
                    filter: it.removed_by_nutri ? "grayscale(1)" : undefined,
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{ height: 56, width: 56, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}
                >
                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {it.removed_by_nutri && (
                    <MinusCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--danger)" }} />
                  )}
                  {it.added_by_nutri && (
                    <PlusCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--color-active)" }} />
                  )}
                  <span style={{ textDecoration: it.removed_by_nutri ? "line-through" : undefined }}>
                    {it.article.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{tcat(it.article.category as Parameters<typeof tcat>[0])}</span>
                  <span>·</span>
                  <span>×{it.quantity}</span>
                  {it.portion_g && (
                    <>
                      <span>·</span>
                      <span>{it.portion_g} g</span>
                    </>
                  )}
                </div>
                {it.removed_by_nutri && (
                  <p className="text-[11px] italic" style={{ color: "var(--danger)" }}>
                    {t("removedByNutri")}
                  </p>
                )}
                {it.added_by_nutri && (
                  <p className="text-[11px] italic" style={{ color: "var(--color-active)" }}>
                    {t("addedByNutri")}
                  </p>
                )}
                {it.nutri_note && (
                  <p className="text-[11px] text-muted-foreground italic">{it.nutri_note}</p>
                )}
                {it.player_note && !it.nutri_note && (
                  <p className="text-[11px] text-muted-foreground italic">{it.player_note}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Player comment */}
      {order.player_comment_original && (
        <section className="space-y-1.5">
          <h2 className="font-semibold text-sm">{t("playerComment")}</h2>
          <p
            className="text-sm p-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
            }}
          >
            {order.player_comment_original}
          </p>
        </section>
      )}

      {/* Timeline */}
      <OrderTimeline logs={logs} currentStatus={order.status} />

      {/* Photo + feedback CTAs when delivered */}
      {order.status === "livree" && (
        <div className="flex gap-3 pt-2">
          <Link
            href={`/joueur/orders/${order.id}/photo`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.10)",
              borderRadius: "16px",
            }}
          >
            <Camera className="h-4 w-4" />
            {t("photoProof")}
          </Link>
          <Link
            href={`/joueur/orders/${order.id}/feedback`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.10)",
              borderRadius: "16px",
            }}
          >
            <MessageCircle className="h-4 w-4" />
            {t("feedback")}
          </Link>
        </div>
      )}

      {/* Cancel */}
      {canCancel && (
        <div className="pt-2">
          {error && (
            <div
              className="text-sm px-3 py-2 mb-2"
              style={{
                background: "rgba(255,77,106,0.08)",
                color: "var(--danger)",
                borderRadius: "12px",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 font-medium disabled:opacity-60 transition-colors"
            style={{
              border: "0.5px solid rgba(255,77,106,0.35)",
              color: "var(--danger)",
              borderRadius: "16px",
            }}
          >
            {pending ? t("cancelling") : t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
