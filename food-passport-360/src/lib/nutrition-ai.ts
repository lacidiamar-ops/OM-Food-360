import Anthropic from "@anthropic-ai/sdk";
import type { DayType, TrainingLoadEntry } from "@/lib/supabase/food-passport.types";
import { EXPERT_RECOMMENDATIONS, computeDayType } from "@/lib/nutrition-score";

const client = new Anthropic();

interface PlayerParams {
  weight_kg: number;
  position: string;
  age?: number;
  dietary_restrictions?: string;
  health_notes?: string;
}

interface ProgramParams {
  player: PlayerParams;
  matchDate: string;
  startDate: string;
  endDate: string;
  trainingLoad: TrainingLoadEntry[];
  programName: string;
}

export interface AIDailyPlan {
  date: string;
  day_type: DayType;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  target_water_ml: number;
  target_fiber_g: number;
  nutri_message: string;
  supplements: Array<{
    meal_service: string;
    brand: string;
    product_name: string;
    product_type: string;
    quantity_g?: number;
    quantity_ml?: number;
    water_ml?: number;
    timing_note: string;
    points: number;
  }>;
}

export async function generateNutriProgram(params: ProgramParams): Promise<AIDailyPlan[]> {
  // Build date range
  const dates: string[] = [];
  const d = new Date(params.startDate + "T12:00:00");
  const end = new Date(params.endDate + "T12:00:00");
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }

  // Pre-compute day types and base recommendations
  const dayPlans = dates.map((date) => {
    const dayType = computeDayType(date, params.matchDate);
    const rec = EXPERT_RECOMMENDATIONS[dayType];
    const w = params.player.weight_kg;
    const load = params.trainingLoad.find((t) => t.date === date)?.load ?? "normal";
    return {
      date,
      day_type: dayType,
      load,
      base_protein_g: Math.round(rec.protein_g_per_kg * w),
      base_carbs_g: Math.round(rec.carbs_g_per_kg * w),
      base_fat_g: Math.round(rec.fat_g_per_kg * w),
      water_ml: rec.water_ml,
      fiber_g: rec.fiber_g,
      notes: rec.notes,
    };
  });

  const prompt = `Tu es expert en nutrition sportive football haut niveau (Olympique de Marseille).
Tu travailles avec les compléments : Nutrition X, Apurna, SiSLab, PowerBar, Beet It.

PROFIL JOUEUR :
- Poids : ${params.player.weight_kg}kg
- Poste : ${params.player.position}
- Restrictions alimentaires : ${params.player.dietary_restrictions ?? "aucune"}
- Notes médicales : ${params.player.health_notes ?? "aucune"}

PROGRAMME : ${params.programName}
Date du match cible : ${params.matchDate}

PLANNING PAR JOUR :
${dayPlans.map(d => `- ${d.date} (${d.day_type}, charge: ${d.load}): P=${d.base_protein_g}g C=${d.base_carbs_g}g L=${d.base_fat_g}g Eau=${d.water_ml}ml`).join('\n')}

Génère un programme de périodisation nutritionnelle précis et scientifique.
Pour chaque jour, génère :
1. Les macros finaux ajustés (peut légèrement différer des bases selon le contexte)
2. Les calories (4×P + 4×C + 9×L)
3. Un message motivant pour le joueur (max 2 phrases, adapté au jour J)
4. 2-3 suppléments pertinents selon le jour (avec marque, produit, timing précis)

Réponds UNIQUEMENT en JSON valide, tableau d'objets avec ces champs :
{
  "date": "YYYY-MM-DD",
  "day_type": "...",
  "target_calories": 0,
  "target_protein_g": 0,
  "target_carbs_g": 0,
  "target_fat_g": 0,
  "target_water_ml": 0,
  "target_fiber_g": 0,
  "nutri_message": "...",
  "supplements": [
    {
      "meal_service": "breakfast|pre_match|post_match|snack_am|snack_pm|dinner|any",
      "brand": "nutrition_x|apurna|sislab|powerbar|beet_it|other",
      "product_name": "...",
      "product_type": "protein_shake|gel|bar|recovery_drink|isotonic|beetroot_shot|bcaa|omega3|vitamin|other",
      "quantity_g": null,
      "quantity_ml": null,
      "water_ml": 0,
      "timing_note": "...",
      "points": 2
    }
  ]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: "Tu es un expert nutrition sportive football haut niveau. Réponds uniquement en JSON valide, sans markdown, sans explication.",
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    return JSON.parse(text) as AIDailyPlan[];
  } catch {
    // Fallback: return base recommendations without AI supplements
    return dayPlans.map((d) => ({
      date: d.date,
      day_type: d.day_type,
      target_calories: Math.round(d.base_protein_g * 4 + d.base_carbs_g * 4 + d.base_fat_g * 9),
      target_protein_g: d.base_protein_g,
      target_carbs_g: d.base_carbs_g,
      target_fat_g: d.base_fat_g,
      target_water_ml: d.water_ml,
      target_fiber_g: d.fiber_g,
      nutri_message: d.notes,
      supplements: [],
    }));
  }
}
