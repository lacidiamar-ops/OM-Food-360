"use client";

import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Activity } from "lucide-react";
import AvatarEvolution from "./AvatarEvolution";
import type { FPNutritionTracking, FPNutritionTrackingInsert, TrackingStatus } from "@/lib/supabase/food-passport.types";

interface Props {
  playerId: string;
  nutriId: string;
  playerName: string;
  existing?: FPNutritionTracking | null;
  onSave: (data: FPNutritionTrackingInsert & { id?: string }) => Promise<{ error?: string }>;
}

const nullableNumber = (min: number, max: number, int = false) => {
  let base = z.number().min(min).max(max);
  if (int) base = base.int();
  return z.union([base, z.null()]);
};

const schema = z.object({
  weight_kg: nullableNumber(30, 200),
  hydration: nullableNumber(0, 10, true),
  sleep_hours: nullableNumber(0, 24),
  fatigue: nullableNumber(0, 10, true),
  breakfast_quality: nullableNumber(0, 10, true),
  lunch_quality: nullableNumber(0, 10, true),
  dinner_quality: nullableNumber(0, 10, true),
  proteins_g: nullableNumber(0, 1000),
  carbs_g: nullableNumber(0, 2000),
  lipids_g: nullableNumber(0, 500),
  calories: nullableNumber(0, 10000, true),
  nutri_comment: z.string().max(2000).nullable().optional(),
  status: z.enum(["valide", "a_surveiller", "alerte"] as const),
});

type FormValues = {
  weight_kg: number | null;
  hydration: number | null;
  sleep_hours: number | null;
  fatigue: number | null;
  breakfast_quality: number | null;
  lunch_quality: number | null;
  dinner_quality: number | null;
  proteins_g: number | null;
  carbs_g: number | null;
  lipids_g: number | null;
  calories: number | null;
  nutri_comment?: string | null;
  status: TrackingStatus;
};

function computeScoreClient(values: Partial<FormValues>): number | null {
  const { hydration, sleep_hours, breakfast_quality, lunch_quality, dinner_quality, fatigue } = values;
  if (
    hydration == null &&
    sleep_hours == null &&
    breakfast_quality == null &&
    lunch_quality == null &&
    dinner_quality == null
  ) {
    return null;
  }
  let score = 0;
  score += (hydration ?? 0) * 10;
  const sh = sleep_hours ?? 0;
  if (sh >= 8) score += 20;
  else if (sh >= 7) score += 15;
  else if (sh >= 6) score += 8;
  else if (sh >= 5) score += 4;
  score += (breakfast_quality ?? 0);
  score += (lunch_quality ?? 0);
  score += (dinner_quality ?? 0);
  score -= (fatigue ?? 0) * 2;
  return Math.min(100, Math.max(0, score));
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  unit,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground tabular-nums">
          {value != null ? `${value}${unit ?? ""}` : "—"}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full accent-primary cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

const STATUS_OPTIONS: { value: TrackingStatus; icon: React.ElementType; colorClass: string }[] = [
  { value: "valide", icon: CheckCircle, colorClass: "border-green-500 text-green-600 bg-green-500/10" },
  { value: "a_surveiller", icon: Activity, colorClass: "border-blue-500 text-blue-600 bg-blue-500/10" },
  { value: "alerte", icon: AlertTriangle, colorClass: "border-red-500 text-red-600 bg-red-500/10" },
];

export default function NutritionTrackingForm({ playerId, nutriId, playerName, existing, onSave }: Props) {
  const t = useTranslations("tracking");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultValues: FormValues = {
    weight_kg: existing?.weight_kg ?? null,
    hydration: existing?.hydration ?? null,
    sleep_hours: existing?.sleep_hours ?? null,
    fatigue: existing?.fatigue ?? null,
    breakfast_quality: existing?.breakfast_quality ?? null,
    lunch_quality: existing?.lunch_quality ?? null,
    dinner_quality: existing?.dinner_quality ?? null,
    proteins_g: existing?.proteins_g ?? null,
    carbs_g: existing?.carbs_g ?? null,
    lipids_g: existing?.lipids_g ?? null,
    calories: existing?.calories ?? null,
    nutri_comment: existing?.nutri_comment ?? null,
    status: existing?.status ?? "a_surveiller",
  };

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const watchedValues = watch();
  const liveScore = computeScoreClient(watchedValues);

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setSaving(true);
      setSaved(false);
      setServerError(null);
      try {
        const payload: FPNutritionTrackingInsert & { id?: string } = {
          ...values,
          player_id: playerId,
          nutri_id: nutriId,
          ...(existing?.id ? { id: existing.id } : {}),
        };
        const result = await onSave(payload);
        if (result?.error) {
          setServerError(result.error);
        } else {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      } finally {
        setSaving(false);
      }
    },
    [playerId, nutriId, existing, onSave]
  );

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Avatar + score preview */}
      <div className="flex items-center gap-6 rounded-2xl border border-border bg-card p-4">
        <AvatarEvolution score={liveScore} size="md" />
        <div className="flex-1">
          <p className="font-semibold">{playerName}</p>
          <p className="text-sm text-muted-foreground">{t("scoreNutrition")}</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">
            {liveScore != null ? liveScore : "—"}
            {liveScore != null && <span className="text-sm font-normal text-muted-foreground">/100</span>}
          </p>
        </div>
      </div>

      {/* Poids */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("sectionPhysique")}</h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("weight")}</label>
          <Controller
            name="weight_kg"
            control={control}
            render={({ field }) => (
              <input
                type="number"
                step="0.1"
                min="30"
                max="200"
                placeholder="Ex: 78.5"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          />
          {errors.weight_kg && (
            <p className="text-xs text-destructive">{errors.weight_kg.message as string}</p>
          )}
        </div>
      </section>

      {/* Bien-être */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("sectionWellbeing")}</h3>
        <Controller
          name="hydration"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("hydration")}
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={10}
            />
          )}
        />
        <Controller
          name="sleep_hours"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("sleep")}
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={12}
              step={0.5}
              unit="h"
            />
          )}
        />
        <Controller
          name="fatigue"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("fatigue")}
              value={field.value}
              onChange={field.onChange}
              min={0}
              max={10}
            />
          )}
        />
      </section>

      {/* Qualité repas */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("sectionMeals")}</h3>
        <Controller
          name="breakfast_quality"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("breakfastQuality")}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="lunch_quality"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("lunchQuality")}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="dinner_quality"
          control={control}
          render={({ field }) => (
            <SliderField
              label={t("dinnerQuality")}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </section>

      {/* Macronutriments */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("sectionMacros")}</h3>
        <div className="grid grid-cols-2 gap-3">
          {(["proteins_g", "carbs_g", "lipids_g", "calories"] as const).map((field) => (
            <div key={field} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t(field === "proteins_g" ? "proteins" : field === "carbs_g" ? "carbs" : field === "lipids_g" ? "lipids" : "calories")}
              </label>
              <Controller
                name={field}
                control={control}
                render={({ field: f }) => (
                  <input
                    type="number"
                    step={field === "calories" ? "1" : "0.1"}
                    min="0"
                    placeholder="—"
                    value={f.value ?? ""}
                    onChange={(e) => f.onChange(e.target.value === "" ? null : Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Statut */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("status")}</h3>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(({ value, icon: Icon, colorClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all ${
                    field.value === value
                      ? colorClass
                      : "border-border text-muted-foreground bg-background hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>
                    {value === "valide"
                      ? t("statusValide")
                      : value === "a_surveiller"
                      ? t("statusSurveiller")
                      : t("statusAlerte")}
                  </span>
                </button>
              ))}
            </div>
          )}
        />
      </section>

      {/* Commentaire nutritionniste */}
      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <label className="text-sm font-medium">{t("comment")}</label>
        <Controller
          name="nutri_comment"
          control={control}
          render={({ field }) => (
            <textarea
              rows={4}
              placeholder={t("commentPlaceholder")}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          )}
        />
      </section>

      {/* Erreur serveur */}
      {serverError && (
        <motion.p
          className="text-sm text-destructive"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {serverError}
        </motion.p>
      )}

      {/* Bouton soumettre */}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {saving ? t("saving") : saved ? t("saved") : t("save")}
      </button>
    </motion.form>
  );
}
