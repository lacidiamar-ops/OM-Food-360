"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cancelOrder } from "@/lib/supabase/queries";

export async function cancelOrderAction(
  orderId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // RLS player_read_own + filtre status dans cancelOrder
  const { error } = await cancelOrder(supabase, orderId);
  if (!error) {
    revalidatePath("/joueur/orders", "page");
    revalidatePath(`/joueur/orders/${orderId}`, "page");
  }
  return { error };
}
