"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  upsertMenu,
  addMenuItem,
  removeMenuItem,
  reorderMenuItem,
  publishMenu,
} from "@/lib/supabase/queries";
import type { FPMenu } from "@/lib/supabase/food-passport.types";

export async function saveMenuAction(
  id: string,
  data: Partial<FPMenu>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await upsertMenu(supabase, { ...data, id });
  if (!error) revalidatePath(`/resto/menus/${id}`, "page");
  return { error };
}

export async function addMenuItemAction(
  menuId: string,
  articleId: string,
  displayOrder: number
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const r = await addMenuItem(supabase, menuId, articleId, displayOrder);
  if (!r.error) revalidatePath(`/resto/menus/${menuId}`, "page");
  return r;
}

export async function removeMenuItemAction(
  itemId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const r = await removeMenuItem(supabase, itemId);
  if (!r.error) revalidatePath("/resto/menus", "layout");
  return r;
}

export async function reorderMenuItemAction(
  itemId: string,
  newOrder: number
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  return reorderMenuItem(supabase, itemId, newOrder);
}

export async function publishMenuAction(
  menuId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const r = await publishMenu(supabase, menuId);
  if (!r.error) {
    revalidatePath(`/resto/menus/${menuId}`, "page");
    revalidatePath("/resto/menus", "page");
  }
  return r;
}
