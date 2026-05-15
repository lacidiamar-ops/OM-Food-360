"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markPrepStarted, markReady, markDelivered } from "@/lib/supabase/queries";

function bust() {
  revalidatePath("/cuisine", "page");
}

export async function markPrepStartedAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await markPrepStarted(supabase, orderId);
  if (!error) bust();
  return { error };
}

export async function markReadyAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await markReady(supabase, orderId);
  if (!error) bust();
  return { error };
}

export async function markDeliveredAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await markDelivered(supabase, orderId);
  if (!error) bust();
  return { error };
}
