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
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {order.reference}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <h1 className="font-bold text-lg">
          {tservice(order.service as Parameters<typeof tservice>[0])}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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

      {/* Refusal reason */}
      {order.nutri_refusal_reason && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3 space-y-1">
          <div className="font-medium text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <XCircle className="h-4 w-4" />
            {t("nutriRefusalReason")}
          </div>
          <p className="text-sm">{order.nutri_refusal_reason}</p>
        </div>
      )}

      {/* Nutri adjustment notes */}
      {order.nutri_adjustment_notes && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
          <div className="font-medium text-sm text-amber-700 dark:text-amber-300">
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
              className={`rounded-2xl border p-3 flex gap-3 items-stretch ${
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
                  className={`h-14 w-14 rounded-xl object-cover flex-shrink-0 ${
                    it.removed_by_nutri ? "grayscale" : ""
                  }`}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                  <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {it.removed_by_nutri && (
                    <MinusCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                  )}
                  {it.added_by_nutri && (
                    <PlusCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  )}
                  <span className={it.removed_by_nutri ? "line-through" : ""}>
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
                  <p className="text-[11px] text-red-700 dark:text-red-400 italic">
                    {t("removedByNutri")}
                  </p>
                )}
                {it.added_by_nutri && (
                  <p className="text-[11px] text-green-700 dark:text-green-400 italic">
                    {t("addedByNutri")}
                  </p>
                )}
                {it.nutri_note && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {it.nutri_note}
                  </p>
                )}
                {it.player_note && !it.nutri_note && (
                  <p className="text-[11px] text-muted-foreground italic">
                    {it.player_note}
                  </p>
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
          <p className="text-sm text-muted-foreground rounded-2xl border border-border bg-card p-3">
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
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <Camera className="h-4 w-4" />
            {t("photoProof")}
          </Link>
          <Link
            href={`/joueur/orders/${order.id}/feedback`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
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
            <div className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2 mb-2">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-destructive px-5 py-3 font-medium hover:bg-destructive/5 disabled:opacity-60"
          >
            {pending ? t("cancelling") : t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
