"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AvatarColor, DayType } from "@/lib/supabase/food-passport.types";

interface Props {
  scorePercent: number;
  avatarColor: AvatarColor;
  streakDays: number;
  dayType: DayType | null;
  playerInitials: string;
}

const AVATAR_COLOR_CSS: Record<AvatarColor, string> = {
  red:    "var(--danger)",
  orange: "rgba(255,160,50,0.9)",
  yellow: "var(--warning)",
  green:  "var(--color-active)",
  blue:   "var(--color-om)",
  gold:   "var(--warning)",
};

const SVG_SIZE = 120;
const STROKE_WIDTH = 6;
const RADIUS = (SVG_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DAY_TYPE_LABELS: Record<DayType, string> = {
  "j-6":   "J-6",
  "j-5":   "J-5",
  "j-4":   "J-4",
  "j-3":   "J-3 · Charge glucidique",
  "j-2":   "J-2 · Glucides ↑",
  "j-1":   "J-1 · Veille match",
  match:   "⚽ Jour de match",
  "j+1":  "J+1 · Récupération",
  "j+2":  "J+2 · Retour normal",
  normal:  "Jour normal",
};

export default function AvatarEvolution({
  scorePercent,
  avatarColor,
  streakDays,
  dayType,
  playerInitials,
}: Props) {
  const t = useTranslations("nutrition");
  const color = AVATAR_COLOR_CSS[avatarColor];
  const clampedScore = Math.min(Math.max(scorePercent, 0), 100);
  const strokeDashoffset = CIRCUMFERENCE - (clampedScore / 100) * CIRCUMFERENCE;
  const isGold = avatarColor === "gold";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG ring + initials */}
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress */}
          <motion.circle
            cx={SVG_SIZE / 2}
            cy={SVG_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={
              isGold
                ? { filter: `drop-shadow(0 0 6px ${color})` }
                : undefined
            }
          />
        </svg>

        {/* Initials */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{ fontSize: 28, fontWeight: 700, color: "var(--foreground)" }}
        >
          {playerInitials || "?"}
        </div>

        {/* Gold pulse ring */}
        {isGold && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `2px solid ${color}` }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Score % */}
      <motion.span
        className="text-xl font-bold"
        style={{ color: "var(--color-active)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {Math.round(clampedScore)}%
      </motion.span>

      {/* Streak badge */}
      {streakDays >= 3 && (
        <motion.span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{
            color: "var(--warning)",
            background: "rgba(255,215,0,0.10)",
            border: "0.5px solid rgba(255,215,0,0.20)",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          {t("streakDays", { count: streakDays })}
        </motion.span>
      )}

      {/* Day type badge */}
      {dayType && (
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{
            color: "var(--muted-foreground)",
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.10)",
          }}
        >
          {DAY_TYPE_LABELS[dayType]}
        </span>
      )}
    </div>
  );
}
