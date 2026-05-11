import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMenusForDate, getMenuWithItems } from "@/lib/supabase/queries";
import OrderBuilder from "@/components/domain/OrderBuilder";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

export async function generateMetadata() {
  const t = await getTranslations("commander");
  return { title: t("title") };
}

export default async function CommanderPage() {
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

  return <OrderBuilder menus={menus} date={today} />;
}
