import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  listOrdersAwaitingNutri,
  getPlayerNamesByIds,
} from "@/lib/supabase/queries";
import NutriQueueView from "@/components/domain/NutriQueueView";

export async function generateMetadata() {
  const t = await getTranslations("nutriQueue");
  return { title: t("title") };
}

export default async function NutriQueuePage() {
  const supabase = await createClient();
  const orders = await listOrdersAwaitingNutri(supabase);
  const names = await getPlayerNamesByIds(
    supabase,
    Array.from(new Set(orders.map((o) => o.player_id)))
  );

  const decorated = orders.map((o) => ({
    ...o,
    player_name: names[o.player_id] ?? null,
  }));

  return <NutriQueueView orders={decorated} />;
}
