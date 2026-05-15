/**
 * Tests d'intégration : 5 scénarios critiques CLAUDE.md §5.7
 *
 * Prérequis : fichier .env.test avec SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY
 * Run : pnpm test:integration
 *
 * Ces tests valident les 3 couches de défense en profondeur :
 * 1. Trigger Postgres (enforce_nutri_validation)
 * 2. RLS (cuisine + hotel read policies)
 * 3. Données correctes après action nutri
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { type TestContext, setupTestContext, cleanupTestContext, signInClient } from "./setup";

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext();
}, 30_000);

afterAll(async () => {
  if (ctx) await cleanupTestContext(ctx);
}, 30_000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createOrder(ctx: TestContext, overrides: Record<string, unknown> = {}) {
  const { data, error } = await ctx.admin
    .from("orders")
    .insert({
      reference: `TEST-${Date.now()}`,
      player_id: ctx.playerId,
      service: "dejeuner",
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: "brouillon",
      priority: "normal",
      ...overrides,
    })
    .select("id, status")
    .single();
  if (error) throw new Error(`createOrder: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// SCÉNARIO 1 : Joueur passe une commande → reste en attente nutri (pas transmise)
// Règle : trigger bloque toute transition vers statuts post-validation sans validated_by_nutri_at
// ---------------------------------------------------------------------------
describe("S1 – Trigger bloque la transmission sans validation nutri", () => {
  it("refuse un INSERT direct au statut transmise_cuisine", async () => {
    const { error } = await ctx.admin
      .from("orders")
      .insert({
        reference: `TEST-${Date.now()}`,
        player_id: ctx.playerId,
        service: "dejeuner",
        scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "transmise_cuisine",
        priority: "normal",
      });
    // Trigger lève check_violation (code 23514 → PostgrestError)
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514");
  });

  it("refuse un UPDATE de brouillon → transmise_cuisine sans validated_by_nutri_at", async () => {
    const order = await createOrder(ctx);
    const { error } = await ctx.admin
      .from("orders")
      .update({ status: "transmise_cuisine" })
      .eq("id", order.id);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514");
    // Cleanup
    await ctx.admin.from("orders").delete().eq("id", order.id);
  });

  it("refuse un UPDATE de brouillon → transmise_hotel sans validated_by_nutri_at", async () => {
    const order = await createOrder(ctx);
    const { error } = await ctx.admin
      .from("orders")
      .update({ status: "transmise_hotel" })
      .eq("id", order.id);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514");
    await ctx.admin.from("orders").delete().eq("id", order.id);
  });

  it("autorise un UPDATE de brouillon → envoyee_joueur (pas de validation requise)", async () => {
    const order = await createOrder(ctx);
    const { error } = await ctx.admin
      .from("orders")
      .update({ status: "envoyee_joueur" })
      .eq("id", order.id);
    expect(error).toBeNull();
    await ctx.admin.from("orders").delete().eq("id", order.id);
  });
});

// ---------------------------------------------------------------------------
// SCÉNARIO 2 : Nutri valide → cuisine voit la commande (RLS)
// ---------------------------------------------------------------------------
describe("S2 – Cuisine voit uniquement les commandes validées", () => {
  it("cuisine ne voit pas une commande non validée", async () => {
    const order = await createOrder(ctx, { status: "envoyee_joueur" });
    const cuisineC = await signInClient(ctx.cuisineEmail);

    const { data } = await cuisineC.from("orders").select("id").eq("id", order.id);
    expect(data).toHaveLength(0);

    await ctx.admin.from("orders").delete().eq("id", order.id);
  });

  it("cuisine voit la commande après validation nutri", async () => {
    const order = await createOrder(ctx, {
      status: "transmise_cuisine",
      validated_by_nutri_at: new Date().toISOString(),
    });
    const cuisineC = await signInClient(ctx.cuisineEmail);

    const { data } = await cuisineC.from("orders").select("id").eq("id", order.id);
    expect(data).toHaveLength(1);

    await ctx.admin.from("orders").delete().eq("id", order.id);
  });
});

// ---------------------------------------------------------------------------
// SCÉNARIO 3 : Nutri refuse → cuisine ne voit PAS (validated_by_nutri_at = NULL)
// ---------------------------------------------------------------------------
describe("S3 – Commande refusée invisible à la cuisine", () => {
  it("commande refusée (validated_by_nutri_at NULL) invisible à cuisine", async () => {
    // refuseOrderNutri pose status=envoyee_joueur et validated_by_nutri_at=NULL
    const order = await createOrder(ctx, {
      status: "envoyee_joueur",
      validated_by_nutri_at: null,
      nutri_refusal_reason: "Trop de glucides",
    });
    const cuisineC = await signInClient(ctx.cuisineEmail);

    const { data } = await cuisineC.from("orders").select("id").eq("id", order.id);
    expect(data).toHaveLength(0);

    await ctx.admin.from("orders").delete().eq("id", order.id);
  });
});

// ---------------------------------------------------------------------------
// SCÉNARIO 4 : Hôtel hors déplacement actif → 0 résultat (RLS)
// L'accès hotel est révoqué (revoked_at IS NOT NULL) → hotel_has_active_access() = false
// ---------------------------------------------------------------------------
describe("S4 – Hotel sans accès actif ne voit rien", () => {
  it("hotel avec accès révoqué ne voit aucune commande validée", async () => {
    // Révoquer l'accès hotel
    await ctx.admin
      .from("hotel_access")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", ctx.hotelAccessId);

    const order = await createOrder(ctx, {
      status: "transmise_hotel",
      validated_by_nutri_at: new Date().toISOString(),
    });

    const hotelC = await signInClient(ctx.hotelEmail);
    const { data } = await hotelC.from("orders").select("id").eq("id", order.id);
    expect(data).toHaveLength(0);

    // Restore
    await ctx.admin
      .from("hotel_access")
      .update({ revoked_at: null })
      .eq("id", ctx.hotelAccessId);
    await ctx.admin.from("orders").delete().eq("id", order.id);
  });
});

// ---------------------------------------------------------------------------
// SCÉNARIO 5 : Accès hôtel expiré → 0 résultat (RLS)
// expires_at <= NOW() → hotel_has_active_access() = false
// ---------------------------------------------------------------------------
describe("S5 – Hotel avec accès expiré ne voit rien", () => {
  it("hotel avec token expiré (expires_at dans le passé) ne voit aucune commande", async () => {
    // Expirer le token
    await ctx.admin
      .from("hotel_access")
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", ctx.hotelAccessId);

    const order = await createOrder(ctx, {
      status: "transmise_hotel",
      validated_by_nutri_at: new Date().toISOString(),
    });

    const hotelC = await signInClient(ctx.hotelEmail);
    const { data } = await hotelC.from("orders").select("id").eq("id", order.id);
    expect(data).toHaveLength(0);

    // Restore
    await ctx.admin
      .from("hotel_access")
      .update({ expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
      .eq("id", ctx.hotelAccessId);
    await ctx.admin.from("orders").delete().eq("id", order.id);
  });
});
