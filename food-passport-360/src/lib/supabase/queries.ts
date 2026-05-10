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
