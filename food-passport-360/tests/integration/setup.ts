/**
 * Setup/teardown helpers for integration tests.
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.test
 *
 * Creates 4 test users (joueur/nutri/cuisine/hotel) with proper app_metadata,
 * seeds minimal related data, and cleans up after each suite.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.test" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test");
}

/** Service-role client: bypasses RLS, used for seed/cleanup */
export function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    db: { schema: "food_passport" },
    auth: { persistSession: false },
  });
}

/** Creates an anon client logged in as a test user (respects RLS) */
export function anonClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY!, {
    db: { schema: "food_passport" },
    auth: { persistSession: false },
  });
}

export interface TestContext {
  admin: SupabaseClient;
  playerId: string;
  nutriProfileId: string;
  cuisineProfileId: string;
  hotelProfileId: string;
  hotelAccessId: string;
  hotelId: string;
  tripId: string;
  articleId: string;
  menuId: string;
  cuisineEmail: string;
  hotelEmail: string;
}

async function createTestUser(
  admin: SupabaseClient,
  email: string,
  role: string
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "Test1234!",
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) throw new Error(`createUser ${role}: ${error.message}`);
  return data.user.id;
}

export async function setupTestContext(): Promise<TestContext> {
  const admin = adminClient();
  const suffix = Date.now();

  // Create auth users
  const cuisineEmail = `cuisine+${suffix}@test.fp360`;
  const hotelEmail = `hotel+${suffix}@test.fp360`;
  const playerUserId = await createTestUser(admin, `player+${suffix}@test.fp360`, "joueur");
  const nutriUserId = await createTestUser(admin, `nutri+${suffix}@test.fp360`, "admin_nutri");
  const cuisineUserId = await createTestUser(admin, cuisineEmail, "cuisine");
  const hotelUserId = await createTestUser(admin, hotelEmail, "hotel");

  // Profiles (needed for FK references)
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .insert([
      { id: nutriUserId, email: `nutri+${suffix}@test.fp360`, role: "admin_nutri" },
      { id: cuisineUserId, email: `cuisine+${suffix}@test.fp360`, role: "cuisine" },
      { id: hotelUserId, email: `hotel+${suffix}@test.fp360`, role: "hotel" },
    ])
    .select("id");
  if (profErr) throw new Error(`profiles: ${profErr.message}`);
  void profiles;

  // Player
  const { data: playerRow, error: plErr } = await admin
    .from("players")
    .insert({ profile_id: playerUserId, first_name: "Test", last_name: "Joueur", status: "actif", preferred_lang: "fr" })
    .select("id")
    .single();
  if (plErr) throw new Error(`players: ${plErr.message}`);

  // Article (minimal, valid=true for cuisine visibility)
  const { data: artRow, error: artErr } = await admin
    .from("articles")
    .insert({ name: "Test Article", category: "feculent", active: true, out_of_stock: false, nutri_validated: true, nutri_blocked: false })
    .select("id")
    .single();
  if (artErr) throw new Error(`articles: ${artErr.message}`);

  // Menu
  const { data: menuRow, error: menuErr } = await admin
    .from("menus")
    .insert({ title: "Test Menu", service: "dejeuner", location_type: "centre", date: new Date().toISOString().slice(0, 10), status: "publie" })
    .select("id")
    .single();
  if (menuErr) throw new Error(`menus: ${menuErr.message}`);

  // Hotel (required FK for hotel_access)
  const { data: hotelRow, error: hotelErr } = await admin
    .from("hotels")
    .insert({ name: "Test Hotel" })
    .select("id")
    .single();
  if (hotelErr) throw new Error(`hotels: ${hotelErr.message}`);

  // Trip (required FK for hotel_access)
  const today = new Date().toISOString().slice(0, 10);
  const { data: tripRow, error: tripErr } = await admin
    .from("trips")
    .insert({ name: "Test Trip", start_date: today, end_date: today, hotel_id: hotelRow.id })
    .select("id")
    .single();
  if (tripErr) throw new Error(`trips: ${tripErr.message}`);

  // Hotel access — active (for S4/S5 tests, we'll manipulate expires_at/revoked_at per test)
  const { data: haRow, error: haErr } = await admin
    .from("hotel_access")
    .insert({
      profile_id: hotelUserId,
      trip_id: tripRow.id,
      hotel_id: hotelRow.id,
      token_hash: `test-token-${suffix}`,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      revoked_at: null,
    })
    .select("id")
    .single();
  if (haErr) throw new Error(`hotel_access: ${haErr.message}`);

  return {
    admin,
    playerId: playerRow.id,
    nutriProfileId: nutriUserId,
    cuisineProfileId: cuisineUserId,
    hotelProfileId: hotelUserId,
    hotelAccessId: haRow.id,
    hotelId: hotelRow.id,
    tripId: tripRow.id,
    articleId: artRow.id,
    menuId: menuRow.id,
    cuisineEmail,
    hotelEmail,
  };
}

export async function cleanupTestContext(ctx: TestContext) {
  const { admin } = ctx;
  // Delete in FK-safe order
  await admin.from("order_items").delete().in("order_id",
    (await admin.from("orders").select("id").eq("player_id", ctx.playerId)).data?.map((r: { id: string }) => r.id) ?? []
  );
  await admin.from("orders").delete().eq("player_id", ctx.playerId);
  await admin.from("hotel_access").delete().eq("id", ctx.hotelAccessId);
  await admin.from("trips").delete().eq("id", ctx.tripId);
  await admin.from("hotels").delete().eq("id", ctx.hotelId);
  await admin.from("menus").delete().eq("id", ctx.menuId);
  await admin.from("articles").delete().eq("id", ctx.articleId);
  await admin.from("players").delete().eq("id", ctx.playerId);
  await admin.from("profiles").delete().in("id", [
    ctx.nutriProfileId, ctx.cuisineProfileId, ctx.hotelProfileId,
  ]);
  // Delete auth users
  for (const uid of [ctx.nutriProfileId, ctx.cuisineProfileId, ctx.hotelProfileId]) {
    await admin.auth.admin.deleteUser(uid);
  }
}

/** Sign in and get a RLS-respecting client for a given user */
export async function signInClient(email: string, schema = "food_passport"): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY!, {
    db: { schema },
    auth: { persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: "Test1234!" });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return client;
}
