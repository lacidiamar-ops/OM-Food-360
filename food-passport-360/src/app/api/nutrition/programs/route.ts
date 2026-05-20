import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeDayType } from "@/lib/nutrition-score";
import type {
  TrainingLoadEntry,
  MealService2,
} from "@/lib/supabase/food-passport.types";
import type { AIDailyPlan } from "@/lib/nutrition-ai";

// Default portion sizes per day type per meal service (grams / ml)
const DEFAULT_PORTIONS: Record<string, Record<MealService2, { veg: number; starch: number; prot: number; water: number }>> = {
  default: {
    breakfast:  { veg: 0,   starch: 80,  prot: 30,  water: 500 },
    snack_am:   { veg: 0,   starch: 40,  prot: 20,  water: 300 },
    lunch:      { veg: 200, starch: 120, prot: 150, water: 500 },
    snack_pm:   { veg: 0,   starch: 40,  prot: 20,  water: 300 },
    dinner:     { veg: 180, starch: 100, prot: 130, water: 500 },
    pre_match:  { veg: 0,   starch: 100, prot: 50,  water: 500 },
    post_match: { veg: 100, starch: 80,  prot: 40,  water: 600 },
  },
  match: {
    breakfast:  { veg: 0,   starch: 80,  prot: 25,  water: 500 },
    snack_am:   { veg: 0,   starch: 50,  prot: 20,  water: 300 },
    lunch:      { veg: 150, starch: 80,  prot: 100, water: 400 },
    snack_pm:   { veg: 0,   starch: 30,  prot: 10,  water: 300 },
    dinner:     { veg: 200, starch: 80,  prot: 150, water: 500 },
    pre_match:  { veg: 0,   starch: 120, prot: 60,  water: 600 },
    post_match: { veg: 120, starch: 100, prot: 50,  water: 700 },
  },
};

const MEAL_SERVICES: MealService2[] = [
  "breakfast",
  "snack_am",
  "lunch",
  "snack_pm",
  "dinner",
];

interface RequestBody {
  name:          string;
  type:          "individual" | "collective";
  player_ids:    string[];
  match_date:    string | null;
  start_date:    string;
  end_date:      string;
  training_load: TrainingLoadEntry[];
  daily_plans:   AIDailyPlan[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: RequestBody = await request.json();

  const {
    name,
    type,
    player_ids,
    match_date,
    start_date,
    end_date,
    training_load,
    daily_plans,
  } = body;

  // 1. Insert nutrition_program
  const { data: program, error: progError } = await supabase
    .schema("food_passport" as never)
    .from("nutrition_programs")
    .insert({
      name,
      type,
      player_ids,
      match_date:    match_date ?? null,
      start_date,
      end_date,
      training_load: training_load ?? [],
      status:        "draft",
      created_by:    user.id,
    })
    .select("id")
    .single();

  if (progError || !program) {
    return NextResponse.json({ error: progError?.message ?? "Insert failed" }, { status: 500 });
  }

  const programId = (program as { id: string }).id;

  // 2. For each player × each day: insert daily_nutrition_plan + meals + supplements
  for (const playerId of player_ids) {
    for (const aiPlan of daily_plans) {
      const dayType = computeDayType(aiPlan.date, match_date);

      const { data: planRow, error: planError } = await supabase
        .schema("food_passport" as never)
        .from("daily_nutrition_plans")
        .insert({
          program_id:       programId,
          player_id:        playerId,
          date:             aiPlan.date,
          day_type:         dayType,
          target_calories:  aiPlan.target_calories ?? null,
          target_protein_g: aiPlan.target_protein_g ?? null,
          target_carbs_g:   aiPlan.target_carbs_g ?? null,
          target_fat_g:     aiPlan.target_fat_g ?? null,
          target_water_ml:  aiPlan.target_water_ml ?? null,
          target_fiber_g:   aiPlan.target_fiber_g ?? null,
          meal_priorities:  {},
          nutri_message:    aiPlan.nutri_message ?? null,
          nutri_message_lang: "fr",
        })
        .select("id")
        .single();

      if (planError || !planRow) continue;

      const planId = (planRow as { id: string }).id;

      // 3. Insert 5 base prescribed_meals
      const portionKey = dayType === "match" ? "match" : "default";
      const portionsMap = DEFAULT_PORTIONS[portionKey];

      const mealsInsert = MEAL_SERVICES.map((service, idx) => {
        const portions = portionsMap[service];
        return {
          daily_plan_id:      planId,
          service,
          vegetables_g:       portions.veg,
          starch_g:           portions.starch,
          protein_g:          portions.prot,
          water_ml:           portions.water,
          points_vegetables:  2,
          points_starch:      2,
          points_protein:     2,
          points_water:       2,
          points_supplements: 0,
          sort_order:         idx,
          notes:              null,
        };
      });

      await supabase
        .schema("food_passport" as never)
        .from("prescribed_meals")
        .insert(mealsInsert);

      // 4. Insert supplements from AI plan
      if (aiPlan.supplements && aiPlan.supplements.length > 0) {
        const suppInsert = aiPlan.supplements.map((s, idx) => ({
          daily_plan_id:                 planId,
          meal_service:                  s.meal_service as MealService2 | "any",
          brand:                         s.brand,
          brand_other:                   null,
          product_name:                  s.product_name,
          product_type:                  s.product_type,
          quantity_g:                    s.quantity_g ?? null,
          quantity_ml:                   s.quantity_ml ?? null,
          quantity_units:                null,
          water_ml:                      s.water_ml ?? 0,
          timing_minutes_before_effort:  null,
          timing_minutes_after_effort:   null,
          timing_note:                   s.timing_note,
          points:                        s.points ?? 2,
          sort_order:                    idx,
        }));

        await supabase
          .schema("food_passport" as never)
          .from("prescribed_supplements")
          .insert(suppInsert);
      }
    }
  }

  return NextResponse.json({ programId });
}
