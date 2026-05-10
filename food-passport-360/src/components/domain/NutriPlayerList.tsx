"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Search, ChevronRight, Users } from "lucide-react";
import type { FormStatus } from "@/lib/supabase/food-passport.types";

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

const STATUS_COLORS: Record<FormStatus, string> = {
  brouillon: "bg-muted text-muted-foreground",
  incomplete: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  a_mettre_a_jour: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  complete: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  validee: "bg-green-500/15 text-green-700 dark:text-green-400",
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">{t("players")}</h1>
        <span className="text-sm text-muted-foreground">{players.length} joueurs</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {search ? "Aucun résultat" : t("noPlayersDesc")}
          </p>
        </div>
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

          return (
            <li key={player.id}>
              <Link
                href={`/${locale}/nutri/players/${player.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors active:scale-[0.99]"
              >
                {/* Avatar */}
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={`${player.first_name} ${player.last_name}`}
                    className="h-11 w-11 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                    {player.first_name[0]}{player.last_name[0]}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {player.last_name} {player.first_name}
                    </span>
                    {player.jersey_number != null && (
                      <span className="text-xs text-muted-foreground">#{player.jersey_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {positionLabel && (
                      <span className="text-xs text-muted-foreground">{positionLabel}</span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[formStatus]}`}
                    >
                      {tp(`formStatus.${formStatus}` as Parameters<typeof tp>[0])}
                    </span>
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
