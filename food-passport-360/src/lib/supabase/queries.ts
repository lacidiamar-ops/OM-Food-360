import type {
  FPPlayer,
  FPOnboardingForm,
  FPPlayerOperational,
} from "./food-passport.types";

// Supabase client typed for food_passport schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FPClient = any;

// ── Player queries ─────────────────────────────────────────

export async function getPlayerByProfileId(
  supabase: FPClient,
  profileId: string
): Promise<FPPlayer | null> {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("profile_id", profileId)
    .is("archived_at", null)
    .single();
  return data;
}

export async function getPlayerById(
  supabase: FPClient,
  id: string
): Promise<FPPlayer | null> {
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .is("archived_at", null)
    .single();
  return data;
}

export async function listPlayers(
  supabase: FPClient
): Promise<FPPlayerOperational[]> {
  const { data } = await supabase
    .from("players")
    .select(
      "id, profile_id, first_name, last_name, jersey_number, position, squad_group, photo_url, preferred_lang, status"
    )
    .is("archived_at", null)
    .order("last_name");
  return data ?? [];
}

export async function listPlayersWithFormStatus(supabase: FPClient) {
  const { data } = await supabase
    .from("players")
    .select(
      `
      id, profile_id, first_name, last_name, jersey_number, position, squad_group, photo_url, preferred_lang, status,
      player_onboarding_forms ( id, status, completion_percent )
    `
    )
    .is("archived_at", null)
    .order("last_name");
  return data ?? [];
}

// ── Onboarding form queries ────────────────────────────────

export async function getOnboardingForm(
  supabase: FPClient,
  playerId: string
): Promise<FPOnboardingForm | null> {
  const { data } = await supabase
    .from("player_onboarding_forms")
    .select("*")
    .eq("player_id", playerId)
    .is("archived_at", null)
    .single();
  return data;
}

export async function upsertOnboardingForm(
  supabase: FPClient,
  playerId: string,
  values: Partial<FPOnboardingForm>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("player_onboarding_forms")
    .upsert(
      { ...values, player_id: playerId },
      { onConflict: "player_id" }
    );
  return { error: error?.message ?? null };
}

export async function upsertPlayer(
  supabase: FPClient,
  values: Partial<FPPlayer> & { id?: string }
): Promise<{ data: FPPlayer | null; error: string | null }> {
  const { data, error } = await supabase
    .from("players")
    .upsert(values, { onConflict: "id" })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}
