"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight, Clock } from "lucide-react";
import type { FPOrder } from "@/lib/supabase/food-passport.types";
import OrderStatusBadge from "./OrderStatusBadge";

interface Props {
  order: FPOrder;
}

function formatScheduled(iso: string, locale: string) {
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

export default function OrderListItem({ order }: Props) {
  const t = useTranslations("service");
  const locale = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      layout
    >
    <Link
      href={`/${locale}/joueur/orders/${order.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {order.reference}
          </span>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>
        <div className="text-sm font-medium">
          {t(order.service as Parameters<typeof t>[0])}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatScheduled(order.scheduled_at, locale)}
        </div>
      </div>
      <motion.div
        className="flex-shrink-0"
        animate={{ x: 0 }}
        whileHover={{ x: 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </Link>
    </motion.div>
  );
}
