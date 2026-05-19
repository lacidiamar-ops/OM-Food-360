"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CalendarDays, Hotel, ChevronRight } from "lucide-react";
import type { TripWithHotel } from "@/lib/supabase/queries";
import { StatusBadge, EmptyState } from "@/components/ui";

interface Props {
  trips: TripWithHotel[];
}

type TripStatusBadge = "info" | "processing" | "validated" | "refused";

const TRIP_STATUS_BADGE: Record<string, TripStatusBadge> = {
  planifie: "info",
  en_cours: "processing",
  termine:  "validated",
  annule:   "refused",
};

export default function TripList({ trips }: Props) {
  const t = useTranslations("trips");
  const locale = useLocale();

  function formatDateRange(start: string, end: string) {
    const s = new Date(start + "T12:00:00");
    const e = new Date(end   + "T12:00:00");
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, { day: "numeric", month: "short" });
    return `${fmt(s)} → ${fmt(e)}`;
  }

  if (trips.length === 0) {
    return (
      <EmptyState
        icon="✈️"
        title={t("empty")}
        description={t("emptyDesc")}
      />
    );
  }

  return (
    <div className="space-y-2">
      {trips.map((trip) => (
        <Link
          key={trip.id}
          href={`/team-manager/trips/${trip.id}` as never}
          className="block"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
            }}
          >
            <StatusBadge status={TRIP_STATUS_BADGE[trip.status] ?? "info"} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{trip.name}</p>
              <div className="flex items-center gap-3 mt-0.5" style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1">
                  <CalendarDays size={10} />
                  {formatDateRange(trip.start_date, trip.end_date)}
                </span>
                {trip.hotel && (
                  <span className="hidden sm:flex items-center gap-1">
                    <Hotel size={10} />
                    {trip.hotel.name}
                  </span>
                )}
              </div>
            </div>

            {trip.access_count > 0 && (
              <span
                className="hidden md:block shrink-0"
                style={{ fontSize: "11px", color: "var(--muted-foreground)" }}
              >
                {trip.access_count} {t("accessTitle")}
              </span>
            )}

            <ChevronRight size={16} className="shrink-0 text-muted-foreground/50" />
          </div>
        </Link>
      ))}
    </div>
  );
}
