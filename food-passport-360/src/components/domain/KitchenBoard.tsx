"use client";

import { useTranslations } from "next-intl";
import { useKitchenRealtime } from "@/hooks/useOrderRealtime";
import KitchenOrderCard from "./KitchenOrderCard";
import type { KitchenOrder } from "@/lib/supabase/queries";

interface Props {
  initialOrders: KitchenOrder[];
}

interface Column {
  status: KitchenOrder["status"];
  labelKey: "columnToPrepare" | "columnInPrep" | "columnReady";
  accent: string;
  headerBg: string;
}

const COLUMNS: Column[] = [
  {
    status: "transmise_cuisine",
    labelKey: "columnToPrepare",
    accent: "border-amber-400",
    headerBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    status: "en_preparation",
    labelKey: "columnInPrep",
    accent: "border-blue-400",
    headerBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  {
    status: "prete",
    labelKey: "columnReady",
    accent: "border-emerald-400",
    headerBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
];

export default function KitchenBoard({ initialOrders }: Props) {
  useKitchenRealtime();
  const t = useTranslations("cuisine");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map(({ status, labelKey, accent, headerBg }) => {
        const cards = initialOrders.filter((o) => o.status === status);
        return (
          <div
            key={status}
            className={`flex flex-col rounded-lg border-t-4 ${accent} bg-muted/30`}
          >
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-t px-3 py-2 ${headerBg}`}
            >
              <span className="text-sm font-semibold">{t(labelKey)}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold text-foreground">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2 p-2">
              {cards.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {t("columnEmpty")}
                </p>
              ) : (
                cards.map((order) => (
                  <KitchenOrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
