"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarDays, Hotel, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripWithHotel } from "@/lib/supabase/queries";

interface Props {
  trips: TripWithHotel[];
}

const STATUS_STYLE: Record<string, string> = {
  planifie:  "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  en_cours:  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  termine:   "bg-muted text-muted-foreground",
  annule:    "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  planifie: "Planifié",
  en_cours: "En cours",
  termine:  "Terminé",
  annule:   "Annulé",
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end   + "T12:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${fmt(s)} → ${fmt(e)}`;
}

export default function TripList({ trips }: Props) {
  const t = useTranslations("trips");

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <CalendarDays size={32} className="text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
      {trips.map(trip => (
        <Link
          key={trip.id}
          href={`/team-manager/trips/${trip.id}` as never}
          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
        >
          {/* Status badge */}
          <span className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            STATUS_STYLE[trip.status] ?? STATUS_STYLE.planifie
          )}>
            {STATUS_LABEL[trip.status] ?? trip.status}
          </span>

          {/* Main info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{trip.name}</p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <CalendarDays size={10} />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
              {trip.hotel && (
                <span className="flex items-center gap-1 hidden sm:flex">
                  <Hotel size={10} />
                  {trip.hotel.name}
                </span>
              )}
            </div>
          </div>

          {/* Access count */}
          {trip.access_count > 0 && (
            <span className="shrink-0 text-[11px] text-muted-foreground hidden md:block">
              {trip.access_count} accès
            </span>
          )}

          <ChevronRight size={16} className="shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </Link>
      ))}
    </div>
  );
}
