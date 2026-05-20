"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  FPPrescribedSupplement,
  FPSupplementConsumption,
  SupplementBrand,
} from "@/lib/supabase/food-passport.types";

interface Props {
  supplement: FPPrescribedSupplement;
  consumption: FPSupplementConsumption | null;
  onToggle: (supplementId: string, taken: boolean) => void;
}

interface BrandStyle {
  color: string;
  borderColor: string;
  background: string;
}

const BRAND_STYLE: Record<SupplementBrand, BrandStyle> = {
  nutrition_x: {
    color:       "var(--color-active)",
    borderColor: "rgba(77,255,180,0.30)",
    background:  "rgba(77,255,180,0.08)",
  },
  apurna: {
    color:       "var(--color-energy)",
    borderColor: "rgba(139,127,245,0.30)",
    background:  "rgba(139,127,245,0.08)",
  },
  sislab: {
    color:       "var(--warning)",
    borderColor: "rgba(255,215,0,0.30)",
    background:  "rgba(255,215,0,0.08)",
  },
  powerbar: {
    color:       "var(--danger)",
    borderColor: "rgba(255,77,106,0.30)",
    background:  "rgba(255,77,106,0.08)",
  },
  beet_it: {
    color:       "rgba(180,30,80,0.95)",
    borderColor: "rgba(180,30,80,0.30)",
    background:  "rgba(180,30,80,0.08)",
  },
  other: {
    color:       "var(--muted-foreground)",
    borderColor: "rgba(255,255,255,0.12)",
    background:  "rgba(255,255,255,0.05)",
  },
};

function formatDosage(supplement: FPPrescribedSupplement): string {
  if (supplement.quantity_units !== null && supplement.quantity_g !== null) {
    return `${supplement.quantity_units} mesure(s) (${supplement.quantity_g}g)${supplement.water_ml > 0 ? ` + ${supplement.water_ml}ml eau` : ""}`;
  }
  if (supplement.quantity_ml !== null) {
    return `1 shot (${supplement.quantity_ml}ml)`;
  }
  if (supplement.quantity_g !== null) {
    return `${supplement.quantity_g}g`;
  }
  if (supplement.water_ml > 0) {
    return `${supplement.water_ml}ml`;
  }
  return "—";
}

function formatTiming(supplement: FPPrescribedSupplement): string | null {
  if (supplement.timing_note) return supplement.timing_note;
  if (supplement.timing_minutes_before_effort !== null) {
    return `${supplement.timing_minutes_before_effort} min avant l'effort`;
  }
  if (supplement.timing_minutes_after_effort !== null) {
    return `${supplement.timing_minutes_after_effort} min après l'effort`;
  }
  return null;
}

const BRAND_LABEL: Record<SupplementBrand, string> = {
  nutrition_x: "Nutrition X",
  apurna:      "Apurna",
  sislab:      "Sislab",
  powerbar:    "Powerbar",
  beet_it:     "Beet It",
  other:       "Autre",
};

export default function SupplementTracker({ supplement, consumption, onToggle }: Props) {
  const t = useTranslations("nutrition");
  const taken = consumption?.taken ?? false;
  const brandStyle = BRAND_STYLE[supplement.brand];
  const timing = formatTiming(supplement);
  const brandLabel = supplement.brand === "other" && supplement.brand_other
    ? supplement.brand_other
    : BRAND_LABEL[supplement.brand];

  return (
    <motion.div
      layout
      className="flex items-center gap-3 px-4 py-3"
      style={{
        background:   taken ? "rgba(77,255,180,0.04)" : "rgba(255,255,255,0.03)",
        border:       "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        opacity:      taken ? 0.8 : 1,
        transition:   "opacity 0.2s, background 0.2s",
      }}
    >
      {/* Brand badge */}
      <span
        className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
        style={{
          color:       brandStyle.color,
          borderColor: brandStyle.borderColor,
          background:  brandStyle.background,
          border:      `0.5px solid ${brandStyle.borderColor}`,
        }}
      >
        {brandLabel}
      </span>

      {/* Name + dosage + timing */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className="font-medium truncate"
          style={{
            fontSize:        14,
            textDecoration:  taken ? "line-through" : "none",
            color:           taken ? "var(--muted-foreground)" : "var(--foreground)",
            transition:      "color 0.2s",
          }}
        >
          {supplement.product_name}
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {formatDosage(supplement)}
        </p>
        {timing && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {timing}
          </p>
        )}
      </div>

      {/* Checkbox */}
      <button
        type="button"
        aria-label={taken ? t("taken") : t("notTaken")}
        onClick={() => onToggle(supplement.id, !taken)}
        className="shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90"
        style={{
          width:      28,
          height:     28,
          border:     taken
            ? "none"
            : "1.5px solid rgba(255,255,255,0.20)",
          background: taken ? "var(--color-active)" : "transparent",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        {taken && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Check size={14} style={{ color: "var(--background)" }} strokeWidth={3} />
          </motion.div>
        )}
      </button>
    </motion.div>
  );
}
