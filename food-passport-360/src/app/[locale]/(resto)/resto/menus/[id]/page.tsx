import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getMenuWithItems, listArticles } from "@/lib/supabase/queries";
import MenuEditor from "@/components/domain/MenuEditor";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MenuDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = (await getLocale()) as SupportedLang;

  const [{ menu, items }, articles] = await Promise.all([
    getMenuWithItems(supabase, id, locale),
    listArticles(supabase, { active: true }),
  ]);

  if (!menu) notFound();

  return <MenuEditor menu={menu} items={items} availableArticles={articles} />;
}
