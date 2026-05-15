"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to UPDATE events on a specific order row.
 * Calls router.refresh() when the status changes so the
 * server component re-renders with fresh data (items, logs).
 */
export function useOrderRealtime(orderId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "food_passport",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, router]);
}

/**
 * Subscribes to INSERT/UPDATE on kitchen orders.
 * Fires router.refresh() so the KitchenBoard server component re-queries.
 */
export function useKitchenRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders:kitchen")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "food_passport", table: "orders" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "food_passport", table: "orders" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}

/**
 * Subscribes to any INSERT/UPDATE on orders for the nutri queue.
 * Fires router.refresh() — the server component re-queries
 * listOrdersAwaitingNutri to reflect new submissions / status changes.
 */
export function useOrdersQueueRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("orders:queue")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "food_passport",
          table: "orders",
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "food_passport",
          table: "orders",
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}
