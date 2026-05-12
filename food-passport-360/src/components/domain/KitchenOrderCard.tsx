"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Clock, AlertCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KitchenOrder } from "@/lib/supabase/queries";
import {
  markPrepStartedAction,
  markReadyAction,
  markDeliveredAction,
} from "@/app/[locale]/(cuisine)/cuisine/actions";

interface Props {
  order: KitchenOrder;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive",
  important: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const SERVICE_LABEL: Record<string, string> = {
  petit_dejeuner: "P.déj",
  dejeuner: "Déjeuner",
  collation_pre: "Collation avant",
  collation_post: "Collation après",
  collation_recup: "Récup",
  diner: "Dîner",
  room_service: "Room",
  after_match: "Après match",
  pre_match: "Avant match",
};

export default function KitchenOrderCard({ order }: Props) {
  const t = useTranslations("cuisine");
  const [isPending, startTransition] = useTransition();

  const time = new Date(order.scheduled_at).toLocaleTimeString("fr-FR", {
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

  const actionStyle =
    order.status === "transmise_cuisine"
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : order.status === "en_preparation"
        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
        : "bg-emerald-600 hover:bg-emerald-700 text-white";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm",
        "flex flex-col gap-2",
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header: name + priority + time */}
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
          {order.priority !== "normal" && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                PRIORITY_STYLES[order.priority]
              )}
            >
              {order.priority === "urgent" ? "URGENT" : "!"}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <Clock size={11} />
            {time}
          </span>
        </div>
      </div>

      {/* Diet badges */}
      {(order.is_halal || order.is_gluten_free) && (
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

      {/* Reference */}
      <p className="text-[10px] text-muted-foreground/60">{order.reference}</p>

      {/* CTA */}
      <button
        onClick={handleAction}
        disabled={isPending}
        className={cn(
          "mt-1 w-full rounded-md px-3 py-2 text-sm font-semibold",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:pointer-events-none",
          actionStyle
        )}
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
