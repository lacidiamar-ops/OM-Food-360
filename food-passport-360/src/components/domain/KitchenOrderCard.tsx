"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Clock, AlertCircle, MessageCircle } from "lucide-react";
import type { KitchenOrder } from "@/lib/supabase/queries";
import {
  markPrepStartedAction,
  markReadyAction,
  markDeliveredAction,
} from "@/app/[locale]/(cuisine)/cuisine/actions";

interface Props {
  order: KitchenOrder;
  locale: string;
}

const SERVICE_LABEL: Record<string, string> = {
  petit_dejeuner: "P.déj",
  dejeuner: "Déjeuner",
  collation_pre: "Collation ↑",
  collation_post: "Collation ↓",
  collation_recup: "Récup",
  diner: "Dîner",
  room_service: "Room",
  after_match: "Après match",
  pre_match: "Avant match",
};

export default function KitchenOrderCard({ order, locale }: Props) {
  const t = useTranslations("cuisine");
  const [isPending, startTransition] = useTransition();

  const time = new Date(order.scheduled_at).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });

  function handleAction() {
    startTransition(async () => {
      if (order.status === "transmise_cuisine") {
        await markPrepStartedAction(order.id);
      } else if (order.status === "en_preparation") {
        await markReadyAction(order.id);
      } else if (order.status === "prete") {
        await markDeliveredAction(order.id);
      }
    });
  }

  const actionLabel =
    order.status === "transmise_cuisine"
      ? t("startPrep")
      : order.status === "en_preparation"
        ? t("markReady")
        : t("markDelivered");

  const actionBg =
    order.status === "transmise_cuisine"
      ? "var(--warning)"
      : order.status === "en_preparation"
        ? "var(--primary)"
        : "var(--color-active)";

  const actionBorder =
    order.status === "transmise_cuisine"
      ? "rgba(255,215,0,0.4)"
      : order.status === "en_preparation"
        ? "var(--primary-border)"
        : "rgba(77,255,180,0.4)";

  const actionColor =
    order.status === "transmise_cuisine"
      ? "var(--warning-foreground)"
      : order.status === "en_preparation"
        ? "var(--primary-foreground)"
        : "var(--success-foreground)";

  const urgent = order.priority === "urgent" || order.priority === "critique";

  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{
        background: urgent ? "rgba(255,77,106,0.04)" : "rgba(255,255,255,0.03)",
        border: urgent
          ? "0.5px solid rgba(255,77,106,0.30)"
          : "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        opacity: isPending ? 0.6 : 1,
        pointerEvents: isPending ? "none" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {order.player_first_name} {order.player_last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {SERVICE_LABEL[order.service] ?? order.service}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {urgent && (
            <span
              style={{
                background: "rgba(255,77,106,0.15)",
                color: "var(--danger)",
                borderRadius: "999px",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: 700,
              }}
            >
              {order.priority === "critique" ? "CRIT" : "URG"}
            </span>
          )}
          <span
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
          >
            <Clock size={11} />
            {time}
          </span>
        </div>
      </div>

      {/* Diet tags */}
      {(order.is_halal || order.is_gluten_free) && (
        <div className="flex flex-wrap gap-1">
          {order.is_halal && (
            <span
              style={{
                background: "rgba(77,255,180,0.10)",
                color: "var(--color-active)",
                borderRadius: "999px",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Halal
            </span>
          )}
          {order.is_gluten_free && (
            <span
              style={{
                background: "rgba(255,215,0,0.10)",
                color: "var(--warning)",
                borderRadius: "999px",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Sans gluten
            </span>
          )}
        </div>
      )}

      {/* Items summary */}
      {order.items_summary && (
        <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {order.items_summary}
        </p>
      )}

      {/* Player comment */}
      {order.player_comment_original && (
        <p className="flex items-start gap-1 text-[11px] italic text-muted-foreground">
          <MessageCircle size={11} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{order.player_comment_original}</span>
        </p>
      )}

      <p className="font-mono text-[10px] text-muted-foreground/50">{order.reference}</p>

      {/* CTA */}
      <button
        onClick={handleAction}
        disabled={isPending}
        className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          background: actionBg,
          border: `1px solid ${actionBorder}`,
          color: actionColor,
        }}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <AlertCircle size={14} className="animate-spin" />
            {t("updating")}
          </span>
        ) : (
          actionLabel
        )}
      </button>
    </div>
  );
}
