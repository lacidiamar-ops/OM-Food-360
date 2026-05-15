"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTrip, updateTrip, archiveTrip, createHotelAccess, revokeHotelAccess } from "@/lib/supabase/queries";
import type { FPTrip } from "@/lib/supabase/food-passport.types";
import { createHash, randomUUID } from "crypto";

function bust(tripId?: string) {
  revalidatePath("/team-manager/trips", "page");
  if (tripId) revalidatePath(`/team-manager/trips/${tripId}`, "page");
}

export async function createTripAction(
  data: {
    name: string;
    city?: string | null;
    start_date: string;
    end_date: string;
    hotel_id?: string | null;
    stadium?: string | null;
    match_time?: string | null;
    meal_times?: string | null;
  }
): Promise<{ tripId: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tripId: null, error: "Unauthorized" };

  const { data: trip, error } = await createTrip(supabase, {
    ...data,
    created_by: user.id,
  });
  if (error || !trip) return { tripId: null, error: error ?? "Erreur création" };

  bust(trip.id);
  return { tripId: trip.id, error: null };
}

export async function updateTripAction(
  tripId: string,
  data: Partial<FPTrip>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await updateTrip(supabase, tripId, data);
  if (!error) bust(tripId);
  return { error };
}

export async function archiveTripAction(
  tripId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await archiveTrip(supabase, tripId);
  if (!error) bust(tripId);
  return { error };
}

// Génère un token aléatoire, le hache SHA-256 pour le stockage.
// Retourne le token en clair (affiché une seule fois au TM).
export async function generateHotelAccessAction(data: {
  trip_id: string;
  hotel_id: string;
  profile_id: string;
  starts_at: string;
  expires_at: string;
}): Promise<{ rawToken: string | null; error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rawToken: null, error: "Unauthorized" };

  const rawToken = randomUUID();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const { error } = await createHotelAccess(supabase, {
    ...data,
    granted_by: user.id,
    raw_token: tokenHash, // on stocke le hash, pas le token en clair
  });

  if (error) return { rawToken: null, error };
  bust(data.trip_id);
  return { rawToken, error: null };
}

export async function revokeHotelAccessAction(
  accessId: string,
  tripId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await revokeHotelAccess(supabase, accessId);
  if (!error) bust(tripId);
  return { error };
}
