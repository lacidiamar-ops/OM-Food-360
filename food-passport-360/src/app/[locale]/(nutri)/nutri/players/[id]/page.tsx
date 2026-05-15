import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlayerById, getOnboardingForm } from "@/lib/supabase/queries";
import PlayerOnboardingForm from "@/components/domain/PlayerOnboardingForm";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const t = await getTranslations("nutri");
  const { id } = await params;
  const supabase = await createClient();
  const player = await getPlayerById(supabase, id);
  if (!player) return { title: t("playerDetail") };
  return { title: `${player.last_name} ${player.first_name} · Fiche` };
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [player, form] = await Promise.all([
    getPlayerById(supabase, id),
    getOnboardingForm(supabase, id),
  ]);

  if (!player) notFound();

  return <PlayerOnboardingForm player={player} form={form} />;
}
