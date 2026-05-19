"use client";

import { useTranslations, useLocale } from "next-intl";
import { useKitchenRealtime } from "@/hooks/useOrderRealtime";
import KitchenOrderCard from "./KitchenOrderCard";
import { PageHeader, EmptyState, ProfileHero } from "@/components/ui";
import type { KitchenOrder } from "@/lib/supabase/queries";
import { ClipboardCheck } from "lucide-react";

interface Props {
  initialOrders: KitchenOrder[];
}

interface Column {
  status: KitchenOrder["status"];
  labelKey: "columnToPrepare" | "columnInPrep" | "columnReady";
  accentColor: string;
  headerBg: string;
  headerColor: string;
}

const COLUMNS: Column[] = [
  {
    status: "transmise_cuisine",
    labelKey: "columnToPrepare",
    accentColor: "var(--warning)",
    headerBg: "rgba(255,215,0,0.08)",
    headerColor: "var(--warning)",
  },
  {
    status: "en_preparation",
    labelKey: "columnInPrep",
    accentColor: "var(--color-om)",
    headerBg: "rgba(0,91,172,0.10)",
    headerColor: "var(--color-om)",
  },
  {
    status: "prete",
    labelKey: "columnReady",
    accentColor: "var(--color-active)",
    headerBg: "rgba(77,255,180,0.08)",
    headerColor: "var(--color-active)",
  },
];

export default function KitchenBoard({ initialOrders }: Props) {
  useKitchenRealtime();
  const t = useTranslations("cuisine");
  const locale = useLocale();

  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return (
    <div className="space-y-5 pb-6">
      <ProfileHero />
      <div className="px-4 lg:px-6 space-y-5">
      <PageHeader label={t("label")} title={t("boardTitle")} subtitle={today} />

      {/* Kanban — scroll snap mobile, 3 cols desktop */}
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {COLUMNS.map(({ status, labelKey, accentColor, headerBg, headerColor }) => {
          const cards = initialOrders.filter((o) => o.status === status);
          return (
            <div
              key={status}
              className="flex flex-col flex-shrink-0 w-[85vw] sm:w-[340px] md:flex-1"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Column container */}
              <div
                className="flex flex-col h-full"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${accentColor}`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  borderTopWidth: "3px",
                }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-3 py-2.5"
                  style={{ background: headerBg }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: headerColor }}
                  >
                    {t(labelKey)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: headerColor,
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 flex-1">
                  {cards.length === 0 ? (
                    <div className="py-4">
                      <EmptyState
                        icon={<ClipboardCheck className="h-5 w-5" />}
                        title={t("columnEmpty")}
                      />
                    </div>
                  ) : (
                    cards.map((order) => (
                      <KitchenOrderCard key={order.id} order={order} locale={locale} />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
