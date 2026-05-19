"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Hotel, MapPin, Clock, Utensils,
  Plus, Pencil, Trash2, ChevronLeft,
} from "lucide-react";
import type { TripWithDetails, HotelAccessWithProfile } from "@/lib/supabase/queries";
import type { FPHotel } from "@/lib/supabase/food-passport.types";
import TripForm from "./TripForm";
import HotelAccessCard from "./HotelAccessCard";
import GenerateAccessModal from "./GenerateAccessModal";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
import { archiveTripAction } from "@/app/[locale]/(team-manager)/team-manager/trips/actions";

interface Props {
  trip: TripWithDetails;
  hotels: FPHotel[];
  hotelProfiles: Array<{ id: string; email: string }>;
}

type TripStatusBadge = "info" | "processing" | "validated" | "refused";

const TRIP_STATUS_BADGE: Record<string, TripStatusBadge> = {
  planifie: "info",
  en_cours: "processing",
  termine:  "validated",
  annule:   "refused",
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm capitalize">{value}</p>
      </div>
    </div>
  );
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

  const isArchived = trip.status === "annule";

  function formatDate(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString(locale, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function handleArchive() {
    if (!confirm(t("archiveConfirm"))) return;
    startArchive(async () => {
      await archiveTripAction(trip.id);
      router.push(`/${locale}/team-manager/trips`);
    });
  }

  const displayAccesses: Array<HotelAccessWithProfile & { _rawToken?: string }> = [
    ...(newAccess ? [{ ...newAccess.access, _rawToken: newAccess.rawToken }] : []),
    ...trip.accesses.filter((a) => !newAccess || a.id !== newAccess.access.id),
  ];

  const badgeStatus = TRIP_STATUS_BADGE[trip.status] ?? "info";
  const subtitle = [trip.city, formatDate(trip.start_date)].filter(Boolean).join(" · ");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push(`/${locale}/team-manager/trips`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("backToList")}
      </button>

      {/* PageHeader */}
      <PageHeader
        label={t("deploymentLabel")}
        title={trip.name}
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={badgeStatus} />
            {!isArchived && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ border: "0.5px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}
                >
                  <Pencil size={11} />
                  {tc("edit")}
                </button>
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={isPendingArchive}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
                  style={{ border: "0.5px solid rgba(255,77,106,0.30)", color: "var(--danger)", background: "rgba(255,77,106,0.05)" }}
                >
                  <Trash2 size={11} />
                  {t("archive")}
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Card details */}
      <div
        className="p-5 space-y-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: "20px",
        }}
      >
        {isEditing ? (
          <TripForm hotels={hotels} trip={trip} onCancel={() => setIsEditing(false)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={CalendarDays} label={t("fieldStartDate")} value={formatDate(trip.start_date)} />
            <InfoRow icon={CalendarDays} label={t("fieldEndDate")} value={formatDate(trip.end_date)} />
            {trip.city && <InfoRow icon={MapPin} label={t("fieldCity")} value={trip.city} />}
            {trip.hotel && (
              <InfoRow
                icon={Hotel}
                label={t("fieldHotel")}
                value={`${trip.hotel.name}${trip.hotel.city ? ` · ${trip.hotel.city}` : ""}`}
              />
            )}
            {trip.match_time && (
              <InfoRow
                icon={Clock}
                label={t("fieldMatchTime")}
                value={new Date(trip.match_time).toLocaleString(locale, {
                  weekday: "short", day: "numeric", month: "short",
                  hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {trip.meal_times && (
              <div className="sm:col-span-2 flex items-start gap-2">
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

      {/* Hotel accesses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("accessSection")}</h2>
          {!isArchived && (
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              className="btn-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
            >
              <Plus size={13} />
              {t("generateAccess")}
            </button>
          )}
        </div>

        {displayAccesses.length === 0 ? (
          <EmptyState
            icon={<Hotel className="h-6 w-6" />}
            title={t("noAccess")}
            description={t("noAccessDesc")}
          />
        ) : (
          <div className="space-y-2">
            {displayAccesses.map((access) => (
              <HotelAccessCard
                key={access.id}
                access={access}
                tripId={trip.id}
                rawToken={access._rawToken}
              />
            ))}
          </div>
        )}
      </section>

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
