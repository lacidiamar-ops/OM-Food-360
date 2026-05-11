"use client";

import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";
import type { FPOrder } from "@/lib/supabase/food-passport.types";
import NutriOrderQueueItem from "./NutriOrderQueueItem";
import { useOrdersQueueRealtime } from "@/hooks/useOrderRealtime";

interface Props {
  orders: Array<FPOrder & { player_name?: string | null }>;
}

export default function NutriQueueView({ orders }: Props) {
  const t = useTranslations("nutriQueue");
  useOrdersQueueRealtime();

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15">
          <ClipboardCheck className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="font-semibold">{t("empty")}</h1>
        <p className="text-sm text-muted-foreground">{t("emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header className="space-y-1">
        <h1 className="font-bold text-lg">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("awaiting", { count: orders.length })}
        </p>
      </header>

      <ul className="space-y-2">
        {orders.map((order) => (
          <NutriOrderQueueItem
            key={order.id}
            order={order}
            playerName={order.player_name ?? undefined}
          />
        ))}
      </ul>
    </div>
  );
}
