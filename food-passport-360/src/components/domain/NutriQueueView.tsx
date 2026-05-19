"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { FPOrder } from "@/lib/supabase/food-passport.types";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";

interface Props {
  orders: Array<FPOrder & { player_name?: string | null }>;
}

function formatTime(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function NutriQueueView({ orders }: Props) {
  const t = useTranslations("nutriQueue");
  const tservice = useTranslations("service");
  const locale = useLocale();
  useOrdersQueueRealtime();

  // Sort: urgent/critique first
  const sorted = [...orders].sort((a, b) => {
    const aUrgent = a.priority === "urgent" || a.priority === "critique" ? 0 : 1;
    const bUrgent = b.priority === "urgent" || b.priority === "critique" ? 0 : 1;
    return aUrgent - bUrgent;
  });

  if (sorted.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState
          icon="✅"
          title={t("empty")}
          description={t("emptyDesc")}
        />
      </div>
    );
  }

  const countBadge = (
    <span
      style={{
        background: "rgba(255,77,106,0.15)",
        color: "var(--danger)",
        border: "1px solid rgba(255,77,106,0.30)",
        borderRadius: "999px",
        padding: "3px 10px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {sorted.length}
    </span>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <PageHeader
        label={t("role")}
        title={t("title")}
        subtitle={t("awaiting", { count: sorted.length })}
        action={countBadge}
      />

      <ul className="space-y-2">
        {sorted.map((order) => {
          const urgent = order.priority === "urgent" || order.priority === "critique";
          const badgeStatus = urgent ? "urgent" : "pending";

          return (
            <li key={order.id}>
              <Link
                href={`/${locale}/nutri/orders/${order.id}`}
                className="flex items-center gap-3 p-3 transition-colors active:scale-[0.99]"
                style={{
                  background: urgent
                    ? "rgba(255,77,106,0.05)"
                    : "rgba(255,255,255,0.03)",
                  border: urgent
                    ? "1px solid rgba(255,77,106,0.30)"
                    : "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                  boxShadow: urgent
                    ? "0 0 12px rgba(255,77,106,0.12)"
                    : undefined,
                }}
              >
                {/* Initials avatar */}
                <div
                  className="flex h-11 w-11 items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{
                    background: urgent
                      ? "rgba(255,77,106,0.15)"
                      : "rgba(77,255,180,0.08)",
                    color: urgent ? "var(--danger)" : "var(--color-active)",
                    borderRadius: "12px",
                  }}
                >
                  {initials(order.player_name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {order.player_name ?? order.player_id.slice(0, 8)}
                    </span>
                    <StatusBadge status={badgeStatus} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tservice(order.service as Parameters<typeof tservice>[0])}</span>
                    <span>·</span>
                    <span>{formatTime(order.created_at, locale)}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {order.reference}
                  </span>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
