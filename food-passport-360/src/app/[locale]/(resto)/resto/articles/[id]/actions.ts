"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  upsertArticle,
  upsertArticleTranslation,
} from "@/lib/supabase/queries";
import type {
  FPArticle,
  SupportedLang,
} from "@/lib/supabase/food-passport.types";

export async function saveArticleAction(
  id: string | null,
  data: Partial<FPArticle>
): Promise<{ id?: string; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const payload = id
    ? { ...data, id, last_modified_by: user.id }
    : { ...data, created_by: user.id, last_modified_by: user.id };

  const { data: saved, error } = await upsertArticle(supabase, payload);

  if (!error) {
    revalidatePath("/resto/articles", "page");
    if (saved) revalidatePath(`/resto/articles/${saved.id}`, "page");
  }

  return { id: saved?.id, error };
}

export async function saveTranslationAction(
  articleId: string,
  lang: SupportedLang,
  values: { name: string; description: string | null }
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await upsertArticleTranslation(supabase, {
    article_id: articleId,
    lang,
    name: values.name,
    description: values.description,
  });
  if (!error) {
    revalidatePath(`/resto/articles/${articleId}`, "page");
  }
  return { error };
}

export async function archiveArticleAction(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ archived_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (!error) revalidatePath("/resto/articles", "page");
  return { error: error?.message ?? null };
}
