"use server";

import { createClient } from "@/lib/supabase/server";
import { upsertNutritionTracking } from "@/lib/supabase/queries";
import type { FPNutritionTrackingInsert } from "@/lib/supabase/food-passport.types";
import { revalidatePath } from "next/cache";

export async function saveNutritionTracking(
  data: FPNutritionTrackingInsert & { id?: string }
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };
    await upsertNutritionTracking(supabase, { ...data, nutri_id: user.id });
    revalidatePath(`/nutri/players/${data.player_id}`);
    revalidatePath(`/joueur`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}
