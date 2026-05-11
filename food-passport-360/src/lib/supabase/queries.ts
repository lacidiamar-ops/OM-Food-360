import type {
  FPPlayer,
  FPOnboardingForm,
  FPPlayerOperational,
  FPArticle,
  FPArticleTranslation,
  FPMenu,
  FPMenuItem,
  ArticleFilter,
  SupportedLang,
  ServiceType,
  FPOrder,
  FPOrderItem,
  FPOrderItemInput,
  FPOrderValidationLog,
  OrderStatus,
  OrderPriority,
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

// ── Article queries ────────────────────────────────────────

export async function listArticles(
  supabase: FPClient,
  filter: ArticleFilter = {}
): Promise<FPArticle[]> {
  let q = supabase
    .from("articles")
    .select("*")
    .is("archived_at", null)
    .order("name");

  if (filter.category) q = q.eq("category", filter.category);
  if (filter.active !== undefined) q = q.eq("active", filter.active);
  if (filter.blocked !== undefined) q = q.eq("nutri_blocked", filter.blocked);
  if (filter.validated === true) q = q.eq("nutri_validated", true).eq("nutri_blocked", false);
  if (filter.validated === false) q = q.eq("nutri_validated", false);
  if (filter.search) q = q.ilike("name", `%${filter.search}%`);

  const { data } = await q;
  return data ?? [];
}

export async function listArticlesPendingValidation(
  supabase: FPClient
): Promise<FPArticle[]> {
  const { data } = await supabase
    .from("articles")
    .select("*")
    .is("archived_at", null)
    .eq("active", true)
    .eq("nutri_validated", false)
    .eq("nutri_blocked", false)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getArticleWithTranslations(
  supabase: FPClient,
  id: string
): Promise<{ article: FPArticle | null; translations: FPArticleTranslation[] }> {
  const [{ data: article }, { data: translations }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).single(),
    supabase.from("article_translations").select("*").eq("article_id", id),
  ]);
  return { article, translations: translations ?? [] };
}

export async function upsertArticle(
  supabase: FPClient,
  values: Partial<FPArticle>
): Promise<{ data: FPArticle | null; error: string | null }> {
  const { data, error } = await supabase
    .from("articles")
    .upsert(values, { onConflict: "id" })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function upsertArticleTranslation(
  supabase: FPClient,
  values: { article_id: string; lang: SupportedLang; name: string; description?: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("article_translations")
    .upsert(
      { ...values, auto_translated: false, manual_correction: true },
      { onConflict: "article_id,lang" }
    );
  return { error: error?.message ?? null };
}

export async function setArticleValidation(
  supabase: FPClient,
  id: string,
  payload: {
    nutri_validated?: boolean;
    nutri_blocked?: boolean;
    nutri_comment?: string | null;
    nutri_validated_by?: string | null;
  }
): Promise<{ error: string | null }> {
  const update: Record<string, unknown> = { ...payload };
  if (payload.nutri_validated === true) {
    update.nutri_validated_at = new Date().toISOString();
  }
  if (payload.nutri_blocked === true) {
    update.nutri_validated = false;
  }
  const { error } = await supabase.from("articles").update(update).eq("id", id);
  return { error: error?.message ?? null };
}

// ── Menu queries ───────────────────────────────────────────

export async function listMenus(
  supabase: FPClient,
  opts: { from?: string; to?: string; service?: ServiceType } = {}
): Promise<FPMenu[]> {
  let q = supabase.from("menus").select("*").order("date", { ascending: false }).order("start_time");
  if (opts.from) q = q.gte("date", opts.from);
  if (opts.to) q = q.lte("date", opts.to);
  if (opts.service) q = q.eq("service", opts.service);
  const { data } = await q;
  return data ?? [];
}

export async function getMenuWithItems(
  supabase: FPClient,
  id: string,
  locale: SupportedLang = "fr"
): Promise<{
  menu: FPMenu | null;
  items: Array<FPMenuItem & { article: FPArticle; translation: FPArticleTranslation | null }>;
}> {
  const [{ data: menu }, { data: itemsRaw }] = await Promise.all([
    supabase.from("menus").select("*").eq("id", id).single(),
    supabase
      .from("menu_items")
      .select("*, article:articles(*)")
      .eq("menu_id", id)
      .order("display_order"),
  ]);

  const items = itemsRaw ?? [];
  const articleIds = items.map((i: { article_id: string }) => i.article_id);

  let translations: FPArticleTranslation[] = [];
  if (articleIds.length > 0) {
    const { data } = await supabase
      .from("article_translations")
      .select("*")
      .in("article_id", articleIds)
      .eq("lang", locale);
    translations = data ?? [];
  }

  const itemsWithTranslations = items.map((i: FPMenuItem & { article: FPArticle; article_id: string }) => ({
    ...i,
    translation: translations.find((t) => t.article_id === i.article_id) ?? null,
  }));

  return { menu, items: itemsWithTranslations };
}

export async function getCurrentMenusForDate(
  supabase: FPClient,
  date: string,
  locale: SupportedLang = "fr"
): Promise<Array<{ menu: FPMenu; itemsCount: number }>> {
  const { data: menus } = await supabase
    .from("menus")
    .select("*")
    .eq("date", date)
    .eq("status", "published")
    .order("start_time");

  if (!menus || menus.length === 0) return [];

  const menuIds = menus.map((m: FPMenu) => m.id);
  const { data: items } = await supabase
    .from("menu_items")
    .select("menu_id, available, article:articles(active, nutri_validated, nutri_blocked, out_of_stock)")
    .in("menu_id", menuIds);

  void locale; // reserved for future translation prefetch

  return menus.map((menu: FPMenu) => {
    const visibleItems = (items ?? []).filter(
      (it: { menu_id: string; available: boolean; article: FPArticle }) =>
        it.menu_id === menu.id &&
        it.available &&
        it.article?.active &&
        it.article?.nutri_validated &&
        !it.article?.nutri_blocked &&
        !it.article?.out_of_stock
    );
    return { menu, itemsCount: visibleItems.length };
  });
}

export async function upsertMenu(
  supabase: FPClient,
  values: Partial<FPMenu>
): Promise<{ data: FPMenu | null; error: string | null }> {
  const { data, error } = await supabase
    .from("menus")
    .upsert(values, { onConflict: "id" })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function addMenuItem(
  supabase: FPClient,
  menuId: string,
  articleId: string,
  displayOrder: number
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("menu_items").insert({
    menu_id: menuId,
    article_id: articleId,
    display_order: displayOrder,
    available: true,
  });
  return { error: error?.message ?? null };
}

export async function removeMenuItem(
  supabase: FPClient,
  itemId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  return { error: error?.message ?? null };
}

export async function reorderMenuItem(
  supabase: FPClient,
  itemId: string,
  newOrder: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("menu_items")
    .update({ display_order: newOrder })
    .eq("id", itemId);
  return { error: error?.message ?? null };
}

export async function publishMenu(
  supabase: FPClient,
  menuId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("menus")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", menuId);
  return { error: error?.message ?? null };
}

// ── Order queries ─────────────────────────────────────────
// Toutes les transitions de statut critiques passent par des helpers
// nommés. Le trigger DB enforce_nutri_validation garantit qu'aucune
// transition vers transmise_resto → livree ne peut se faire sans
// validated_by_nutri_at ; ces helpers ajoutent la couche application.

export interface OrderWithItems {
  order: FPOrder;
  items: Array<FPOrderItem & { article: Pick<FPArticle, "id" | "name" | "category" | "photo_url" | "is_halal" | "is_vegetarian" | "is_vegan" | "is_gluten_free" | "is_lactose_free" | "nutri_validated" | "nutri_blocked"> }>;
}

export async function createOrder(
  supabase: FPClient,
  input: {
    playerId: string;
    service: ServiceType;
    scheduledAt: string;
    priority?: OrderPriority;
    locationLabel?: string | null;
    tripId?: string | null;
    hotelId?: string | null;
    roomNumber?: string | null;
    playerComment?: string | null;
    playerCommentLang?: SupportedLang | null;
    items: FPOrderItemInput[];
  }
): Promise<{ orderId: string | null; error: string | null }> {
  // Insert order in brouillon — pas de validation requise à ce stade
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      player_id: input.playerId,
      service: input.service,
      scheduled_at: input.scheduledAt,
      priority: input.priority ?? "normal",
      location_label: input.locationLabel ?? null,
      trip_id: input.tripId ?? null,
      hotel_id: input.hotelId ?? null,
      room_number: input.roomNumber ?? null,
      player_comment_original: input.playerComment ?? null,
      player_comment_lang: input.playerCommentLang ?? null,
      status: "brouillon",
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { orderId: null, error: orderErr?.message ?? "Order insert failed" };
  }

  if (input.items.length > 0) {
    const { error: itemsErr } = await supabase.from("order_items").insert(
      input.items.map((it) => ({
        order_id: order.id,
        article_id: it.article_id,
        quantity: it.quantity,
        portion_g: it.portion_g ?? null,
        player_note: it.player_note ?? null,
      }))
    );
    if (itemsErr) {
      // best-effort cleanup ; le trigger n'empêche pas la suppression d'un brouillon
      await supabase.from("orders").delete().eq("id", order.id);
      return { orderId: null, error: itemsErr.message };
    }
  }

  return { orderId: order.id, error: null };
}

export async function submitOrder(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  // brouillon → envoyee_joueur (passe la commande à la file nutri)
  const { error } = await supabase
    .from("orders")
    .update({ status: "envoyee_joueur" })
    .eq("id", orderId)
    .eq("status", "brouillon");
  return { error: error?.message ?? null };
}

export async function cancelOrder(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  // Annulation autorisée seulement avant transmission cuisine/hotel
  const { error } = await supabase
    .from("orders")
    .update({ status: "annulee" })
    .eq("id", orderId)
    .in("status", [
      "brouillon",
      "envoyee_joueur",
      "en_attente_nutri",
      "precision_demandee",
      "ajustee_nutri",
    ]);
  return { error: error?.message ?? null };
}

export async function listMyOrders(
  supabase: FPClient,
  playerId: string,
  limit = 50
): Promise<FPOrder[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("player_id", playerId)
    .is("archived_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOrderWithItems(
  supabase: FPClient,
  orderId: string,
  lang: SupportedLang = "fr"
): Promise<OrderWithItems | null> {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select(
      `
      id, order_id, article_id, quantity, portion_g, player_note, nutri_note, removed_by_nutri, added_by_nutri,
      article:articles!inner (
        id, name, category, photo_url,
        is_halal, is_vegetarian, is_vegan, is_gluten_free, is_lactose_free,
        nutri_validated, nutri_blocked,
        translations:article_translations ( lang, name )
      )
    `
    )
    .eq("order_id", orderId);

  // Resolve translated name when available
  type RawItem = FPOrderItem & {
    article: Pick<
      FPArticle,
      | "id"
      | "name"
      | "category"
      | "photo_url"
      | "is_halal"
      | "is_vegetarian"
      | "is_vegan"
      | "is_gluten_free"
      | "is_lactose_free"
      | "nutri_validated"
      | "nutri_blocked"
    > & { translations: { lang: SupportedLang; name: string }[] };
  };
  const resolved = ((items ?? []) as RawItem[]).map((it) => {
    const t = it.article.translations?.find((x) => x.lang === lang);
    const { translations: _omit, ...articleRest } = it.article;
    void _omit;
    return {
      ...it,
      article: { ...articleRest, name: t?.name ?? articleRest.name },
    };
  });

  return { order, items: resolved };
}

// ── Nutri validation queue ────────────────────────────────

export async function listOrdersAwaitingNutri(
  supabase: FPClient
): Promise<FPOrder[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .in("status", ["envoyee_joueur", "en_attente_nutri", "precision_demandee"])
    .is("archived_at", null)
    .order("scheduled_at");
  return data ?? [];
}

// Validation OK — passe à validee_nutri et set validated_by_nutri_at
export async function validateOrderNutri(
  supabase: FPClient,
  orderId: string,
  nutriId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "validee_nutri",
      validated_by_nutri: nutriId,
      validated_by_nutri_at: new Date().toISOString(),
      nutri_refusal_reason: null,
    })
    .eq("id", orderId);
  return { error: error?.message ?? null };
}

// Ajustement — modifications d'items + valide
export async function adjustOrderNutri(
  supabase: FPClient,
  orderId: string,
  nutriId: string,
  input: {
    notes: string;
    addedItems?: FPOrderItemInput[];
    removedItemIds?: string[];
    itemNotes?: Array<{ itemId: string; nutri_note: string }>;
  }
): Promise<{ error: string | null }> {
  if (input.removedItemIds && input.removedItemIds.length > 0) {
    const { error } = await supabase
      .from("order_items")
      .update({ removed_by_nutri: true })
      .in("id", input.removedItemIds);
    if (error) return { error: error.message };
  }

  if (input.addedItems && input.addedItems.length > 0) {
    const { error } = await supabase.from("order_items").insert(
      input.addedItems.map((it) => ({
        order_id: orderId,
        article_id: it.article_id,
        quantity: it.quantity,
        portion_g: it.portion_g ?? null,
        nutri_note: it.player_note ?? null,
        added_by_nutri: true,
      }))
    );
    if (error) return { error: error.message };
  }

  if (input.itemNotes && input.itemNotes.length > 0) {
    for (const n of input.itemNotes) {
      const { error } = await supabase
        .from("order_items")
        .update({ nutri_note: n.nutri_note })
        .eq("id", n.itemId);
      if (error) return { error: error.message };
    }
  }

  const { error: orderErr } = await supabase
    .from("orders")
    .update({
      status: "ajustee_nutri",
      validated_by_nutri: nutriId,
      validated_by_nutri_at: new Date().toISOString(),
      nutri_adjustment_notes: input.notes,
    })
    .eq("id", orderId);
  return { error: orderErr?.message ?? null };
}

// Refus — pas de validation, status refusee_nutri, raison obligatoire
export async function refuseOrderNutri(
  supabase: FPClient,
  orderId: string,
  nutriId: string,
  reason: string
): Promise<{ error: string | null }> {
  if (!reason.trim()) {
    return { error: "Refusal reason is required" };
  }
  const { error } = await supabase
    .from("orders")
    .update({
      status: "refusee_nutri",
      validated_by_nutri: nutriId,
      validated_by_nutri_at: null,
      nutri_refusal_reason: reason,
    })
    .eq("id", orderId);
  return { error: error?.message ?? null };
}

// Demande de précision — pas de validation, renvoie au joueur
export async function askPrecisionNutri(
  supabase: FPClient,
  orderId: string,
  nutriId: string,
  message: string
): Promise<{ error: string | null }> {
  if (!message.trim()) {
    return { error: "Precision message is required" };
  }
  const { error } = await supabase
    .from("orders")
    .update({
      status: "precision_demandee",
      validated_by_nutri: nutriId,
      validated_by_nutri_at: null,
      nutri_adjustment_notes: message,
    })
    .eq("id", orderId);
  return { error: error?.message ?? null };
}

// ── Resto / cuisine / hotel transitions ───────────────────
// Toutes ces transitions sont gardées par le trigger DB.
// L'app ajoute des contrôles de cohérence (statut source attendu).

export async function transmitToResto(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "transmise_resto" })
    .eq("id", orderId)
    .in("status", ["validee_nutri", "ajustee_nutri"]);
  return { error: error?.message ?? null };
}

export async function validateOrderResto(
  supabase: FPClient,
  orderId: string,
  restoUserId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "validee_resto",
      validated_by_resto: restoUserId,
      validated_by_resto_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "transmise_resto");
  return { error: error?.message ?? null };
}

export async function transmitToKitchen(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "transmise_cuisine",
      transmitted_to_kitchen_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "validee_resto");
  return { error: error?.message ?? null };
}

export async function transmitToHotel(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "transmise_hotel",
      transmitted_to_hotel_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "validee_resto");
  return { error: error?.message ?? null };
}

export async function markPrepStarted(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "en_preparation",
      prep_started_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "transmise_cuisine");
  return { error: error?.message ?? null };
}

export async function markReady(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "prete", ready_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "en_preparation");
  return { error: error?.message ?? null };
}

export async function markDelivered(
  supabase: FPClient,
  orderId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "livree", delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", ["prete", "transmise_hotel"]);
  return { error: error?.message ?? null };
}

// ── Validation logs ───────────────────────────────────────

export async function getOrderValidationLogs(
  supabase: FPClient,
  orderId: string
): Promise<FPOrderValidationLog[]> {
  const { data } = await supabase
    .from("order_validation_logs")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// Batch fetch player names (id → "Prénom Nom") pour décorer une liste de commandes
export async function getPlayerNamesByIds(
  supabase: FPClient,
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("players")
    .select("id, first_name, last_name")
    .in("id", ids);
  const map: Record<string, string> = {};
  (data ?? []).forEach((p: { id: string; first_name: string; last_name: string }) => {
    map[p.id] = `${p.first_name} ${p.last_name}`.trim();
  });
  return map;
}

// Compteurs file nutri (badge UI)
export async function countOrdersAwaitingNutri(
  supabase: FPClient
): Promise<number> {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", ["envoyee_joueur", "en_attente_nutri"]);
  return count ?? 0;
}
