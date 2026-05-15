"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  createOrder,
  submitOrder,
  getPlayerByProfileId,
} from "@/lib/supabase/queries";
import type {
  FPOrderItemInput,
  ServiceType,
  SupportedLang,
} from "@/lib/supabase/food-passport.types";

interface CreateOrderInput {
  service: ServiceType;
  scheduledAt: string;
  items: FPOrderItemInput[];
  locationLabel?: string | null;
  playerComment?: string | null;
  submitNow?: boolean;
}

// Crée une commande pour le joueur connecté.
// Si submitNow=true, la passe directement à envoyee_joueur (file nutri).
export async function createOrderAction(
  input: CreateOrderInput
): Promise<{ orderId: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { orderId: null, error: "Unauthorized" };

  // Garde-fou : aucun item → pas de commande
  if (!input.items.length) {
    return { orderId: null, error: "EMPTY_CART" };
  }

  // player_id résolu côté serveur depuis auth.uid() — pas de spoof possible
  const player = await getPlayerByProfileId(supabase, user.id);
  if (!player) return { orderId: null, error: "PLAYER_NOT_FOUND" };

  const lang = ((await getLocale()) as SupportedLang) ?? "fr";

  const { orderId, error } = await createOrder(supabase, {
    playerId: player.id,
    service: input.service,
    scheduledAt: input.scheduledAt,
    locationLabel: input.locationLabel ?? null,
    playerComment: input.playerComment ?? null,
    playerCommentLang: input.playerComment ? lang : null,
    items: input.items,
  });

  if (error || !orderId) {
    return { orderId: null, error: error ?? "ORDER_CREATE_FAILED" };
  }

  if (input.submitNow) {
    const { error: subErr } = await submitOrder(supabase, orderId);
    if (subErr) return { orderId, error: subErr };
  }

  revalidatePath("/joueur/orders", "page");
  return { orderId, error: null };
}

export async function submitOrderAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // RLS player_read_own + filtre status="brouillon" dans submitOrder
  const { error } = await submitOrder(supabase, orderId);
  if (!error) {
    revalidatePath("/joueur/orders", "page");
    revalidatePath(`/joueur/orders/${orderId}`, "page");
  }
  return { error };
}

// Helper utilisable depuis un formulaire <form action={...}>
export async function createAndSubmitOrderFormAction(
  formData: FormData
): Promise<void> {
  const service = formData.get("service") as ServiceType;
  const scheduledAt = formData.get("scheduledAt") as string;
  const itemsRaw = formData.get("items") as string;
  const playerComment = (formData.get("playerComment") as string) || null;
  const locationLabel = (formData.get("locationLabel") as string) || null;

  let items: FPOrderItemInput[] = [];
  try {
    items = JSON.parse(itemsRaw) as FPOrderItemInput[];
  } catch {
    return;
  }

  const result = await createOrderAction({
    service,
    scheduledAt,
    items,
    locationLabel,
    playerComment,
    submitNow: true,
  });

  if (result.orderId && !result.error) {
    const locale = await getLocale();
    redirect(`/${locale}/joueur/orders/${result.orderId}`);
  }
}
