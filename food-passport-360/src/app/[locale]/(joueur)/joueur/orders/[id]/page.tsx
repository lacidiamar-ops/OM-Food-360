import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrderWithItems,
  getOrderValidationLogs,
  getPlayerByProfileId,
} from "@/lib/supabase/queries";
import PlayerOrderDetail from "@/components/domain/PlayerOrderDetail";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("orders");
  return { title: `${t("detailTitle")} ${id.slice(0, 8)}` };
}

export default async function PlayerOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const locale = (await getLocale()) as SupportedLang;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const player = await getPlayerByProfileId(supabase, user.id);
  if (!player) notFound();

  const data = await getOrderWithItems(supabase, id, locale);
  if (!data) notFound();

  // RLS garantit déjà que le joueur ne voit que ses commandes,
  // mais on double-check ici par sécurité (defense in depth).
  if (data.order.player_id !== player.id) notFound();

  const logs = await getOrderValidationLogs(supabase, id);

  return (
    <PlayerOrderDetail
      order={data.order}
      items={data.items}
      logs={logs}
    />
  );
}
