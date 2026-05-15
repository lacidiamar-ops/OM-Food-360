"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateActionPhoto } from "@/lib/supabase/queries";

export async function validatePhotoAction(
  photoId: string,
  newStatus: "validee" | "refusee" | "non_conforme",
  comment?: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await validateActionPhoto(supabase, photoId, newStatus, user.id, comment);
  if (!error) {
    revalidatePath("/nutri/photos", "page");
    revalidatePath("/resto/photos", "page");
  }
  return { error };
}
