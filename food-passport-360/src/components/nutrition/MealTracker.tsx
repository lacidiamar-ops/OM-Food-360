"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FPPrescribedMeal, FPMealConsumption } from "@/lib/supabase/food-passport.types";

interface Props {
  meal: FPPrescribedMeal;
  consumption: FPMealConsumption | null;
  priority: number;
  onUpdate: (service: string, field: string, value: number) => void;
}

type MealField = "vegetables_g_actual" | "starch_g_actual" | "protein_g_actual" | "water_ml_actual";

interface MealRow {
  field: MealField;
  targetField: "vegetables_g" | "starch_g" | "protein_g" | "water_ml";
  labelKey: "vegetables" | "starch" | "proteins" | "water";
  unit: "g" | "ml";
  step: number;
}

const MEAL_ROWS: MealRow[] = [
  { field: "vegetables_g_actual", targetField: "vegetables_g", labelKey: "vegetables", unit: "g",  step: 25 },
  { field: "starch_g_actual",     targetField: "starch_g",     labelKey: "starch",      unit: "g",  step: 25 },
  { field: "protein_g_actual",    targetField: "protein_g",    labelKey: "proteins",    unit: "g",  step: 25 },
  { field: "water_ml_actual",     targetField: "water_ml",     labelKey: "water",       unit: "ml", step: 100 },
];

function progressColor(percent: number): string {
  if (percent < 40) return "var(--danger)";
  if (percent < 75) return "var(--warning)";
  return "var(--color-active)";
}

function progressBgOpacity(percent: number): string {
  if (percent < 40) return "rgba(255,77,106,0.25)";
  if (percent < 75) return "rgba(255,215,0,0.25)";
  return "rgba(77,255,180,0.25)";
}

const SERVICE_LABELS: Record<string, string> = {
  breakfast:  "🌅 Petit-déjeuner",
  snack_am:   "🍌 Collation matin",
  lunch:      "🍽️ Déjeuner",
  snack_pm:   "🍊 Collation après-midi",
  dinner:     "🌙 Dîner",
  pre_match:  "⚽ Avant-match",
  post_match: "🔄 Récupération",
};

export default function MealTracker({ meal, consumption, priority, onUpdate }: Props) {
  const t = useTranslations("nutrition");
  const [open, setOpen] = useState(priority <= 2);

  // Local state mirrors consumption for instant feedback
  const [localValues, setLocalValues] = useState<Record<MealField, number>>({
    vegetables_g_actual: consumption?.vegetables_g_actual ?? 0,
    starch_g_actual:     consumption?.starch_g_actual     ?? 0,
    protein_g_actual:    consumption?.protein_g_actual    ?? 0,
    water_ml_actual:     consumption?.water_ml_actual     ?? 0,
  });

  function adjust(field: MealField, targetVal: number, step: number, delta: 1 | -1) {
    const next = Math.min(
      Math.max(0, (localValues[field] ?? 0) + delta * step),
      targetVal * 2 // allow slight over-consumption
    );
    setLocalValues(prev => ({ ...prev, [field]: next }));
    onUpdate(meal.service, field, next);
  }

  // Total points this meal can earn (rough estimate proportional to consumption)
  const totalPointsPossible =
    meal.points_vegetables + meal.points_starch + meal.points_protein + meal.points_water;

  let pointsEarned = 0;
  for (const row of MEAL_ROWS) {
    const actual = localValues[row.field];
    const target = meal[row.targetField];
    const ratio = target > 0 ? Math.min(actual / target, 1) : 0;
    const pointField = {
      vegetables_g_actual: meal.points_vegetables,
      starch_g_actual:     meal.points_starch,
      protein_g_actual:    meal.points_protein,
      water_ml_actual:     meal.points_water,
    }[row.field];
    pointsEarned += (pointField ?? 0) * ratio;
  }

  return (
    <div
      style={{
        background:   "rgba(255,255,255,0.03)",
        border:       "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        overflow:     "hidden",
      }}
    >
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate" style={{ fontSize: 15 }}>
            {SERVICE_LABELS[meal.service] ?? meal.service}
          </span>
          {priority === 1 && (
            <span
              className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                color:      "var(--warning)",
                background: "rgba(255,215,0,0.10)",
                border:     "0.5px solid rgba(255,215,0,0.20)",
              }}
            >
              {t("priorityBadge", { n: priority })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-active)" }}
          >
            {t("pointsEarned", { points: Math.round(pointsEarned) })}
          </span>
          {open
            ? <ChevronUp size={16} style={{ color: "var(--muted-foreground)" }} />
            : <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
          }
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-4 pt-1">
              {MEAL_ROWS.map(row => {
                const actual = localValues[row.field];
                const target = meal[row.targetField];
                const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
                const barColor = progressColor(percent);
                const barBg = progressBgOpacity(percent);

                return (
                  <div key={row.field} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                        {t(row.labelKey)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--foreground)", fontVariantNumeric: "tabular-nums" }}>
                        {actual}&thinsp;/&thinsp;{target}{row.unit}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="w-full rounded-full overflow-hidden"
                      style={{ height: 6, background: "rgba(255,255,255,0.07)" }}
                    >
                      <motion.div
                        style={{
                          height: "100%",
                          borderRadius: 999,
                          background: barBg,
                          boxShadow: percent >= 75 ? `0 0 8px ${barColor}40` : undefined,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percent, 100)}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>

                    {/* +/- buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 active:scale-95"
                        style={{
                          width: 32, height: 32,
                          background: "rgba(255,255,255,0.07)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          color: "var(--foreground)",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                        onClick={() => adjust(row.field, target, row.step, -1)}
                        disabled={actual <= 0}
                      >
                        −
                      </button>
                      <div
                        className="flex-1 text-center text-xs font-mono"
                        style={{ color: barColor }}
                      >
                        {percent}%
                      </div>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70 active:scale-95"
                        style={{
                          width: 32, height: 32,
                          background: "rgba(255,255,255,0.07)",
                          border: "0.5px solid rgba(255,255,255,0.12)",
                          color: "var(--foreground)",
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                        onClick={() => adjust(row.field, target, row.step, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Points row */}
              <div
                className="flex items-center justify-end pt-1"
                style={{
                  borderTop: "0.5px solid rgba(255,255,255,0.07)",
                  marginTop: 4,
                }}
              >
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    color: "var(--color-active)",
                    background: "rgba(77,255,180,0.08)",
                    border: "0.5px solid rgba(77,255,180,0.20)",
                  }}
                >
                  {Math.round(pointsEarned)}&thinsp;/&thinsp;{totalPointsPossible} pts
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
