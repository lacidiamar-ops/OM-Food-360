import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/ui/EmptyState";
import NutritionDayClient from "@/components/nutrition/NutritionDayClient";
import type { FPDailyPlanFull, FPPrescribedMeal, FPPrescribedSupplement, FPMealConsumption, FPSupplementConsumption, FPDailyScore } from "@/lib/supabase/food-passport.types";

interface PageProps {
  params: Promise<{ date: string; locale: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations("nutrition");
  return { title: t("title") };
}

export default async function NutritionDayPage({ params }: PageProps) {
  const { date } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("nutrition");

  // Get player profile linked to this user
  const { data: player } = await supabase
    .schema("food_passport" as never)
    .from("players")
    .select("id, first_name, last_name, preferred_lang")
    .eq("profile_id", user.id)
    .is("archived_at", null)
    .single();

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <EmptyState
          icon="🍽️"
          title={t("noplan")}
          description={t("noplanDesc")}
        />
      </div>
    );
  }

  const typedPlayer = player as { id: string; first_name: string; last_name: string; preferred_lang: string | null };

  // Get daily nutrition plan for this player + date
  const { data: planData } = await supabase
    .schema("food_passport" as never)
    .from("daily_nutrition_plans")
    .select("*")
    .eq("player_id", typedPlayer.id)
    .eq("date", date)
    .single();

  if (!planData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <EmptyState
          icon="📋"
          title={t("noplan")}
          description={t("noplanDesc")}
        />
      </div>
    );
  }

  const plan = planData as { id: string; program_id: string; player_id: string; date: string; day_type: string; target_calories: number | null; target_protein_g: number | null; target_carbs_g: number | null; target_fat_g: number | null; target_water_ml: number | null; target_fiber_g: number | null; meal_priorities: Record<string, number>; notes_from_nutri: string | null; nutri_message: string | null; nutri_message_lang: string; created_at: string };

  // Fetch all related data in parallel
  const [
    { data: mealsData },
    { data: supplementsData },
    { data: consumptionData },
    { data: scoreData },
  ] = await Promise.all([
    supabase
      .schema("food_passport" as never)
      .from("prescribed_meals")
      .select("*")
      .eq("daily_plan_id", plan.id)
      .order("sort_order"),

    supabase
      .schema("food_passport" as never)
      .from("prescribed_supplements")
      .select("*")
      .eq("daily_plan_id", plan.id)
      .order("sort_order"),

    supabase
      .schema("food_passport" as never)
      .from("meal_consumption")
      .select("*")
      .eq("daily_plan_id", plan.id)
      .eq("player_id", typedPlayer.id),

    supabase
      .schema("food_passport" as never)
      .from("daily_scores")
      .select("*")
      .eq("player_id", typedPlayer.id)
      .eq("program_id", plan.program_id)
      .eq("date", date)
      .single(),
  ]);

  const meals = (mealsData ?? []) as FPPrescribedMeal[];
  const supplements = (supplementsData ?? []) as FPPrescribedSupplement[];
  const consumption = (consumptionData ?? []) as FPMealConsumption[];

  // Get supplement consumption if supplements exist
  let suppConsumption: FPSupplementConsumption[] = [];
  if (supplements.length > 0) {
    const { data: suppConsData } = await supabase
      .schema("food_passport" as never)
      .from("supplement_consumption")
      .select("*")
      .in(
        "prescribed_supplement_id",
        supplements.map(s => s.id)
      )
      .eq("player_id", typedPlayer.id);
    suppConsumption = (suppConsData ?? []) as FPSupplementConsumption[];
  }

  // Get nutri name if message exists
  let nutriName = "Nutritionniste";
  if (plan.nutri_message) {
    // Fetch from the program to get the nutri who created it
    const { data: programData } = await supabase
      .schema("food_passport" as never)
      .from("nutrition_programs")
      .select("created_by")
      .eq("id", plan.program_id)
      .single();

    if (programData) {
      const prog = programData as { created_by: string | null };
      if (prog.created_by) {
        const { data: nutriProfile } = await supabase
          .schema("food_passport" as never)
          .from("profiles")
          .select("full_name")
          .eq("id", prog.created_by)
          .single();
        if (nutriProfile) {
          nutriName = (nutriProfile as { full_name: string | null }).full_name ?? "Nutritionniste";
        }
      }
    }
  }

  const planFull: FPDailyPlanFull = {
    ...plan,
    day_type: plan.day_type as FPDailyPlanFull["day_type"],
    meals,
    supplements,
    consumption,
    supplement_consumption: suppConsumption,
    score: (scoreData ?? null) as FPDailyScore | null,
  };

  const playerInitials = [typedPlayer.first_name[0], typedPlayer.last_name[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const playerLang = typedPlayer.preferred_lang ?? locale;

  return (
    <NutritionDayClient
      plan={planFull}
      currentUserId={user.id}
      playerInitials={playerInitials}
      playerLang={playerLang}
      nutriName={nutriName}
    />
  );
}
