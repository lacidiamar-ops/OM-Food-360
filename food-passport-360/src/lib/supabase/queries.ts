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
  FPTrip,
  FPHotel,
  FPHotelAccess,
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

// ── Cuisine / Kanban ──────────────────────────────────────

export interface KitchenOrder {
  id: string;
  reference: string;
  player_id: string;
  player_first_name: string;
  player_last_name: string;
  service: ServiceType;
  scheduled_at: string;
  status: OrderStatus;
  priority: OrderPriority;
  location_label: string | null;
  transmitted_to_kitchen_at: string | null;
  prep_started_at: string | null;
  ready_at: string | null;
  player_comment_original: string | null;
  is_halal: boolean;
  is_gluten_free: boolean;
  items_summary: string;
  items_count: number;
}

export interface KitchenStats {
  transmise_cuisine: number;
  en_preparation: number;
  prete: number;
  livree_today: number;
  annulee_today: number;
  total_validated_today: number;
}

export async function listKitchenOrders(
  supabase: FPClient,
  date?: string
): Promise<KitchenOrder[]> {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("orders")
    .select(
      `id, reference, player_id, service, scheduled_at, status, priority, location_label,
       transmitted_to_kitchen_at, prep_started_at, ready_at, player_comment_original,
       player:players!inner(first_name, last_name),
       order_items(removed_by_nutri, article:articles!inner(name, is_halal, is_gluten_free))`
    )
    .in("status", ["transmise_cuisine", "en_preparation", "prete"])
    .gte("scheduled_at", `${d}T00:00:00.000Z`)
    .lte("scheduled_at", `${d}T23:59:59.999Z`)
    .is("archived_at", null)
    .order("scheduled_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = (row.order_items ?? []).filter((it: any) => !it.removed_by_nutri);
    return {
      id: row.id,
      reference: row.reference,
      player_id: row.player_id,
      player_first_name: row.player?.first_name ?? "",
      player_last_name: row.player?.last_name ?? "",
      service: row.service,
      scheduled_at: row.scheduled_at,
      status: row.status,
      priority: row.priority,
      location_label: row.location_label,
      transmitted_to_kitchen_at: row.transmitted_to_kitchen_at,
      prep_started_at: row.prep_started_at,
      ready_at: row.ready_at,
      player_comment_original: row.player_comment_original,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_halal: active.some((it: any) => it.article?.is_halal),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_gluten_free: active.some((it: any) => it.article?.is_gluten_free),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items_summary: active.map((it: any) => it.article?.name).filter(Boolean).join(", "),
      items_count: active.length,
    };
  });
}

export async function getKitchenStats(
  supabase: FPClient,
  date?: string
): Promise<KitchenStats> {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("orders")
    .select("status")
    .not("status", "in", "(brouillon,envoyee_joueur,en_attente_nutri,precision_demandee)")
    .gte("scheduled_at", `${d}T00:00:00.000Z`)
    .lte("scheduled_at", `${d}T23:59:59.999Z`)
    .is("archived_at", null);

  const counts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data ?? []).forEach((row: any) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    transmise_cuisine: counts["transmise_cuisine"] ?? 0,
    en_preparation: counts["en_preparation"] ?? 0,
    prete: counts["prete"] ?? 0,
    livree_today: counts["livree"] ?? 0,
    annulee_today: counts["annulee"] ?? 0,
    total_validated_today: total,
  };
}

// Resto dashboard — toutes les commandes validées nutri pour aujourd'hui
export interface RestoOrder {
  id: string;
  reference: string;
  player_first_name: string;
  player_last_name: string;
  service: ServiceType;
  scheduled_at: string;
  status: OrderStatus;
  priority: OrderPriority;
  validated_by_nutri_at: string | null;
  location_label: string | null;
  items_count: number;
}

export async function listRestoOrdersToday(
  supabase: FPClient,
  date?: string
): Promise<RestoOrder[]> {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("orders")
    .select(
      `id, reference, service, scheduled_at, status, priority, validated_by_nutri_at, location_label,
       player:players!inner(first_name, last_name),
       order_items(removed_by_nutri)`
    )
    .not("validated_by_nutri_at", "is", null)
    .gte("scheduled_at", `${d}T00:00:00.000Z`)
    .lte("scheduled_at", `${d}T23:59:59.999Z`)
    .is("archived_at", null)
    .order("scheduled_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    reference: row.reference,
    player_first_name: row.player?.first_name ?? "",
    player_last_name: row.player?.last_name ?? "",
    service: row.service,
    scheduled_at: row.scheduled_at,
    status: row.status,
    priority: row.priority,
    validated_by_nutri_at: row.validated_by_nutri_at,
    location_label: row.location_label,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items_count: (row.order_items ?? []).filter((it: any) => !it.removed_by_nutri).length,
  }));
}

// ── Hotels ────────────────────────────────────────────────

export async function listHotels(
  supabase: FPClient
): Promise<FPHotel[]> {
  const { data } = await supabase
    .from("hotels")
    .select("*")
    .is("archived_at", null)
    .order("name");
  return data ?? [];
}

export async function upsertHotel(
  supabase: FPClient,
  values: Partial<FPHotel>
): Promise<{ data: FPHotel | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hotels")
    .upsert(values, { onConflict: "id" })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

// ── Trips ─────────────────────────────────────────────────

export interface TripWithHotel extends FPTrip {
  hotel: Pick<FPHotel, "id" | "name" | "city"> | null;
  access_count: number;
}

export async function listTrips(
  supabase: FPClient
): Promise<TripWithHotel[]> {
  const { data } = await supabase
    .from("trips")
    .select(`
      *,
      hotel:hotels(id, name, city),
      hotel_access(id)
    `)
    .order("start_date", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    hotel: row.hotel ?? null,
    access_count: (row.hotel_access ?? []).length,
  }));
}

export interface TripWithDetails extends FPTrip {
  hotel: FPHotel | null;
  accesses: Array<FPHotelAccess & { profile: { email: string } | null }>;
}

export async function getTripWithDetails(
  supabase: FPClient,
  tripId: string
): Promise<TripWithDetails | null> {
  const { data } = await supabase
    .from("trips")
    .select(`
      *,
      hotel:hotels(*),
      accesses:hotel_access(*, profile:profiles(email))
    `)
    .eq("id", tripId)
    .single();

  if (!data) return null;
  return {
    ...data,
    hotel: data.hotel ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accesses: (data.accesses ?? []) as any,
  };
}

export async function createTrip(
  supabase: FPClient,
  values: {
    name: string;
    city?: string | null;
    start_date: string;
    end_date: string;
    hotel_id?: string | null;
    stadium?: string | null;
    match_time?: string | null;
    meal_times?: string | null;
    created_by: string;
  }
): Promise<{ data: FPTrip | null; error: string | null }> {
  const { data, error } = await supabase
    .from("trips")
    .insert({ ...values, status: "planifie" })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function updateTrip(
  supabase: FPClient,
  tripId: string,
  values: Partial<FPTrip>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("trips")
    .update(values)
    .eq("id", tripId);
  return { error: error?.message ?? null };
}

export async function archiveTrip(
  supabase: FPClient,
  tripId: string
): Promise<{ error: string | null }> {
  // Marque annule — pas de DELETE (audit trail)
  const { error } = await supabase
    .from("trips")
    .update({ status: "annule" })
    .eq("id", tripId);
  return { error: error?.message ?? null };
}

// ── Hotel access ──────────────────────────────────────────

export interface HotelAccessWithProfile extends FPHotelAccess {
  profile: { email: string } | null;
}

export async function listHotelProfiles(
  supabase: FPClient
): Promise<Array<{ id: string; email: string }>> {
  const { data } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "hotel")
    .order("email");
  return data ?? [];
}

export async function createHotelAccess(
  supabase: FPClient,
  values: {
    trip_id: string;
    hotel_id: string;
    profile_id: string;
    granted_by: string;
    starts_at: string;
    expires_at: string;
    raw_token: string;   // fourni par le server action (UUID en clair)
  }
): Promise<{ data: FPHotelAccess | null; error: string | null }> {
  const { data, error } = await supabase
    .from("hotel_access")
    .insert({
      trip_id: values.trip_id,
      hotel_id: values.hotel_id,
      profile_id: values.profile_id,
      granted_by: values.granted_by,
      starts_at: values.starts_at,
      expires_at: values.expires_at,
      token_hash: values.raw_token, // server action hash côté Node avant d'appeler
    })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function revokeHotelAccess(
  supabase: FPClient,
  accessId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("hotel_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);
  return { error: error?.message ?? null };
}

// ── Portail hôtel — commandes du jour ─────────────────────

export interface HotelOrder {
  id: string;
  reference: string;
  player_first_name: string;
  player_last_name: string;
  service: ServiceType;
  scheduled_at: string;
  status: OrderStatus;
  location_label: string | null;
  room_number: string | null;
  nutri_adjustment_notes: string | null;
  is_halal: boolean;
  is_gluten_free: boolean;
  is_vegetarian: boolean;
  items: Array<{ name: string; quantity: number; nutri_note: string | null }>;
}

export async function listHotelOrdersToday(
  supabase: FPClient,
  date?: string
): Promise<HotelOrder[]> {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("orders")
    .select(`
      id, reference, service, scheduled_at, status,
      location_label, room_number, nutri_adjustment_notes,
      player:players!inner(first_name, last_name),
      order_items(
        quantity, nutri_note, removed_by_nutri,
        article:articles!inner(name, is_halal, is_gluten_free, is_vegetarian)
      )
    `)
    .eq("status", "transmise_hotel")
    .not("validated_by_nutri_at", "is", null)
    .gte("scheduled_at", `${d}T00:00:00.000Z`)
    .lte("scheduled_at", `${d}T23:59:59.999Z`)
    .is("archived_at", null)
    .order("scheduled_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = (row.order_items ?? []).filter((it: any) => !it.removed_by_nutri);
    return {
      id: row.id,
      reference: row.reference,
      player_first_name: row.player?.first_name ?? "",
      player_last_name: row.player?.last_name ?? "",
      service: row.service,
      scheduled_at: row.scheduled_at,
      status: row.status,
      location_label: row.location_label,
      room_number: row.room_number,
      nutri_adjustment_notes: row.nutri_adjustment_notes,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_halal: active.some((it: any) => it.article?.is_halal),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_gluten_free: active.some((it: any) => it.article?.is_gluten_free),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_vegetarian: active.some((it: any) => it.article?.is_vegetarian),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: active.map((it: any) => ({
        name: it.article?.name ?? "",
        quantity: it.quantity,
        nutri_note: it.nutri_note,
      })),
    };
  });
}

export async function checkHotelHasActiveAccess(
  supabase: FPClient
): Promise<boolean> {
  // Appelle la fonction RPC Postgres hotel_has_active_access()
  const { data } = await supabase.rpc("hotel_has_active_access");
  return data === true;
}

// ────────────────────────────────────────────────────────────────────────────
// SEMAINE 7 — Photos preuve repas + Feedbacks satisfaction
// ────────────────────────────────────────────────────────────────────────────

export interface ActionPhotoWithPlayer {
  id: string;
  storage_path: string;
  caption: string | null;
  context_type: string;
  status: string;
  uploaded_by: string;
  uploader_role: string;
  order_id: string | null;
  trip_id: string | null;
  validator_comment: string | null;
  validated_at: string | null;
  created_at: string;
  order_reference: string | null;
  player_first_name: string | null;
  player_last_name: string | null;
}

export async function insertActionPhoto(
  supabase: FPClient,
  data: {
    storage_path: string;
    uploaded_by: string;
    uploader_role: string;
    order_id?: string | null;
    trip_id?: string | null;
    context_type: string;
    caption?: string | null;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data: row, error } = await supabase
    .schema("food_passport")
    .from("action_photos")
    .insert({ status: "en_attente", ...data })
    .select("id")
    .single();
  return { id: row?.id ?? null, error: error?.message ?? null };
}

export async function listActionPhotosPending(
  supabase: FPClient,
  _role: "nutri" | "resto"
): Promise<ActionPhotoWithPlayer[]> {
  const { data } = await supabase
    .schema("food_passport")
    .from("action_photos")
    .select(
      `id, storage_path, caption, context_type, status, uploaded_by, uploader_role,
       order_id, trip_id, validator_comment, validated_at, created_at,
       order:orders(reference, player:players!inner(first_name, last_name))`
    )
    .eq("status", "en_attente")
    .order("created_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    storage_path: row.storage_path,
    caption: row.caption,
    context_type: row.context_type,
    status: row.status,
    uploaded_by: row.uploaded_by,
    uploader_role: row.uploader_role,
    order_id: row.order_id,
    trip_id: row.trip_id,
    validator_comment: row.validator_comment,
    validated_at: row.validated_at,
    created_at: row.created_at,
    order_reference: row.order?.reference ?? null,
    player_first_name: row.order?.player?.first_name ?? null,
    player_last_name: row.order?.player?.last_name ?? null,
  }));
}

export async function validateActionPhoto(
  supabase: FPClient,
  photoId: string,
  newStatus: "validee" | "refusee" | "non_conforme",
  validatorId: string,
  comment?: string | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .schema("food_passport")
    .from("action_photos")
    .update({
      status: newStatus,
      validated_by: validatorId,
      validated_at: new Date().toISOString(),
      validator_comment: comment ?? null,
    })
    .eq("id", photoId);
  return { error: error?.message ?? null };
}

export async function listMyActionPhotos(
  supabase: FPClient,
  orderId: string
): Promise<{ id: string; storage_path: string; status: string; caption: string | null; created_at: string }[]> {
  const { data } = await supabase
    .schema("food_passport")
    .from("action_photos")
    .select("id, storage_path, status, caption, created_at")
    .eq("order_id", orderId)
    .order("created_at");
  return data ?? [];
}

export interface FeedbackWithPlayer {
  id: string;
  order_id: string | null;
  player_id: string;
  trip_id: string | null;
  topic: string[];
  rating: number;
  smiley: string | null;
  comment_original: string | null;
  comment_lang: string | null;
  tags: string[] | null;
  created_at: string;
  player_first_name: string | null;
  player_last_name: string | null;
  order_reference: string | null;
}

export async function insertFeedback(
  supabase: FPClient,
  data: {
    order_id?: string | null;
    player_id: string;
    trip_id?: string | null;
    hotel_id?: string | null;
    topic: string[];
    rating: number;
    smiley?: string | null;
    comment_original?: string | null;
    comment_lang?: string | null;
    tags?: string[] | null;
  }
): Promise<{ id: string | null; error: string | null }> {
  const { data: row, error } = await supabase
    .schema("food_passport")
    .from("feedbacks")
    .insert(data)
    .select("id")
    .single();
  return { id: row?.id ?? null, error: error?.message ?? null };
}

export async function listFeedbacks(
  supabase: FPClient,
  limit = 50
): Promise<FeedbackWithPlayer[]> {
  const { data } = await supabase
    .schema("food_passport")
    .from("feedbacks")
    .select(
      `id, order_id, player_id, trip_id, topic, rating, smiley, comment_original, comment_lang, tags, created_at,
       player:players!inner(first_name, last_name),
       order:orders(reference)`
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    order_id: row.order_id,
    player_id: row.player_id,
    trip_id: row.trip_id,
    topic: row.topic ?? [],
    rating: row.rating,
    smiley: row.smiley,
    comment_original: row.comment_original,
    comment_lang: row.comment_lang,
    tags: row.tags,
    created_at: row.created_at,
    player_first_name: row.player?.first_name ?? null,
    player_last_name: row.player?.last_name ?? null,
    order_reference: row.order?.reference ?? null,
  }));
}

export async function getMyFeedbackForOrder(
  supabase: FPClient,
  orderId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .schema("food_passport")
    .from("feedbacks")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  return data ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// SEMAINE 8 — Audit logs + stats globales
// ────────────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  actor_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export async function listAuditLogs(
  supabase: FPClient,
  opts: { limit?: number; table_name?: string; actor_role?: string } = {}
): Promise<AuditLogEntry[]> {
  let q = supabase
    .schema("food_passport")
    .from("audit_logs")
    .select(
      `id, actor_id, actor_role, action, table_name, record_id, old_value, new_value, created_at,
       actor:profiles(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.table_name) q = q.eq("table_name", opts.table_name);
  if (opts.actor_role) q = q.eq("actor_role", opts.actor_role);

  const { data } = await q;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    id: row.id,
    actor_id: row.actor_id,
    actor_role: row.actor_role,
    actor_name: row.actor?.full_name ?? null,
    action: row.action,
    table_name: row.table_name,
    record_id: row.record_id,
    old_value: row.old_value,
    new_value: row.new_value,
    created_at: row.created_at,
  }));
}

export interface GlobalStats {
  total_players: number;
  orders_today: number;
  orders_pending_nutri: number;
  feedbacks_total: number;
  photos_pending: number;
  active_trips: number;
}

export async function getGlobalStats(supabase: FPClient): Promise<GlobalStats> {
  const today = new Date().toISOString().slice(0, 10);

  const [players, ordersToday, ordersPending, feedbacks, photos, trips] = await Promise.all([
    supabase.schema("food_passport").from("players").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.schema("food_passport").from("orders").select("id", { count: "exact", head: true })
      .gte("scheduled_at", `${today}T00:00:00Z`).lte("scheduled_at", `${today}T23:59:59Z`).is("archived_at", null),
    supabase.schema("food_passport").from("orders").select("id", { count: "exact", head: true })
      .eq("status", "en_attente_nutri").is("archived_at", null),
    supabase.schema("food_passport").from("feedbacks").select("id", { count: "exact", head: true }),
    supabase.schema("food_passport").from("action_photos").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
    supabase.schema("food_passport").from("trips").select("id", { count: "exact", head: true }).eq("status", "en_cours"),
  ]);

  return {
    total_players: players.count ?? 0,
    orders_today: ordersToday.count ?? 0,
    orders_pending_nutri: ordersPending.count ?? 0,
    feedbacks_total: feedbacks.count ?? 0,
    photos_pending: photos.count ?? 0,
    active_trips: trips.count ?? 0,
  };
}

export interface OrderExportRow {
  reference: string;
  player: string;
  service: string;
  status: string;
  scheduled_at: string;
  validated_by_nutri_at: string | null;
  delivered_at: string | null;
  items_count: number;
}

export async function listOrdersForExport(
  supabase: FPClient,
  fromDate: string,
  toDate: string
): Promise<OrderExportRow[]> {
  const { data } = await supabase
    .schema("food_passport")
    .from("orders")
    .select(
      `reference, service, status, scheduled_at, validated_by_nutri_at, delivered_at,
       player:players!inner(first_name, last_name),
       order_items(removed_by_nutri)`
    )
    .gte("scheduled_at", `${fromDate}T00:00:00Z`)
    .lte("scheduled_at", `${toDate}T23:59:59Z`)
    .is("archived_at", null)
    .order("scheduled_at");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    reference: row.reference,
    player: `${row.player?.first_name ?? ""} ${row.player?.last_name ?? ""}`.trim(),
    service: row.service,
    status: row.status,
    scheduled_at: row.scheduled_at,
    validated_by_nutri_at: row.validated_by_nutri_at,
    delivered_at: row.delivered_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items_count: (row.order_items ?? []).filter((it: any) => !it.removed_by_nutri).length,
  }));
}
