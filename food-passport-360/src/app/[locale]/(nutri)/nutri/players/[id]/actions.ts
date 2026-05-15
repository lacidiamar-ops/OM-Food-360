"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertPlayer, upsertOnboardingForm } from "@/lib/supabase/queries";
import type { FPPlayer, FPOnboardingForm } from "@/lib/supabase/food-passport.types";

export async function savePlayerAction(
  playerId: string,
  data: Partial<FPPlayer>
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await upsertPlayer(supabase, { id: playerId, ...data });

  if (!error) {
    revalidatePath(`/nutri/players/${playerId}`, "page");
    revalidatePath("/nutri", "page");
  }

  return { error };
}

export async function saveFormAction(
  playerId: string,
  data: Partial<FPOnboardingForm>
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { error } = await upsertOnboardingForm(supabase, playerId, data);

  if (!error) {
    revalidatePath(`/nutri/players/${playerId}`, "page");
    revalidatePath("/nutri", "page");
  }

  return { error };
}
