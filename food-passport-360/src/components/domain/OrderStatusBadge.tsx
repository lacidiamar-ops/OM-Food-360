"use client";

import { useTranslations } from "next-intl";
import type { OrderStatus } from "@/lib/supabase/food-passport.types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  brouillon: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  envoyee_joueur: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  en_attente_nutri: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  precision_demandee: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  ajustee_nutri: "bg-green-500/15 text-green-700 dark:text-green-300",
  validee_nutri: "bg-green-500/15 text-green-700 dark:text-green-300",
  refusee_nutri: "bg-red-500/15 text-red-700 dark:text-red-300",
  transmise_resto: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  validee_resto: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  transmise_cuisine: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  transmise_hotel: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  en_preparation: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  prete: "bg-green-500/15 text-green-700 dark:text-green-300",
  livree: "bg-green-600/15 text-green-800 dark:text-green-200",
  annulee: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  probleme_signale: "bg-red-500/15 text-red-700 dark:text-red-300",
};

interface Props {
  status: OrderStatus;
  size?: "sm" | "md";
}

export default function OrderStatusBadge({ status, size = "md" }: Props) {
  const t = useTranslations("orderStatus");
  const sizeCls = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeCls} ${STATUS_STYLES[status]}`}
    >
      {t(status)}
    </span>
  );
}
