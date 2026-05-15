"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByProfileId, insertActionPhoto, insertFeedback } from "@/lib/supabase/queries";

export async function uploadActionPhotoAction(data: {
  storagePath: string;
  orderId: string;
  tripId?: string | null;
  caption?: string | null;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Unauthorized" };

  const result = await insertActionPhoto(supabase, {
    storage_path: data.storagePath,
    uploaded_by: user.id,
    uploader_role: "joueur",
    order_id: data.orderId,
    trip_id: data.tripId ?? null,
    context_type: "repas",
    caption: data.caption ?? null,
  });

  if (!result.error) {
    revalidatePath(`/joueur/orders/${data.orderId}`, "page");
    revalidatePath(`/joueur/orders/${data.orderId}/photo`, "page");
  }

  return result;
}

export async function submitFeedbackAction(data: {
  orderId: string;
  tripId?: string | null;
  hotelId?: string | null;
  topic: string[];
  rating: number;
  smiley?: string | null;
  commentOriginal?: string | null;
  commentLang?: string | null;
  tags?: string[] | null;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Unauthorized" };

  const player = await getPlayerByProfileId(supabase, user.id);
  if (!player) return { id: null, error: "Player not found" };

  const result = await insertFeedback(supabase, {
    order_id: data.orderId,
    player_id: player.id,
    trip_id: data.tripId ?? null,
    hotel_id: data.hotelId ?? null,
    topic: data.topic,
    rating: data.rating,
    smiley: data.smiley ?? null,
    comment_original: data.commentOriginal ?? null,
    comment_lang: data.commentLang ?? null,
    tags: data.tags ?? null,
  });

  if (!result.error) {
    revalidatePath(`/joueur/orders/${data.orderId}`, "page");
    revalidatePath(`/joueur/orders/${data.orderId}/feedback`, "page");
  }

  return result;
}
