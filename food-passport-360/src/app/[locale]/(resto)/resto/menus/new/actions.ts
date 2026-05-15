"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { upsertMenu } from "@/lib/supabase/queries";
import type { FPMenu } from "@/lib/supabase/food-passport.types";

export async function createMenuAction(
  data: Partial<FPMenu>
): Promise<{ id?: string; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: saved, error } = await upsertMenu(supabase, {
    ...data,
    status: "draft",
    created_by: user.id,
  });

  if (!error) revalidatePath("/resto/menus", "page");
  return { id: saved?.id, error };
}
