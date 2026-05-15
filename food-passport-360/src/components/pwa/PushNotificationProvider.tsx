"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch {
    return null;
  }
}

async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function sendNotification(title: string, body: string, url?: string) {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({ type: "NOTIFY", title, body, icon: "/icon-192.png", url });
}

interface Props {
  userId: string | null;
}

export default function PushNotificationProvider({ userId }: Props) {
  const swRegistered = useRef(false);

  useEffect(() => {
    if (swRegistered.current || !userId) return;
    swRegistered.current = true;

    (async () => {
      await registerSW();
      const granted = await requestPermission();
      if (!granted) return;

      const supabase = createClient();

      // Écoute les changements de statut des commandes du joueur courant
      const channel = supabase
        .channel(`notify-orders-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "food_passport",
            table: "orders",
          },
          (payload) => {
            const n = payload.new as Record<string, unknown>;
            const status = n.status as string;

            const messages: Record<string, { title: string; body: string }> = {
              validee_nutri: {
                title: "✅ Commande validée",
                body: "Le nutritionniste a validé votre commande.",
              },
              refusee_nutri: {
                title: "❌ Commande refusée",
                body: "Le nutritionniste a refusé votre commande. Consultez le motif.",
              },
              precision_demandee: {
                title: "❓ Précision demandée",
                body: "Le nutritionniste vous demande une précision sur votre commande.",
              },
              livree: {
                title: "🍽️ Commande livrée",
                body: "Votre repas est arrivé ! Pensez à laisser un avis.",
              },
            };

            const msg = messages[status];
            if (msg) {
              sendNotification(msg.title, msg.body, `/joueur/orders/${n.id}`);
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    })();
  }, [userId]);

  return null;
}
