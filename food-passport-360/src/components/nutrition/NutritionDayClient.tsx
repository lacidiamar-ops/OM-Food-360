"use client";

import { useState, useCallback, useMemo } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import ProfileHero from "@/components/ui/ProfileHero";
import AvatarEvolution from "@/components/nutrition/AvatarEvolution";
import MealTracker from "@/components/nutrition/MealTracker";
import HydrationTracker from "@/components/nutrition/HydrationTracker";
import SupplementTracker from "@/components/nutrition/SupplementTracker";
import DailyScoreBar from "@/components/nutrition/DailyScoreBar";
import NutriMessageCard from "@/components/nutrition/NutriMessageCard";
import { scoreToAvatarColor } from "@/lib/nutrition-score";
import type {
  FPDailyPlanFull,
  FPMealConsumption,
  FPSupplementConsumption,
  AvatarColor,
} from "@/lib/supabase/food-passport.types";

interface Props {
  plan: FPDailyPlanFull;
  currentUserId: string;
  playerInitials: string;
  playerLang: string;
  nutriName: string;
}

// ── Local score computation (synchronous, mirrors nutrition-score.ts logic) ──
function computeLocalScore(
  meals: FPDailyPlanFull["meals"],
  consumption: FPMealConsumption[],
  supplements: FPDailyPlanFull["supplements"],
  suppConsumption: FPSupplementConsumption[],
  dayType: FPDailyPlanFull["day_type"]
): { percent: number; earned: number; possible: number } {
  const DAY_MULTIPLIER: Record<string, number> = {
    "j-6": 1.0, "j-5": 1.0, "j-4": 1.1, "j-3": 1.1,
    "j-2": 1.2, "j-1": 1.5, match: 2.0, "j+1": 1.1, "j+2": 1.0, normal: 1.0,
  };
  const multiplier = DAY_MULTIPLIER[dayType] ?? 1.0;

  let earned = 0;
  let possible = 0;

  for (const meal of meals) {
    const actual = consumption.find(c => c.service === meal.service);
    const ratioVeg   = actual ? Math.min((actual.vegetables_g_actual ?? 0) / Math.max(meal.vegetables_g, 1), 1) : 0;
    const ratioStarch = actual ? Math.min((actual.starch_g_actual    ?? 0) / Math.max(meal.starch_g, 1), 1)    : 0;
    const ratioProt  = actual ? Math.min((actual.protein_g_actual    ?? 0) / Math.max(meal.protein_g, 1), 1)   : 0;
    const ratioWater = actual ? Math.min((actual.water_ml_actual     ?? 0) / Math.max(meal.water_ml, 1), 1)    : 0;
    earned   += meal.points_vegetables * ratioVeg + meal.points_starch * ratioStarch
              + meal.points_protein * ratioProt    + meal.points_water * ratioWater;
    possible += meal.points_vegetables + meal.points_starch + meal.points_protein + meal.points_water;
  }

  for (const supp of supplements) {
    const taken = suppConsumption.find(sc => sc.prescribed_supplement_id === supp.id && sc.taken);
    earned   += taken ? supp.points : 0;
    possible += supp.points;
  }

  const raw = possible > 0 ? (earned / possible) * 100 : 0;
  const percent = Math.min(raw * multiplier, 100);
  return { percent, earned: Math.round(earned), possible };
}

export default function NutritionDayClient({
  plan,
  currentUserId,
  playerInitials,
  playerLang,
  nutriName,
}: Props) {
  const t = useTranslations("nutrition");
  const locale = useLocale();

  // ── State ──────────────────────────────────────────────
  const [consumption, setConsumption] = useState<FPMealConsumption[]>(plan.consumption);
  const [suppConsumption, setSuppConsumption] = useState<FPSupplementConsumption[]>(
    plan.supplement_consumption
  );

  // ── Real-time score ────────────────────────────────────
  const { percent: scorePercent, earned: pointsEarned, possible: pointsPossible } = useMemo(
    () => computeLocalScore(plan.meals, consumption, plan.supplements, suppConsumption, plan.day_type),
    [plan.meals, consumption, plan.supplements, suppConsumption, plan.day_type]
  );
  const avatarColor: AvatarColor = scoreToAvatarColor(scorePercent);

  // ── Streak from persisted score (or 0) ────────────────
  const streakDays = plan.score?.streak_days ?? 0;

  // ── Handlers ──────────────────────────────────────────
  const handleMealUpdate = useCallback(
    (service: string, field: string, value: number) => {
      setConsumption(prev => {
        const existing = prev.find(c => c.service === service);
        if (existing) {
          return prev.map(c =>
            c.service === service ? { ...c, [field]: value } : c
          );
        }
        // Create optimistic new entry
        return [
          ...prev,
          {
            id:                  `optimistic-${service}`,
            daily_plan_id:       plan.id,
            player_id:           currentUserId,
            service,
            vegetables_g_actual: null,
            starch_g_actual:     null,
            protein_g_actual:    null,
            water_ml_actual:     null,
            consumed_at:         new Date().toISOString(),
            [field]:             value,
          } as FPMealConsumption,
        ];
      });

      // Fire-and-forget API call
      fetch("/api/nutrition/consumption", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          dailyPlanId: plan.id,
          playerId:    currentUserId,
          service,
          [field]:     value,
        }),
      }).catch(() => {
        // Silently fail — local state already updated
      });
    },
    [plan.id, currentUserId]
  );

  const handleSupplementToggle = useCallback(
    (supplementId: string, taken: boolean) => {
      setSuppConsumption(prev => {
        const existing = prev.find(sc => sc.prescribed_supplement_id === supplementId);
        if (existing) {
          return prev.map(sc =>
            sc.prescribed_supplement_id === supplementId
              ? { ...sc, taken, taken_at: taken ? new Date().toISOString() : null }
              : sc
          );
        }
        return [
          ...prev,
          {
            id:                     `optimistic-${supplementId}`,
            prescribed_supplement_id: supplementId,
            player_id:              currentUserId,
            taken,
            taken_at:               taken ? new Date().toISOString() : null,
            notes:                  null,
          } as FPSupplementConsumption,
        ];
      });

      fetch("/api/nutrition/supplement-consumption", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prescribedSupplementId: supplementId, playerId: currentUserId, taken }),
      }).catch(() => {});
    },
    [currentUserId]
  );

  // ── Sorted meals ───────────────────────────────────────
  const sortedMeals = [...plan.meals].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // ── Meal priority map from plan ────────────────────────
  const mealPriorities: Record<string, number> = plan.meal_priorities ?? {};

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Profile hero */}
      <ProfileHero />

      {/* Scrollable content */}
      <div className="flex-1 px-4 pt-4 pb-32 space-y-4">

        {/* Nutri message */}
        {plan.nutri_message && (
          <NutriMessageCard
            message={plan.nutri_message}
            fromLang={plan.nutri_message_lang ?? "fr"}
            userLang={playerLang || locale}
            timestamp={plan.created_at}
            nutriName={nutriName}
          />
        )}

        {/* Avatar + score */}
        <div
          className="flex flex-col items-center py-6"
          style={{
            background:   "rgba(255,255,255,0.03)",
            border:       "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}
        >
          <AvatarEvolution
            scorePercent={scorePercent}
            avatarColor={avatarColor}
            streakDays={streakDays}
            dayType={plan.day_type}
            playerInitials={playerInitials}
          />
        </div>

        {/* Meals */}
        {sortedMeals.map(meal => {
          const consumed = consumption.find(c => c.service === meal.service) ?? null;
          const priority = mealPriorities[meal.service] ?? 99;
          return (
            <MealTracker
              key={meal.id}
              meal={meal}
              consumption={consumed}
              priority={priority}
              onUpdate={handleMealUpdate}
            />
          );
        })}

        {/* Hydration */}
        <HydrationTracker
          playerId={currentUserId}
          date={plan.date}
          dayType={plan.day_type}
          targetFlatMl={plan.water_ml_flat ?? 2500}
          targetStYorreMl={plan.water_ml_st_yorre ?? 0}
          targetIsotonicMl={plan.water_ml_isotonic ?? 0}
        />

        {/* Supplements */}
        {plan.supplements.length > 0 && (
          <section className="space-y-2">
            <h3
              className="font-semibold px-1"
              style={{ fontSize: 14, color: "var(--muted-foreground)", letterSpacing: "0.5px", textTransform: "uppercase" }}
            >
              {t("supplementsTitle")}
            </h3>
            {[...plan.supplements]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(supp => {
                const sc = suppConsumption.find(
                  c => c.prescribed_supplement_id === supp.id
                ) ?? null;
                return (
                  <SupplementTracker
                    key={supp.id}
                    supplement={supp}
                    consumption={sc}
                    onToggle={handleSupplementToggle}
                  />
                );
              })}
          </section>
        )}
      </div>

      {/* Sticky score bar */}
      <DailyScoreBar
        scorePercent={scorePercent}
        pointsEarned={pointsEarned}
        pointsPossible={pointsPossible}
        avatarColor={avatarColor}
      />
    </div>
  );
}
