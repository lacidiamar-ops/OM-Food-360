"use client";

import { motion } from "framer-motion";

interface Props {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

function getScoreTier(score: number | null): "alert" | "progress" | "performance" {
  if (score === null) return "progress";
  if (score < 50) return "alert";
  if (score < 75) return "progress";
  return "performance";
}

const TIER_CONFIG = {
  alert: {
    emoji: "🔴",
    gradient: "from-orange-500/20 via-red-500/10 to-red-600/20",
    glow: "shadow-red-500/40",
    ring: "ring-red-500/60",
    label: "Alerte nutritionnelle",
    textColor: "text-red-500",
  },
  progress: {
    emoji: "💪",
    gradient: "from-blue-500/20 via-violet-500/10 to-purple-600/20",
    glow: "shadow-blue-500/40",
    ring: "ring-blue-500/60",
    label: "En progression",
    textColor: "text-blue-500",
  },
  performance: {
    emoji: "⭐",
    gradient: "from-yellow-400/25 via-amber-400/15 to-yellow-500/25",
    glow: "shadow-yellow-400/50",
    ring: "ring-yellow-400/70",
    label: "Performance",
    textColor: "text-yellow-500",
  },
};

const SIZES = {
  sm: { outer: "h-16 w-16", emoji: "text-2xl", ring: "ring-2" },
  md: { outer: "h-24 w-24", emoji: "text-4xl", ring: "ring-2" },
  lg: { outer: "h-32 w-32", emoji: "text-5xl", ring: "ring-[3px]" },
};

export default function AvatarEvolution({ score, size = "md" }: Props) {
  const tier = getScoreTier(score);
  const cfg = TIER_CONFIG[tier];
  const sz = SIZES[size];

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Glow ring + avatar */}
      <div className="relative">
        {/* Outer glow pulse */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${cfg.gradient}`}
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: `blur(8px)` }}
        />
        {/* Avatar circle */}
        <motion.div
          className={`relative ${sz.outer} rounded-full bg-gradient-to-br ${cfg.gradient} ${sz.ring} ${cfg.ring} flex items-center justify-center shadow-xl ${cfg.glow}`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <motion.span
            className={sz.emoji}
            animate={{ rotate: tier === "performance" ? [0, 5, -5, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {cfg.emoji}
          </motion.span>
        </motion.div>

        {/* Score badge */}
        {score !== null && (
          <motion.div
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-border shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <span className={`text-[10px] font-bold ${cfg.textColor}`}>{score}</span>
          </motion.div>
        )}
      </div>

      {/* Label tier */}
      <motion.span
        className={`text-xs font-medium ${cfg.textColor}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {cfg.label}
      </motion.span>
    </motion.div>
  );
}

export { getScoreTier, TIER_CONFIG };
