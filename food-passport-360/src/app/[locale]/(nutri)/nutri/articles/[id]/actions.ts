"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setArticleValidation } from "@/lib/supabase/queries";

export async function validateArticleAction(
  id: string,
  comment: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await setArticleValidation(supabase, id, {
    nutri_validated: true,
    nutri_blocked: false,
    nutri_validated_by: user.id,
    nutri_comment: comment,
  });

  if (!error) {
    revalidatePath("/nutri/articles", "page");
    revalidatePath(`/nutri/articles/${id}`, "page");
  }
  return { error };
}

export async function blockArticleAction(
  id: string,
  comment: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await setArticleValidation(supabase, id, {
    nutri_blocked: true,
    nutri_validated: false,
    nutri_validated_by: user.id,
    nutri_comment: comment,
  });

  if (!error) {
    revalidatePath("/nutri/articles", "page");
    revalidatePath(`/nutri/articles/${id}`, "page");
  }
  return { error };
}

export async function commentArticleAction(
  id: string,
  comment: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await setArticleValidation(supabase, id, { nutri_comment: comment });
  if (!error) revalidatePath(`/nutri/articles/${id}`, "page");
  return { error };
}
