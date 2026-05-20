"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AvatarColor } from "@/lib/supabase/food-passport.types";

interface Props {
  scorePercent: number;
  pointsEarned: number;
  pointsPossible: number;
  avatarColor: AvatarColor;
}

const AVATAR_COLOR_CSS: Record<AvatarColor, string> = {
  red:    "var(--danger)",
  orange: "rgba(255,160,50,0.9)",
  yellow: "var(--warning)",
  green:  "var(--color-active)",
  blue:   "var(--color-om)",
  gold:   "var(--warning)",
};

const MINI_SIZE = 40;
const MINI_STROKE = 4;
const MINI_RADIUS = (MINI_SIZE - MINI_STROKE) / 2;
const MINI_CIRC = 2 * Math.PI * MINI_RADIUS;

export default function DailyScoreBar({ scorePercent, pointsEarned, pointsPossible, avatarColor }: Props) {
  const t = useTranslations("nutrition");
  const color = AVATAR_COLOR_CSS[avatarColor];
  const clampedScore = Math.min(Math.max(scorePercent, 0), 100);
  const strokeDashoffset = MINI_CIRC - (clampedScore / 100) * MINI_CIRC;

  return (
    <div
      className="sticky bottom-0 z-30"
      style={{
        background:     "rgba(7,8,15,0.85)",
        backdropFilter: "blur(20px)",
        borderTop:      "0.5px solid rgba(255,255,255,0.08)",
        paddingBottom:  "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Mini SVG ring */}
        <div className="shrink-0" style={{ width: MINI_SIZE, height: MINI_SIZE }}>
          <svg
            width={MINI_SIZE}
            height={MINI_SIZE}
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx={MINI_SIZE / 2}
              cy={MINI_SIZE / 2}
              r={MINI_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={MINI_STROKE}
            />
            <motion.circle
              cx={MINI_SIZE / 2}
              cy={MINI_SIZE / 2}
              r={MINI_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth={MINI_STROKE}
              strokeLinecap="round"
              strokeDasharray={MINI_CIRC}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </svg>
        </div>

        {/* Score % + points */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold" style={{ fontSize: 16, color }}>
              {Math.round(clampedScore)}%
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {t("pointsBar", { earned: Math.round(pointsEarned), possible: pointsPossible })}
            </span>
          </div>

          {/* Full-width progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 4, background: "rgba(255,255,255,0.07)" }}
          >
            <motion.div
              style={{
                height:       "100%",
                borderRadius: 999,
                background:   color,
              }}
              animate={{ width: `${clampedScore}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
