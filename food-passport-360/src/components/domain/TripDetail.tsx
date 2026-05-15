"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  CalendarDays, Hotel, MapPin, Clock, Utensils,
  Plus, Pencil, Trash2, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripWithDetails, HotelAccessWithProfile } from "@/lib/supabase/queries";
import type { FPHotel } from "@/lib/supabase/food-passport.types";
import TripForm from "./TripForm";
import HotelAccessCard from "./HotelAccessCard";
import GenerateAccessModal from "./GenerateAccessModal";
import { archiveTripAction } from "@/app/[locale]/(team-manager)/team-manager/trips/actions";

interface Props {
  trip: TripWithDetails;
  hotels: FPHotel[];
  hotelProfiles: Array<{ id: string; email: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  planifie: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  en_cours: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  termine:  "bg-muted text-muted-foreground",
  annule:   "bg-destructive/10 text-destructive",
};

const STATUS_LABEL: Record<string, string> = {
  planifie: "Planifié", en_cours: "En cours", termine: "Terminé", annule: "Annulé",
};

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  return { start: fmt(start), end: fmt(end) };
}

export default function TripDetail({ trip, hotels, hotelProfiles }: Props) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [isPendingArchive, startArchive] = useTransition();
  const [newAccess, setNewAccess] = useState<{ access: HotelAccessWithProfile; rawToken: string } | null>(null);

  const dates = formatDateRange(trip.start_date, trip.end_date);
  const isArchived = trip.status === "annule";

  function handleArchive() {
    if (!confirm(t("archiveConfirm"))) return;
    startArchive(async () => {
      await archiveTripAction(trip.id);
      router.push(`/${locale}/team-manager/trips`);
    });
  }

  // All accesses to display (newly generated one is shown first with rawToken)
  const displayAccesses: Array<HotelAccessWithProfile & { _rawToken?: string }> = [
    ...(newAccess
      ? [{ ...newAccess.access, _rawToken: newAccess.rawToken }]
      : []),
    ...trip.accesses.filter(a => !newAccess || a.id !== newAccess.access.id),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/${locale}/team-manager/trips`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToList")}
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-lg truncate">{trip.name}</h1>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                STATUS_STYLE[trip.status] ?? STATUS_STYLE.planifie
              )}>
                {STATUS_LABEL[trip.status] ?? trip.status}
              </span>
            </div>
          </div>

          {!isArchived && !isEditing && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
              >
                <Pencil size={12} />
                {tc("edit")}
              </button>
              <button
                onClick={handleArchive}
                disabled={isPendingArchive}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                {t("archive")}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <TripForm
            hotels={hotels}
            trip={trip}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2">
              <CalendarDays size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("fieldStartDate")}</p>
                <p className="capitalize">{dates.start}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("fieldEndDate")}</p>
                <p className="capitalize">{dates.end}</p>
              </div>
            </div>
            {trip.city && (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fieldCity")}</p>
                  <p>{trip.city}</p>
                </div>
              </div>
            )}
            {trip.hotel && (
              <div className="flex items-start gap-2">
                <Hotel size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fieldHotel")}</p>
                  <p>{trip.hotel.name}{trip.hotel.city ? ` · ${trip.hotel.city}` : ""}</p>
                </div>
              </div>
            )}
            {trip.match_time && (
              <div className="flex items-start gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fieldMatchTime")}</p>
                  <p>{new Date(trip.match_time).toLocaleString("fr-FR", {
                    weekday: "short", day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit"
                  })}</p>
                </div>
              </div>
            )}
            {trip.meal_times && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Utensils size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("fieldMealTimes")}</p>
                  <p className="text-sm">{trip.meal_times}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accès hôtel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("accessSection")}</h2>
          {!isArchived && (
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={13} />
              {t("generateAccess")}
            </button>
          )}
        </div>

        {displayAccesses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {t("noAccess")}
          </p>
        ) : (
          <div className="space-y-2">
            {displayAccesses.map(access => (
              <HotelAccessCard
                key={access.id}
                access={access}
                tripId={trip.id}
                rawToken={access._rawToken}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal génération accès */}
      {showGenerate && (
        <GenerateAccessModal
          trip={trip}
          hotelProfiles={hotelProfiles}
          onClose={() => setShowGenerate(false)}
          onSuccess={(access, rawToken) => {
            setNewAccess({ access, rawToken });
            setShowGenerate(false);
          }}
        />
      )}
    </div>
  );
}
