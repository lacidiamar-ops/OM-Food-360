import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  const { id, locale } = await params;
  const supabase = await createClient();
  const t = await getTranslations("tracking");

  const [player, form] = await Promise.all([
    getPlayerById(supabase, id),
    getOnboardingForm(supabase, id),
  ]);

  if (!player) notFound();

  return (
    <div className="space-y-4">
      {/* Bouton accès suivi nutritionnel */}
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        <Link
          href={`/${locale}/nutri/players/${id}/tracking`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("trackingBtn")}
        </Link>
      </div>
      <PlayerOnboardingForm player={player} form={form} />
    </div>
  );
}
