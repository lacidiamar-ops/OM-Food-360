"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X, ShieldPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TripWithDetails, HotelAccessWithProfile } from "@/lib/supabase/queries";
import { generateHotelAccessAction } from "@/app/[locale]/(team-manager)/team-manager/trips/actions";

interface Props {
  trip: TripWithDetails;
  hotelProfiles: Array<{ id: string; email: string }>;
  onClose: () => void;
  onSuccess: (access: HotelAccessWithProfile, rawToken: string) => void;
}

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const SELECT = `${INPUT} cursor-pointer`;
const LABEL = "text-xs font-medium text-muted-foreground";

export default function GenerateAccessModal({ trip, hotelProfiles, onClose, onSuccess }: Props) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");
  const [startsAt, setStartsAt] = useState(trip.start_date);
  const [expiresAt, setExpiresAt] = useState(
    // expires 24 h after end_date
    new Date(new Date(trip.end_date + "T23:59:59").getTime() + 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10)
  );

  function handleGenerate() {
    if (!profileId) { setError(t("errorSelectProfile")); return; }
    if (!trip.hotel_id) { setError(t("errorNoHotel")); return; }
    setError(null);

    startTransition(async () => {
      const { rawToken, error: err } = await generateHotelAccessAction({
        trip_id: trip.id,
        hotel_id: trip.hotel_id!,
        profile_id: profileId,
        starts_at: new Date(startsAt + "T00:00:00").toISOString(),
        expires_at: new Date(expiresAt + "T23:59:59").toISOString(),
      });

      if (err || !rawToken) { setError(err ?? tc("error")); return; }

      // Build a minimal HotelAccessWithProfile to pass back
      const fakeAccess: HotelAccessWithProfile = {
        id: crypto.randomUUID(),
        trip_id: trip.id,
        hotel_id: trip.hotel_id!,
        profile_id: profileId,
        token_hash: "—",
        starts_at: new Date(startsAt + "T00:00:00").toISOString(),
        expires_at: new Date(expiresAt + "T23:59:59").toISOString(),
        revoked_at: null,
        granted_by: null,
        created_at: new Date().toISOString(),
        profile: hotelProfiles.find(p => p.id === profileId) ?? null,
      };
      onSuccess(fakeAccess, rawToken);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-5 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldPlus size={18} className="text-primary" />
            <h2 className="font-semibold text-sm">{t("generateAccessTitle")}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Trip context */}
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {trip.name} · {trip.start_date} → {trip.end_date}
        </div>

        {!trip.hotel_id && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {t("errorNoHotel")}
          </p>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className={LABEL}>{t("accessProfileLabel")} *</label>
            <select className={SELECT} value={profileId} onChange={e => setProfileId(e.target.value)}
              disabled={!trip.hotel_id}>
              <option value="">— {t("selectProfile")} —</option>
              {hotelProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={LABEL}>{t("accessFrom")}</label>
              <input type="date" className={INPUT} value={startsAt}
                onChange={e => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>{t("accessUntil")}</label>
              <input type="date" className={INPUT} value={expiresAt}
                min={startsAt}
                onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            {tc("cancel")}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isPending || !trip.hotel_id}
            className={cn(
              "flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold",
              "text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            )}
          >
            <ShieldPlus size={14} />
            {isPending ? t("generating") : t("generateCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
