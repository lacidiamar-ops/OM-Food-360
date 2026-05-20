"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import StatusBadge from "@/components/ui/StatusBadge";
import type { FPNutritionProgram } from "@/lib/supabase/food-passport.types";

interface Props {
  program: FPNutritionProgram & { player_count: number; avg_score: number | null };
}

function programStatusToStatusBadge(
  status: FPNutritionProgram["status"]
): "pending" | "processing" | "validated" | "refused" {
  switch (status) {
    case "draft":      return "pending";
    case "active":     return "processing";
    case "completed":  return "validated";
    case "archived":   return "refused";
    default:           return "pending";
  }
}

function formatMatchDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(date + "T12:00:00")
  );
}

export default function ProgramCard({ program }: Props) {
  const t = useTranslations("nutrition");
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/nutri/programs/${program.id}`}
      className="block"
      style={{ textDecoration: "none" }}
    >
      <div
        className="flex items-center gap-4 px-5 py-4 transition-opacity hover:opacity-75 cursor-pointer"
        style={{
          background:    "rgba(255,255,255,0.03)",
          border:        "0.5px solid rgba(255,255,255,0.07)",
          borderRadius:  "16px",
        }}
      >
        {/* Left: info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Name + type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate" style={{ fontSize: "15px" }}>
              {program.name}
            </span>
            <span
              className="shrink-0"
              style={{
                fontSize:     "11px",
                fontWeight:   600,
                padding:      "2px 8px",
                borderRadius: "999px",
                border:       "1px solid",
                color:
                  program.type === "individual"
                    ? "var(--color-energy)"
                    : "var(--color-active)",
                borderColor:
                  program.type === "individual"
                    ? "rgba(139,127,245,0.3)"
                    : "rgba(77,255,180,0.3)",
                background:
                  program.type === "individual"
                    ? "rgba(139,127,245,0.1)"
                    : "rgba(77,255,180,0.1)",
              }}
            >
              {program.type === "individual" ? t("typeIndividual") : t("typeCollective")}
            </span>
          </div>

          {/* Match date */}
          {program.match_date && (
            <p
              className="font-mono"
              style={{ fontSize: "12px", color: "var(--warning)" }}
            >
              ⚽ {formatMatchDate(program.match_date, locale)}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            <StatusBadge status={programStatusToStatusBadge(program.status)} />
            <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
              {program.player_count}{" "}
              {program.player_count === 1 ? t("player") : t("players")}
            </span>
            {program.avg_score !== null && (
              <span style={{ fontSize: "12px", color: "var(--color-active)" }}>
                ∅ {Math.round(program.avg_score)}%
              </span>
            )}
          </div>
        </div>

        {/* Right: chevron */}
        <ChevronRight
          size={18}
          style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
        />
      </div>
    </Link>
  );
}
