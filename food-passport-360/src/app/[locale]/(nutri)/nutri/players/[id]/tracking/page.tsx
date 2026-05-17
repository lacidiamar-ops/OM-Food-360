import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPlayerById, getLatestNutritionTracking } from "@/lib/supabase/queries";
import NutritionTrackingForm from "@/components/domain/NutritionTrackingForm";
import { saveNutritionTracking } from "./actions";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const t = await getTranslations("tracking");
  const { id } = await params;
  const supabase = await createClient();
  const player = await getPlayerById(supabase, id);
  if (!player) return { title: t("title") };
  return { title: `${player.last_name} ${player.first_name} · ${t("title")}` };
}

export default async function NutritionTrackingPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations("tracking");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [player, tracking] = await Promise.all([
    getPlayerById(supabase, id),
    getLatestNutritionTracking(supabase, id),
  ]);

  if (!player) redirect(`/${locale}/nutri/players`);

  const playerName = `${player.first_name} ${player.last_name}`;

  return (
    <div className="space-y-6 px-4 py-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {playerName}
          {player.jersey_number != null && ` · #${player.jersey_number}`}
        </p>
      </div>
      <NutritionTrackingForm
        playerId={id}
        nutriId={user.id}
        playerName={playerName}
        existing={tracking}
        onSave={saveNutritionTracking}
      />
    </div>
  );
}
