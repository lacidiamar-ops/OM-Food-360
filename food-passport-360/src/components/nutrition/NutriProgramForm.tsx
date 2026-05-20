"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Trash2, GripVertical, Loader2 } from "lucide-react";
import TrainingLoadCalendar from "@/components/nutrition/TrainingLoadCalendar";
import SupplementModal from "@/components/nutrition/SupplementModal";
import { computeDayType, EXPERT_RECOMMENDATIONS } from "@/lib/nutrition-score";
import type {
  TrainingLoadEntry,
  FPPrescribedSupplement,
  SupplementBrand,
} from "@/lib/supabase/food-passport.types";
import type { AIDailyPlan } from "@/lib/nutrition-ai";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Player {
  id:        string;
  full_name: string | null;
  position:  string | null;
  weight_kg?: number;
}

interface Props {
  players: Player[];
}

interface DayPlan {
  date:              string;
  day_type:          string;
  target_calories:   number | "";
  target_protein_g:  number | "";
  target_carbs_g:    number | "";
  target_fat_g:      number | "";
  target_water_ml:   number | "";
  target_fiber_g:    number | "";
  nutri_message:     string;
  supplements:       Partial<FPPrescribedSupplement>[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  if (!start || !end) return dates;
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  while (s <= e) {
    dates.push(s.toISOString().slice(0, 10));
    s.setDate(s.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(date + "T12:00:00")
  );
}

const BRAND_LABELS: Record<SupplementBrand, string> = {
  nutrition_x: "Nutrition X",
  apurna:      "Apurna",
  sislab:      "SiSLab",
  powerbar:    "PowerBar",
  beet_it:     "Beet It",
  other:       "Autre",
};

const BRAND_COLORS: Record<SupplementBrand, string> = {
  nutrition_x: "var(--color-active)",
  apurna:      "var(--color-energy)",
  sislab:      "var(--warning)",
  powerbar:    "var(--danger)",
  beet_it:     "rgba(220,50,80,1)",
  other:       "var(--muted-foreground)",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {labels.map((label, i) => {
        const active = i === step;
        const done   = i < step;
        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width:      "28px",
                height:     "28px",
                border:     `2px solid ${active ? "var(--color-active)" : done ? "rgba(77,255,180,0.4)" : "rgba(255,255,255,0.15)"}`,
                background: active
                  ? "rgba(77,255,180,0.12)"
                  : done
                    ? "rgba(77,255,180,0.07)"
                    : "rgba(255,255,255,0.04)",
                color:      active || done ? "var(--color-active)" : "var(--muted-foreground)",
                fontSize:   "12px",
                fontWeight: 700,
                opacity:    i > step ? 0.4 : 1,
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize:   "12px",
                fontWeight: active ? 600 : 400,
                color:      active ? "var(--color-active)" : "var(--muted-foreground)",
                opacity:    i > step ? 0.4 : 1,
              }}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <div
                className="flex-1"
                style={{
                  height:     "1px",
                  background: "rgba(255,255,255,0.1)",
                  width:      "24px",
                  minWidth:   "16px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GlassInput({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label:       string;
  value:       string | number;
  onChange:    (v: string) => void;
  type?:       string;
  placeholder?: string;
  required?:   boolean;
}) {
  return (
    <label className="block space-y-1">
      <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "var(--danger)" }}> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5"
        style={{
          background:   "rgba(255,255,255,0.05)",
          border:       "0.5px solid rgba(255,255,255,0.12)",
          borderRadius: "10px",
          fontSize:     "14px",
          color:        "var(--foreground)",
          outline:      "none",
        }}
      />
    </label>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function NutriProgramForm({ players }: Props) {
  const t      = useTranslations("nutrition");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "fr";

  // ── Step state ──
  const [step, setStep] = useState(0);

  // ── Step 1: Config ──
  const [name, setName]             = useState("");
  const [type, setType]             = useState<"individual" | "collective">("individual");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [matchDate, setMatchDate]   = useState("");
  const [trainingLoad, setTrainingLoad] = useState<TrainingLoadEntry[]>([]);
  const [playerSearch, setPlayerSearch] = useState("");

  // ── Step 2: Plans ──
  const [dailyPlans, setDailyPlans] = useState<DayPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // ── Step 3: Supplements ──
  const [suppModal, setSuppModal] = useState<{
    open:    boolean;
    dayDate: string | null;
    initial?: Partial<FPPrescribedSupplement>;
    editIdx: number | null;
  }>({ open: false, dayDate: null, initial: undefined, editIdx: null });
  const [expandedSuppDays, setExpandedSuppDays] = useState<Set<string>>(new Set());

  // ── Saving ──
  const [saving, setSaving] = useState(false);

  // ── Derived data ──
  const dates = buildDateRange(startDate, endDate);
  const effectiveMatchDate = matchDate || null;

  // ─── Step 1 helpers ──────────────────────────────────────────────────────

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const filteredPlayers = players.filter(
    (p) =>
      !playerSearch ||
      (p.full_name ?? "").toLowerCase().includes(playerSearch.toLowerCase())
  );

  // ─── Step 2 helpers ──────────────────────────────────────────────────────

  const datesKey = dates.join(",");

  const initializeDailyPlans = useCallback(() => {
    const dateList = buildDateRange(startDate, endDate);
    const plans: DayPlan[] = dateList.map((date) => {
      const existing = dailyPlans.find((d) => d.date === date);
      if (existing) return existing;
      const day_type = computeDayType(date, effectiveMatchDate);
      return {
        date,
        day_type,
        target_calories:  "",
        target_protein_g: "",
        target_carbs_g:   "",
        target_fat_g:     "",
        target_water_ml:  "",
        target_fiber_g:   "",
        nutri_message:    "",
        supplements:      [],
      };
    });
    setDailyPlans(plans);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesKey, effectiveMatchDate]);

  const handleGenerateAI = async () => {
    const firstPlayer = players.find((p) =>
      selectedPlayers.includes(p.id)
    );
    if (!firstPlayer || !startDate || !endDate) return;

    setIsGenerating(true);
    try {
      const resp = await fetch("/api/nutrition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: {
            weight_kg: firstPlayer.weight_kg ?? 75,
            position:  firstPlayer.position ?? "milieu",
          },
          matchDate:    matchDate || null,
          startDate,
          endDate,
          trainingLoad,
          programName:  name,
        }),
      });

      const aiPlans: AIDailyPlan[] = await resp.json();

      setDailyPlans(
        aiPlans.map((p) => ({
          date:              p.date,
          day_type:          p.day_type,
          target_calories:   p.target_calories,
          target_protein_g:  p.target_protein_g,
          target_carbs_g:    p.target_carbs_g,
          target_fat_g:      p.target_fat_g,
          target_water_ml:   p.target_water_ml,
          target_fiber_g:    p.target_fiber_g,
          nutri_message:     p.nutri_message,
          supplements:       p.supplements.map((s) => ({
            brand:          s.brand as SupplementBrand,
            product_name:   s.product_name,
            product_type:   s.product_type as FPPrescribedSupplement["product_type"],
            quantity_g:     s.quantity_g ?? null,
            quantity_ml:    s.quantity_ml ?? null,
            water_ml:       s.water_ml ?? 0,
            timing_note:    s.timing_note,
            points:         s.points,
            sort_order:     0,
          })),
        }))
      );
    } catch {
      // silently fall through
    } finally {
      setIsGenerating(false);
    }
  };

  const applyExpertRec = (date: string, playerWeightKg = 75) => {
    const day_type = computeDayType(date, effectiveMatchDate);
    const rec = EXPERT_RECOMMENDATIONS[day_type as keyof typeof EXPERT_RECOMMENDATIONS];
    setDailyPlans((prev) =>
      prev.map((p) =>
        p.date !== date
          ? p
          : {
              ...p,
              target_protein_g: Math.round(rec.protein_g_per_kg * playerWeightKg),
              target_carbs_g:   Math.round(rec.carbs_g_per_kg   * playerWeightKg),
              target_fat_g:     Math.round(rec.fat_g_per_kg     * playerWeightKg),
              target_water_ml:  rec.water_ml,
              target_fiber_g:   rec.fiber_g,
              target_calories:  Math.round(
                rec.protein_g_per_kg * playerWeightKg * 4 +
                rec.carbs_g_per_kg   * playerWeightKg * 4 +
                rec.fat_g_per_kg     * playerWeightKg * 9
              ),
            }
      )
    );
  };

  const updateDayPlan = (date: string, field: keyof DayPlan, value: string | number) => {
    setDailyPlans((prev) =>
      prev.map((p) => (p.date !== date ? p : { ...p, [field]: value }))
    );
  };

  const toggleExpandDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) { next.delete(date); } else { next.add(date); }
      return next;
    });
  };

  // ─── Step 3 helpers ──────────────────────────────────────────────────────

  const addSupplement = (dayDate: string, supp: Partial<FPPrescribedSupplement>) => {
    setDailyPlans((prev) =>
      prev.map((p) =>
        p.date !== dayDate
          ? p
          : { ...p, supplements: [...p.supplements, { ...supp, sort_order: p.supplements.length }] }
      )
    );
  };

  const removeSupplement = (dayDate: string, idx: number) => {
    setDailyPlans((prev) =>
      prev.map((p) =>
        p.date !== dayDate
          ? p
          : { ...p, supplements: p.supplements.filter((_, i) => i !== idx) }
      )
    );
  };

  const toggleSuppDay = (date: string) => {
    setExpandedSuppDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) { next.delete(date); } else { next.add(date); }
      return next;
    });
  };

  // ─── Validation between steps ─────────────────────────────────────────────

  const canGoNext = (): boolean => {
    if (step === 0) {
      if (!name.trim()) return false;
      if (!startDate || !endDate) return false;
      if (new Date(endDate) < new Date(startDate)) return false;
      if (selectedPlayers.length === 0) return false;
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (step === 0) {
      initializeDailyPlans();
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch("/api/nutrition/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          player_ids:    selectedPlayers,
          match_date:    matchDate || null,
          start_date:    startDate,
          end_date:      endDate,
          training_load: trainingLoad,
          daily_plans:   dailyPlans,
        }),
      });

      if (!resp.ok) throw new Error("Save failed");
      const { programId } = await resp.json() as { programId: string };
      router.push(`/${locale}/nutri/programs/${programId}`);
    } catch {
      // silently fail — would add a toast in production
    } finally {
      setSaving(false);
    }
  };

  // ─── Glass style util ─────────────────────────────────────────────────────

  const glass: React.CSSProperties = {
    background:   "rgba(255,255,255,0.03)",
    border:       "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  };

  const stepLabels = [t("stepConfig"), t("stepPlan"), t("stepSupplements")];

  // ─── Render ───────────────────────────────────────────────────────────────

  const firstPlayerWeight = players.find((p) => selectedPlayers.includes(p.id))?.weight_kg;

  return (
    <div>
      <Stepper step={step} labels={stepLabels} />

      {/* ── STEP 1: CONFIG ────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <div style={{ ...glass, padding: "20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
              {t("stepConfig")}
            </h3>

            <div className="space-y-4">
              {/* Program name */}
              <GlassInput
                label={t("programName")}
                value={name}
                onChange={setName}
                placeholder={t("programNamePlaceholder")}
                required
              />

              {/* Type pills */}
              <div>
                <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
                  {t("programType")}
                </p>
                <div className="flex gap-2">
                  {(["individual", "collective"] as const).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => { setType(pt); setSelectedPlayers([]); }}
                      style={{
                        padding:      "7px 16px",
                        borderRadius: "10px",
                        fontSize:     "13px",
                        fontWeight:   600,
                        cursor:       "pointer",
                        background:
                          type === pt
                            ? pt === "individual"
                              ? "rgba(139,127,245,0.15)"
                              : "rgba(77,255,180,0.12)"
                            : "rgba(255,255,255,0.04)",
                        color:
                          type === pt
                            ? pt === "individual"
                              ? "var(--color-energy)"
                              : "var(--color-active)"
                            : "var(--muted-foreground)",
                        border:
                          type === pt
                            ? `1px solid ${pt === "individual" ? "rgba(139,127,245,0.35)" : "rgba(77,255,180,0.3)"}`
                            : "1px solid rgba(255,255,255,0.08)",
                        transition: "all 0.15s",
                      }}
                    >
                      {pt === "individual" ? t("typeIndividual") : t("typeCollective")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player selector */}
              <div>
                <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
                  {type === "individual" ? t("selectPlayer") : t("selectPlayers")}
                </p>

                {/* Search */}
                <input
                  type="text"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder={t("playerSearchPlaceholder")}
                  className="w-full px-3 py-2 mb-2"
                  style={{
                    background:   "rgba(255,255,255,0.05)",
                    border:       "0.5px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px",
                    fontSize:     "13px",
                    color:        "var(--foreground)",
                    outline:      "none",
                  }}
                />

                <div
                  className="space-y-1"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {filteredPlayers.map((p) => {
                    const selected = selectedPlayers.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (type === "individual") {
                            setSelectedPlayers([p.id]);
                          } else {
                            togglePlayer(p.id);
                          }
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-opacity hover:opacity-80"
                        style={{
                          background: selected
                            ? "rgba(77,255,180,0.08)"
                            : "rgba(255,255,255,0.03)",
                          border: selected
                            ? "0.5px solid rgba(77,255,180,0.25)"
                            : "0.5px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <span
                          style={{
                            width:        "16px",
                            height:       "16px",
                            borderRadius: type === "individual" ? "50%" : "4px",
                            border:       `2px solid ${selected ? "var(--color-active)" : "rgba(255,255,255,0.2)"}`,
                            background:   selected ? "var(--color-active)" : "transparent",
                            flexShrink:   0,
                            display:      "flex",
                            alignItems:   "center",
                            justifyContent: "center",
                            fontSize:     "9px",
                            color:        "var(--background)",
                          }}
                        >
                          {selected && "✓"}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>
                          {p.full_name ?? p.id}
                        </span>
                        {p.position && (
                          <span style={{ fontSize: "11px", color: "var(--muted-foreground)", marginLeft: "auto" }}>
                            {p.position}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dates */}
              <div className="flex gap-3">
                <GlassInput
                  label={t("startDate")}
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
                  required
                />
                <GlassInput
                  label={t("matchDate")}
                  value={matchDate}
                  onChange={setMatchDate}
                  type="date"
                />
              </div>
              <GlassInput
                label={t("endDate")}
                value={endDate}
                onChange={setEndDate}
                type="date"
                required
              />
            </div>
          </div>

          {/* Training Load Calendar */}
          {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
            <div style={{ ...glass, padding: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>
                {t("trainingLoad")}
              </h3>
              <TrainingLoadCalendar
                startDate={startDate}
                endDate={endDate}
                matchDate={effectiveMatchDate}
                value={trainingLoad}
                onChange={setTrainingLoad}
              />
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: DAILY PLANS ──────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* AI generate button */}
          <div style={{ ...glass, padding: "16px" }} className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600 }}>{t("aiGenerate")}</p>
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
                {t("aiGenerateDesc")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 px-4 py-2.5"
              style={{ fontSize: "13px", whiteSpace: "nowrap" }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t("aiGenerating")}
                </>
              ) : (
                <>🤖 {t("aiGenerateBtn")}</>
              )}
            </button>
          </div>

          {/* Daily plan rows */}
          {dailyPlans.map((plan) => {
            const isExpanded = expandedDays.has(plan.date);
            const label = formatDateLabel(plan.date, locale);
            return (
              <div key={plan.date} style={{ ...glass, overflow: "hidden" }}>
                {/* Header */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleExpandDay(plan.date)}
                >
                  <span
                    style={{
                      fontSize:     "11px",
                      fontWeight:   700,
                      padding:      "2px 8px",
                      borderRadius: "999px",
                      background:   plan.day_type === "match"
                        ? "rgba(255,215,0,0.15)"
                        : "rgba(77,255,180,0.08)",
                      color:        plan.day_type === "match"
                        ? "var(--warning)"
                        : "var(--color-active)",
                      border:       `1px solid ${plan.day_type === "match" ? "rgba(255,215,0,0.3)" : "rgba(77,255,180,0.2)"}`,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {plan.day_type}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{label}</span>
                  {plan.target_calories !== "" && (
                    <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                      {plan.target_calories} kcal
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp size={16} style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                    {/* Expert rec button */}
                    <div className="pt-3">
                      <button
                        type="button"
                        onClick={() => applyExpertRec(plan.date, firstPlayerWeight ?? 75)}
                        className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                        style={{
                          background: "rgba(139,127,245,0.1)",
                          border:     "1px solid rgba(139,127,245,0.25)",
                          color:      "var(--color-energy)",
                          fontWeight: 600,
                        }}
                      >
                        ✦ {t("applyExpertRec")}
                      </button>
                    </div>

                    {/* Macros grid */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                      {(
                        [
                          { field: "target_calories",  label: t("calories"),  unit: "kcal" },
                          { field: "target_protein_g", label: t("protein"),   unit: "g" },
                          { field: "target_carbs_g",   label: t("carbs"),     unit: "g" },
                          { field: "target_fat_g",     label: t("fat"),       unit: "g" },
                          { field: "target_water_ml",  label: t("water"),     unit: "ml" },
                          { field: "target_fiber_g",   label: t("fiber"),     unit: "g" },
                        ] as const
                      ).map(({ field, label, unit }) => (
                        <label key={field} className="block space-y-1">
                          <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontWeight: 500 }}>
                            {label} ({unit})
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={plan[field]}
                            onChange={(e) => updateDayPlan(plan.date, field, e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="—"
                            className="w-full px-2 py-1.5"
                            style={{
                              background:   "rgba(255,255,255,0.05)",
                              border:       "0.5px solid rgba(255,255,255,0.12)",
                              borderRadius: "8px",
                              fontSize:     "13px",
                              color:        "var(--foreground)",
                              outline:      "none",
                            }}
                          />
                        </label>
                      ))}
                    </div>

                    {/* Nutri message */}
                    <label className="block space-y-1">
                      <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500 }}>
                        {t("nutriMessage")}
                      </span>
                      <textarea
                        value={plan.nutri_message}
                        onChange={(e) => updateDayPlan(plan.date, "nutri_message", e.target.value)}
                        maxLength={200}
                        rows={2}
                        placeholder={t("nutriMessagePlaceholder")}
                        className="w-full px-3 py-2 resize-none"
                        style={{
                          background:   "rgba(255,255,255,0.05)",
                          border:       "0.5px solid rgba(255,255,255,0.12)",
                          borderRadius: "10px",
                          fontSize:     "13px",
                          color:        "var(--foreground)",
                          outline:      "none",
                        }}
                      />
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                        {plan.nutri_message.length}/200
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── STEP 3: SUPPLEMENTS ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {dailyPlans.map((plan) => {
            const isExpanded = expandedSuppDays.has(plan.date);
            const label = formatDateLabel(plan.date, locale);
            return (
              <div key={plan.date} style={{ ...glass, overflow: "hidden" }}>
                {/* Section header */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
                  onClick={() => toggleSuppDay(plan.date)}
                >
                  <span
                    style={{
                      fontSize:      "11px",
                      fontWeight:    700,
                      padding:       "2px 8px",
                      borderRadius:  "999px",
                      background:    plan.day_type === "match" ? "rgba(255,215,0,0.15)" : "rgba(77,255,180,0.08)",
                      color:         plan.day_type === "match" ? "var(--warning)" : "var(--color-active)",
                      border:        `1px solid ${plan.day_type === "match" ? "rgba(255,215,0,0.3)" : "rgba(77,255,180,0.2)"}`,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    {plan.day_type === "match" ? "⚽ " : ""}{plan.day_type}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {plan.supplements.length} {plan.supplements.length === 1 ? t("supplement") : t("supplements")}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                    {/* Supplement list */}
                    {plan.supplements.map((supp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border:     "0.5px solid rgba(255,255,255,0.07)",
                          marginTop:  "8px",
                        }}
                      >
                        <GripVertical size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />

                        {/* Brand pill */}
                        {supp.brand && (
                          <span
                            style={{
                              fontSize:     "10px",
                              fontWeight:   700,
                              padding:      "2px 7px",
                              borderRadius: "999px",
                              background:   `${BRAND_COLORS[supp.brand]}18`,
                              color:        BRAND_COLORS[supp.brand],
                              border:       `1px solid ${BRAND_COLORS[supp.brand]}40`,
                              flexShrink:   0,
                            }}
                          >
                            {BRAND_LABELS[supp.brand]}
                          </span>
                        )}

                        {/* Name + dosage */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontSize: "13px", fontWeight: 500 }}>
                            {supp.product_name}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                            {supp.quantity_g != null && `${supp.quantity_g}g`}
                            {supp.quantity_ml != null && `${supp.quantity_ml}ml`}
                            {supp.timing_note && ` · ${supp.timing_note}`}
                            {supp.timing_minutes_before_effort != null && ` · ${supp.timing_minutes_before_effort}min avant`}
                            {supp.timing_minutes_after_effort != null && ` · ${supp.timing_minutes_after_effort}min après`}
                          </p>
                        </div>

                        {/* Stars */}
                        <span style={{ fontSize: "12px", color: "var(--warning)", flexShrink: 0 }}>
                          {"★".repeat(supp.points ?? 0)}
                        </span>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => removeSupplement(plan.date, idx)}
                          style={{
                            background: "none",
                            border:     "none",
                            cursor:     "pointer",
                            padding:    "4px",
                            flexShrink: 0,
                          }}
                        >
                          <Trash2 size={14} style={{ color: "var(--danger)" }} />
                        </button>
                      </div>
                    ))}

                    {/* Add supplement button */}
                    <button
                      type="button"
                      onClick={() => setSuppModal({ open: true, dayDate: plan.date, initial: undefined, editIdx: null })}
                      className="w-full mt-3 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border:     "1px dashed rgba(255,255,255,0.15)",
                        color:      "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                    >
                      + {t("addSupplement")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Navigation buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          style={{
            padding:      "10px 20px",
            borderRadius: "12px",
            fontSize:     "13px",
            fontWeight:   600,
            cursor:       step === 0 ? "not-allowed" : "pointer",
            opacity:      step === 0 ? 0.4 : 1,
            background:   "rgba(255,255,255,0.06)",
            border:       "0.5px solid rgba(255,255,255,0.1)",
            color:        "var(--foreground)",
          }}
        >
          ← {t("previous")}
        </button>

        {step < 2 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext()}
            className="btn-primary px-6 py-2.5"
            style={{ fontSize: "13px" }}
          >
            {t("next")} →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
            style={{ fontSize: "13px" }}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveProgram")
            )}
          </button>
        )}
      </div>

      {/* Supplement modal */}
      {suppModal.open && suppModal.dayDate && (
        <SupplementModal
          initial={suppModal.initial}
          onClose={() => setSuppModal({ open: false, dayDate: null, initial: undefined, editIdx: null })}
          onSave={(supp) => {
            if (suppModal.dayDate) addSupplement(suppModal.dayDate, supp);
          }}
        />
      )}
    </div>
  );
}
