import type { SupabaseClient } from "@supabase/supabase-js";
import type { AvatarColor, DayType } from "@/lib/supabase/food-passport.types";

// Day-type multipliers for score weighting
const DAY_MULTIPLIER: Record<DayType, number> = {
  "j-6":    1.0,
  "j-5":    1.0,
  "j-4":    1.1,
  "j-3":    1.1,
  "j-2":    1.2,
  "j-1":    1.5,
  match:    2.0,
  "j+1":    1.1,
  "j+2":    1.0,
  normal:   1.0,
};

export function scoreToAvatarColor(score: number): AvatarColor {
  if (score < 40)  return "red";
  if (score < 60)  return "orange";
  if (score < 75)  return "yellow";
  if (score < 90)  return "green";
  if (score < 95)  return "blue";
  return "gold";
}

export async function calculateDailyScore(
  supabase: SupabaseClient,
  dailyPlanId: string,
  playerId: string
): Promise<{ scorePercent: number; avatarColor: AvatarColor; pointsEarned: number; pointsPossible: number }> {
  // Fetch plan meta (for day_type multiplier + program_id)
  const { data: plan } = await supabase
    .schema("food_passport" as never)
    .from("daily_nutrition_plans")
    .select("day_type, program_id, date")
    .eq("id", dailyPlanId)
    .single();

  const dayType = (plan as { day_type: DayType } | null)?.day_type ?? "normal";
  const multiplier = DAY_MULTIPLIER[dayType];

  // Fetch prescribed meals
  const { data: meals } = await supabase
    .schema("food_passport" as never)
    .from("prescribed_meals")
    .select("*")
    .eq("daily_plan_id", dailyPlanId);

  // Fetch prescribed supplements
  const { data: supplements } = await supabase
    .schema("food_passport" as never)
    .from("prescribed_supplements")
    .select("*")
    .eq("daily_plan_id", dailyPlanId);

  // Fetch consumption
  const { data: consumption } = await supabase
    .schema("food_passport" as never)
    .from("meal_consumption")
    .select("*")
    .eq("daily_plan_id", dailyPlanId)
    .eq("player_id", playerId);

  const { data: suppConsumption } = await supabase
    .schema("food_passport" as never)
    .from("supplement_consumption")
    .select("*")
    .in("prescribed_supplement_id", (supplements ?? []).map((s: { id: string }) => s.id))
    .eq("player_id", playerId);

  let pointsEarned = 0;
  let pointsPossible = 0;

  // Score meals
  for (const meal of (meals ?? []) as Array<{
    service: string;
    vegetables_g: number; starch_g: number; protein_g: number; water_ml: number;
    points_vegetables: number; points_starch: number; points_protein: number; points_water: number;
  }>) {
    const actual = (consumption ?? []).find((c: { service: string }) => c.service === meal.service) as {
      vegetables_g_actual: number | null;
      starch_g_actual: number | null;
      protein_g_actual: number | null;
      water_ml_actual: number | null;
    } | undefined;

    const ratioVeg   = actual ? Math.min((actual.vegetables_g_actual ?? 0) / Math.max(meal.vegetables_g, 1), 1) : 0;
    const ratioStarch = actual ? Math.min((actual.starch_g_actual   ?? 0) / Math.max(meal.starch_g, 1),    1) : 0;
    const ratioProt  = actual ? Math.min((actual.protein_g_actual   ?? 0) / Math.max(meal.protein_g, 1),   1) : 0;
    const ratioWater = actual ? Math.min((actual.water_ml_actual    ?? 0) / Math.max(meal.water_ml, 1),    1) : 0;

    pointsEarned   += meal.points_vegetables * ratioVeg
                    + meal.points_starch * ratioStarch
                    + meal.points_protein * ratioProt
                    + meal.points_water * ratioWater;
    pointsPossible += meal.points_vegetables + meal.points_starch + meal.points_protein + meal.points_water;
  }

  // Score supplements
  for (const supp of (supplements ?? []) as Array<{ id: string; points: number }>) {
    const taken = (suppConsumption ?? []).find(
      (sc: { prescribed_supplement_id: string; taken: boolean }) => sc.prescribed_supplement_id === supp.id && sc.taken
    );
    pointsEarned   += taken ? supp.points : 0;
    pointsPossible += supp.points;
  }

  const rawScore  = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;
  const scorePercent = Math.min(rawScore * multiplier, 100);
  const avatarColor  = scoreToAvatarColor(scorePercent);

  // Persist score
  if (plan) {
    const p = plan as { program_id: string; date: string };
    await supabase
      .schema("food_passport" as never)
      .from("daily_scores")
      .upsert({
        player_id:      playerId,
        program_id:     p.program_id,
        date:           p.date,
        score_percent:  scorePercent,
        avatar_color:   avatarColor,
        points_earned:  Math.round(pointsEarned),
        points_possible: pointsPossible,
      }, { onConflict: "player_id,program_id,date" });
  }

  return { scorePercent, avatarColor, pointsEarned: Math.round(pointsEarned), pointsPossible };
}

// Expert nutrition recommendations by day type (per 70kg player, scale by weight)
export const EXPERT_RECOMMENDATIONS: Record<DayType, {
  protein_g_per_kg: number;
  carbs_g_per_kg: number;
  fat_g_per_kg: number;
  water_ml: number;
  fiber_g: number;
  notes: string;
}> = {
  "j-6":  { protein_g_per_kg: 2.2, carbs_g_per_kg: 5,   fat_g_per_kg: 1.2, water_ml: 3000, fiber_g: 25, notes: "Base haute protéines" },
  "j-5":  { protein_g_per_kg: 2.2, carbs_g_per_kg: 5,   fat_g_per_kg: 1.2, water_ml: 3000, fiber_g: 25, notes: "Base haute protéines" },
  "j-4":  { protein_g_per_kg: 1.8, carbs_g_per_kg: 6,   fat_g_per_kg: 1.0, water_ml: 3500, fiber_g: 22, notes: "Charge glucidique débute" },
  "j-3":  { protein_g_per_kg: 1.8, carbs_g_per_kg: 7,   fat_g_per_kg: 1.0, water_ml: 3500, fiber_g: 20, notes: "Charge glucidique modérée" },
  "j-2":  { protein_g_per_kg: 1.6, carbs_g_per_kg: 9,   fat_g_per_kg: 0.8, water_ml: 3500, fiber_g: 15, notes: "↑ glucides, ↓ fibres" },
  "j-1":  { protein_g_per_kg: 1.5, carbs_g_per_kg: 11,  fat_g_per_kg: 0.7, water_ml: 4000, fiber_g: 10, notes: "Super-compensation, veille match" },
  match:  { protein_g_per_kg: 1.5, carbs_g_per_kg: 8,   fat_g_per_kg: 0.6, water_ml: 4000, fiber_g: 10, notes: "Pré/per/post-match" },
  "j+1":  { protein_g_per_kg: 2.5, carbs_g_per_kg: 6,   fat_g_per_kg: 1.2, water_ml: 3500, fiber_g: 25, notes: "Récupération, anti-inflammatoire" },
  "j+2":  { protein_g_per_kg: 2.0, carbs_g_per_kg: 5,   fat_g_per_kg: 1.2, water_ml: 3000, fiber_g: 25, notes: "Retour normale" },
  normal: { protein_g_per_kg: 1.8, carbs_g_per_kg: 5,   fat_g_per_kg: 1.2, water_ml: 3000, fiber_g: 25, notes: "Jour normal" },
};

export function computeDayType(date: string, matchDate: string | null): DayType {
  if (!matchDate) return "normal";
  const d = new Date(date + "T12:00:00");
  const m = new Date(matchDate + "T12:00:00");
  const diffDays = Math.round((d.getTime() - m.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)  return "match";
  if (diffDays === 1)  return "j+1";
  if (diffDays === 2)  return "j+2";
  if (diffDays === -1) return "j-1";
  if (diffDays === -2) return "j-2";
  if (diffDays === -3) return "j-3";
  if (diffDays === -4) return "j-4";
  if (diffDays === -5) return "j-5";
  if (diffDays === -6) return "j-6";
  return "normal";
}

// ── Hydration score helpers ────────────────────────────────────────────────

export function calculateHydrationScore(
  totalMl: number,
  targetMl: number,
  urineColor: number | null,
  dayType: string
): { points: number; maxPoints: number; flags: string[] } {
  const maxPoints = dayType === 'match' || dayType === 'j-1' ? 10 : 5;
  const flags: string[] = [];

  const ratio = targetMl > 0 ? Math.min(totalMl / targetMl, 1) : 0;
  let points = Math.round(ratio * maxPoints);

  if (urineColor !== null && urineColor >= 6) {
    points = Math.max(0, points - 3);
    flags.push('dehydrated');
  }
  if (urineColor !== null && urineColor >= 7) {
    flags.push('alert_nutri');
  }
  // Malus spécifique J-1/match si St Yorre non consommée
  // (appelé depuis le composant avec st_yorre_ml vs target)

  return { points, maxPoints, flags };
}

export function hydrationScoreToAvatarBonus(flags: string[]): boolean {
  // Bloque le score gold si déshydratation détectée
  return flags.includes('dehydrated');
}
