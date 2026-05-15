import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrderWithItems,
  getOrderValidationLogs,
  getPlayerNamesByIds,
  listArticles,
} from "@/lib/supabase/queries";
import NutriOrderDetail from "@/components/domain/NutriOrderDetail";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("orders");
  return { title: `${t("detailTitle")} ${id.slice(0, 8)}` };
}

export default async function NutriOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = (await getLocale()) as SupportedLang;

  const data = await getOrderWithItems(supabase, id, locale);
  if (!data) notFound();

  const logs = await getOrderValidationLogs(supabase, id);
  const names = await getPlayerNamesByIds(supabase, [data.order.player_id]);

  // Catalogue articles validés (pour l'ajout dans le modal d'ajustement)
  const catalog = await listArticles(supabase, { active: true });

  return (
    <NutriOrderDetail
      order={data.order}
      items={data.items}
      logs={logs}
      catalog={catalog}
      playerName={names[data.order.player_id]}
    />
  );
}
