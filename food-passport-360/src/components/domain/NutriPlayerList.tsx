"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import type { FormStatus } from "@/lib/supabase/food-passport.types";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";

interface PlayerWithForm {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: string | null;
  squad_group: string | null;
  photo_url: string | null;
  status: string;
  player_onboarding_forms: Array<{
    id: string;
    status: FormStatus;
    completion_percent: number;
  }>;
}

interface Props {
  players: PlayerWithForm[];
}

type BadgeStatus = "pending" | "validated" | "refused" | "urgent" | "info" | "processing";

const STATUS_BADGE: Record<FormStatus, BadgeStatus> = {
  brouillon:      "pending",
  incomplete:     "urgent",
  a_mettre_a_jour:"pending",
  complete:       "processing",
  validee:        "validated",
};

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-1 w-full overflow-hidden"
      style={{ background: "var(--muted)", borderRadius: "999px" }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: pct >= 100
            ? "var(--color-active)"
            : pct >= 60
              ? "var(--primary-foreground)"
              : "var(--warning)",
          borderRadius: "999px",
        }}
      />
    </div>
  );
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "10px 12px 10px 36px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

export default function NutriPlayerList({ players }: Props) {
  const t = useTranslations("nutri");
  const tp = useTranslations("passport");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const filtered = players.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      String(p.jersey_number ?? "").includes(q)
    );
  });

  const countBadge = (
    <span
      style={{
        background: "rgba(77,255,180,0.10)",
        color: "var(--color-active)",
        border: "1px solid rgba(77,255,180,0.20)",
        borderRadius: "999px",
        padding: "3px 10px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {players.length}
    </span>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader
        label={t("playersLabel")}
        title={t("players")}
        subtitle={t("playersSubtitle", { count: players.length })}
        action={countBadge}
      />

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={INPUT_STYLE}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={search ? t("noResults") : t("noPlayers")}
          description={search ? undefined : t("noPlayersDesc")}
        />
      )}

      {/* Player list */}
      <ul className="space-y-2">
        {filtered.map((player) => {
          const form = player.player_onboarding_forms?.[0];
          const formStatus: FormStatus = form?.status ?? "brouillon";
          const progress = form?.completion_percent ?? 0;
          const positionLabel = player.position
            ? tp(`position.${player.position}` as Parameters<typeof tp>[0])
            : null;
          const initials = `${player.first_name[0]}${player.last_name[0]}`.toUpperCase();

          return (
            <li key={player.id}>
              <Link
                href={`/${locale}/nutri/players/${player.id}`}
                className="flex items-center gap-3 p-3 transition-colors active:scale-[0.99]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: "16px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                {/* Avatar */}
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={`${player.first_name} ${player.last_name}`}
                    className="h-11 w-11 object-cover flex-shrink-0"
                    style={{ borderRadius: "12px" }}
                  />
                ) : (
                  <div
                    className="flex h-11 w-11 items-center justify-center font-semibold text-sm flex-shrink-0 text-active"
                    style={{
                      background: "rgba(77,255,180,0.08)",
                      borderRadius: "12px",
                    }}
                  >
                    {initials}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">
                      {player.last_name} {player.first_name}
                    </span>
                    {player.jersey_number != null && (
                      <span className="text-xs text-muted-foreground font-mono">
                        #{player.jersey_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {positionLabel && (
                      <span className="text-xs text-muted-foreground">{positionLabel}</span>
                    )}
                    <StatusBadge status={STATUS_BADGE[formStatus]} />
                    {progress > 0 && (
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {progress}%
                      </span>
                    )}
                  </div>
                  <ProgressBar value={progress} />
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
