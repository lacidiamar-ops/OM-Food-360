import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import NutriProgramForm from "@/components/nutrition/NutriProgramForm";

interface PageProps {
  params: Promise<{ locale: string }>;
}

interface PlayerRow {
  id:        string;
  full_name: string | null;
  position:  string | null;
}

interface OnboardingRow {
  player_id: string;
  weight_kg: number | null;
}

export default async function NewNutriProgramPage({ params }: PageProps) {
  await params; // locale not needed here but consumed for future use
  const t = await getTranslations("nutrition");
  const supabase = await createClient();

  // Fetch profiles with joueur role
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "joueur")
    .order("full_name", { ascending: true });

  // Fetch players for positions
  const { data: players } = await supabase
    .schema("food_passport" as never)
    .from("players")
    .select("profile_id, position");

  // Fetch onboarding for weight
  const { data: onboarding } = await supabase
    .schema("food_passport" as never)
    .from("player_onboarding_forms")
    .select("player_id, weight_kg");

  const profileList = (profiles ?? []) as PlayerRow[];
  const playerList  = (players ?? []) as Array<{ profile_id: string; position: string | null }>;
  const obList      = (onboarding ?? []) as OnboardingRow[];

  // Merge data
  const enrichedPlayers = profileList.map((profile) => {
    const playerData = playerList.find((p) => p.profile_id === profile.id);
    const obData     = obList.find((o) => o.player_id === profile.id);
    return {
      id:        profile.id,
      full_name: profile.full_name,
      position:  playerData?.position ?? null,
      weight_kg: obData?.weight_kg ?? undefined,
    };
  });

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <PageHeader
        label={t("sectionLabel")}
        title={t("newProgramTitle")}
      />
      <NutriProgramForm players={enrichedPlayers} />
    </div>
  );
}
