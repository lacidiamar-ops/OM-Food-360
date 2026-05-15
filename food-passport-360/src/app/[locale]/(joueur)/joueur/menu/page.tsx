import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMenusForDate, getMenuWithItems } from "@/lib/supabase/queries";
import PlayerMenuView from "@/components/domain/PlayerMenuView";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

export async function generateMetadata() {
  const t = await getTranslations("menus");
  return { title: t("todaysMenu") };
}

export default async function PlayerMenuPage() {
  const supabase = await createClient();
  const locale = (await getLocale()) as SupportedLang;
  const today = new Date().toISOString().slice(0, 10);

  const headers = await getCurrentMenusForDate(supabase, today, locale);
  const menus = await Promise.all(
    headers.map(async ({ menu }) => {
      const { items } = await getMenuWithItems(supabase, menu.id, locale);
      return { menu, items };
    })
  );

  return <PlayerMenuView menus={menus} date={today} />;
}
