"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FPMessage } from "@/lib/supabase/food-passport.types";

export function useChatRealtime(
  conversationId: string,
  onNewMessage: (msg: FPMessage) => void
) {
  const stableCallback = useCallback(onNewMessage, []); // eslint-disable-line

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "food_passport",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          stableCallback(payload.new as FPMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, stableCallback]);
}
