"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  FPPrescribedSupplement,
  SupplementBrand,
  SupplementType,
} from "@/lib/supabase/food-passport.types";

interface Props {
  onSave:    (supp: Partial<FPPrescribedSupplement>) => void;
  onClose:   () => void;
  initial?:  Partial<FPPrescribedSupplement>;
}

// Brand config ---------------------------------------------------------------

type BrandConfig = { label: string; color: string; bg: string };

const BRAND_CONFIG: Record<SupplementBrand, BrandConfig> = {
  nutrition_x: {
    label: "Nutrition X",
    color: "var(--color-active)",
    bg:    "rgba(77,255,180,0.1)",
  },
  apurna: {
    label: "Apurna",
    color: "var(--color-energy)",
    bg:    "rgba(139,127,245,0.1)",
  },
  sislab: {
    label: "SiSLab",
    color: "var(--warning)",
    bg:    "rgba(255,215,0,0.1)",
  },
  powerbar: {
    label: "PowerBar",
    color: "var(--danger)",
    bg:    "rgba(255,77,106,0.1)",
  },
  beet_it: {
    label: "Beet It",
    color: "rgba(220,50,80,1)",
    bg:    "rgba(180,20,50,0.15)",
  },
  other: {
    label: "Autre",
    color: "var(--muted-foreground)",
    bg:    "rgba(255,255,255,0.06)",
  },
};

const BRANDS: SupplementBrand[] = [
  "nutrition_x",
  "apurna",
  "sislab",
  "powerbar",
  "beet_it",
  "other",
];

// Type config ----------------------------------------------------------------

const SUPPLEMENT_TYPES: SupplementType[] = [
  "protein_shake",
  "gel",
  "bar",
  "recovery_drink",
  "isotonic",
  "beetroot_shot",
  "bcaa",
  "omega3",
  "vitamin",
  "other",
];

// Glass input ----------------------------------------------------------------

function GlassInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label:       string;
  value:       string | number;
  onChange:    (v: string) => void;
  type?:       string;
  placeholder?: string;
  min?:        number;
  max?:        number;
}) {
  return (
    <label className="block space-y-1">
      <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-3 py-2 rounded-xl"
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

// Star rating ----------------------------------------------------------------

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          style={{
            fontSize:   "20px",
            background: "none",
            border:     "none",
            padding:    "2px",
            cursor:     "pointer",
            color:      star <= value ? "var(--warning)" : "rgba(255,255,255,0.2)",
            transition: "color 0.1s",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Main component -------------------------------------------------------------

export default function SupplementModal({ onSave, onClose, initial }: Props) {
  const t = useTranslations("nutrition");

  const [brand, setBrand]           = useState<SupplementBrand>(initial?.brand ?? "nutrition_x");
  const [productName, setProductName] = useState(initial?.product_name ?? "");
  const [productType, setProductType] = useState<SupplementType>(initial?.product_type ?? "other");
  const [quantityStr, setQuantityStr] = useState(
    String(initial?.quantity_g ?? initial?.quantity_ml ?? initial?.quantity_units ?? "")
  );
  const [unit, setUnit]             = useState<"g" | "ml" | "units">(
    initial?.quantity_ml != null ? "ml" : initial?.quantity_units != null ? "units" : "g"
  );
  const [waterMl, setWaterMl]       = useState(String(initial?.water_ml ?? ""));
  const [timingMode, setTimingMode] = useState<"before" | "after" | "with_meal" | null>(
    initial?.timing_minutes_before_effort != null
      ? "before"
      : initial?.timing_minutes_after_effort != null
        ? "after"
        : initial?.timing_note
          ? "with_meal"
          : null
  );
  const [timingMin, setTimingMin]   = useState(
    String(
      initial?.timing_minutes_before_effort ?? initial?.timing_minutes_after_effort ?? ""
    )
  );
  const [points, setPoints]         = useState(initial?.points ?? 3);

  const handleSave = () => {
    const qty = parseFloat(quantityStr) || null;
    const supp: Partial<FPPrescribedSupplement> = {
      brand,
      product_name:                  productName,
      product_type:                  productType,
      quantity_g:                    unit === "g" ? qty : null,
      quantity_ml:                   unit === "ml" ? qty : null,
      quantity_units:                unit === "units" ? qty : null,
      water_ml:                      parseFloat(waterMl) || 0,
      timing_minutes_before_effort:  timingMode === "before" ? parseInt(timingMin) || null : null,
      timing_minutes_after_effort:   timingMode === "after"  ? parseInt(timingMin) || null : null,
      timing_note:                   timingMode === "with_meal" ? t("suppTimingWithMeal") : null,
      points,
    };
    onSave(supp);
    onClose();
  };

  const glassPanel: React.CSSProperties = {
    background:   "rgba(255,255,255,0.03)",
    border:       "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto"
        style={{ ...glassPanel, padding: "24px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "17px", fontWeight: 700 }}>
            {initial?.id ? t("suppEditTitle") : t("suppAddTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background:   "rgba(255,255,255,0.06)",
              border:       "0.5px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding:      "6px",
              cursor:       "pointer",
            }}
          >
            <X size={16} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Brand pills */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
              {t("suppBrand")}
            </p>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((b) => {
                const cfg = BRAND_CONFIG[b];
                const selected = brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b)}
                    style={{
                      padding:      "5px 12px",
                      borderRadius: "999px",
                      fontSize:     "12px",
                      fontWeight:   600,
                      cursor:       "pointer",
                      color:        cfg.color,
                      background:   selected ? cfg.bg : "rgba(255,255,255,0.04)",
                      border:       selected
                        ? `1px solid ${cfg.color}`
                        : "1px solid rgba(255,255,255,0.08)",
                      transition:   "all 0.15s",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product name */}
          <GlassInput
            label={t("suppProductName")}
            value={productName}
            onChange={setProductName}
            placeholder={t("suppProductNamePlaceholder")}
          />

          {/* Product type */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
              {t("suppType")}
            </p>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as SupplementType)}
              className="w-full px-3 py-2 rounded-xl"
              style={{
                background:   "rgba(255,255,255,0.05)",
                border:       "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                fontSize:     "14px",
                color:        "var(--foreground)",
                outline:      "none",
              }}
            >
              {SUPPLEMENT_TYPES.map((st) => (
                <option key={st} value={st}>
                  {t(`suppTypeOption.${st}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity + unit toggle */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
              {t("suppQuantity")}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2"
                style={{
                  background:   "rgba(255,255,255,0.05)",
                  border:       "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  fontSize:     "14px",
                  color:        "var(--foreground)",
                  outline:      "none",
                }}
              />
              {/* Unit toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}>
                {(["g", "ml", "units"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    style={{
                      padding:    "6px 10px",
                      fontSize:   "12px",
                      fontWeight: 600,
                      cursor:     "pointer",
                      border:     "none",
                      background: unit === u ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                      color:      unit === u ? "var(--foreground)" : "var(--muted-foreground)",
                      transition: "all 0.15s",
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Water (for shaker) */}
          <GlassInput
            label={t("suppWater")}
            value={waterMl}
            onChange={setWaterMl}
            type="number"
            min={0}
            placeholder="0"
          />

          {/* Timing */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
              {t("suppTiming")}
            </p>
            <div className="flex flex-col gap-2">
              {/* Timing buttons */}
              <div className="flex flex-wrap gap-2">
                {(["before", "after", "with_meal"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTimingMode(timingMode === mode ? null : mode)}
                    style={{
                      padding:      "6px 12px",
                      borderRadius: "10px",
                      fontSize:     "12px",
                      fontWeight:   600,
                      cursor:       "pointer",
                      background:
                        timingMode === mode
                          ? "rgba(77,255,180,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        timingMode === mode
                          ? "1px solid rgba(77,255,180,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                      color:
                        timingMode === mode ? "var(--color-active)" : "var(--muted-foreground)",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "before" && t("suppTimingBefore")}
                    {mode === "after"  && t("suppTimingAfter")}
                    {mode === "with_meal" && t("suppTimingWithMeal")}
                  </button>
                ))}
              </div>

              {/* Minutes input for before/after */}
              {(timingMode === "before" || timingMode === "after") && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timingMin}
                    onChange={(e) => setTimingMin(e.target.value)}
                    placeholder="30"
                    style={{
                      width:        "80px",
                      padding:      "6px 10px",
                      background:   "rgba(255,255,255,0.05)",
                      border:       "0.5px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      fontSize:     "14px",
                      color:        "var(--foreground)",
                      outline:      "none",
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {t("suppTimingMinutes")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Priority stars */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontWeight: 500, marginBottom: "8px" }}>
              {t("suppPriority")}
            </p>
            <StarRating value={points} onChange={setPoints} />
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!productName.trim()}
            className="w-full btn-primary py-3"
            style={{ fontSize: "14px" }}
          >
            {t("suppSave")}
          </button>
        </div>
      </div>
    </div>
  );
}
