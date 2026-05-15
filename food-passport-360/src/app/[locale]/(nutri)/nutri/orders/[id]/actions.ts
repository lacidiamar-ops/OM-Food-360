"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateOrderNutri,
  adjustOrderNutri,
  refuseOrderNutri,
  askPrecisionNutri,
} from "@/lib/supabase/queries";
import type { FPOrderItemInput } from "@/lib/supabase/food-passport.types";

// Toutes ces actions exigent une session authentifiée.
// La RLS "orders: nutri all" garantit que seuls super_admin et admin_nutri
// peuvent UPDATE. Pas de check de rôle côté Server Action — la DB rejette
// les utilisateurs non habilités.

function bust(orderId: string) {
  revalidatePath("/nutri", "page");
  revalidatePath("/nutri/orders", "page");
  revalidatePath(`/nutri/orders/${orderId}`, "page");
  revalidatePath(`/joueur/orders/${orderId}`, "page");
}

export async function validateOrderNutriAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await validateOrderNutri(supabase, orderId, user.id);
  if (!error) bust(orderId);
  return { error };
}

export async function adjustOrderNutriAction(
  orderId: string,
  input: {
    notes: string;
    addedItems?: FPOrderItemInput[];
    removedItemIds?: string[];
    itemNotes?: Array<{ itemId: string; nutri_note: string }>;
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!input.notes.trim()) return { error: "ADJUSTMENT_NOTES_REQUIRED" };

  const { error } = await adjustOrderNutri(supabase, orderId, user.id, input);
  if (!error) bust(orderId);
  return { error };
}

export async function refuseOrderNutriAction(
  orderId: string,
  reason: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!reason.trim()) return { error: "REASON_REQUIRED" };

  const { error } = await refuseOrderNutri(supabase, orderId, user.id, reason);
  if (!error) bust(orderId);
  return { error };
}

export async function askPrecisionNutriAction(
  orderId: string,
  message: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!message.trim()) return { error: "MESSAGE_REQUIRED" };

  const { error } = await askPrecisionNutri(supabase, orderId, user.id, message);
  if (!error) bust(orderId);
  return { error };
}
