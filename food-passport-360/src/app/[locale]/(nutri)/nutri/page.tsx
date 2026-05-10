import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listPlayersWithFormStatus } from "@/lib/supabase/queries";
import NutriPlayerList from "@/components/domain/NutriPlayerList";

export async function generateMetadata() {
  const t = await getTranslations("nutri");
  return { title: t("players") };
}

export default async function NutriPage() {
  const supabase = await createClient();
  const players = await listPlayersWithFormStatus(supabase);

  return <NutriPlayerList players={players} />;
}
