"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FPHotel, FPTrip } from "@/lib/supabase/food-passport.types";
import { createTripAction, updateTripAction } from "@/app/[locale]/(team-manager)/team-manager/trips/actions";

interface Props {
  hotels: FPHotel[];
  trip?: FPTrip;            // si fourni → mode édition
  onCancel?: () => void;
}

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50";
const SELECT = `${INPUT} cursor-pointer`;
const LABEL = "text-xs font-medium text-muted-foreground";

export default function TripForm({ hotels, trip, onCancel }: Props) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(trip?.name ?? "");
  const [city, setCity] = useState(trip?.city ?? "");
  const [startDate, setStartDate] = useState(trip?.start_date ?? "");
  const [endDate, setEndDate] = useState(trip?.end_date ?? "");
  const [hotelId, setHotelId] = useState(trip?.hotel_id ?? "");
  const [stadium, setStadium] = useState(trip?.stadium ?? "");
  const [matchTime, setMatchTime] = useState(
    trip?.match_time ? trip.match_time.slice(0, 16) : ""
  );
  const [mealTimes, setMealTimes] = useState(trip?.meal_times ?? "");

  function handleSubmit() {
    if (!name.trim() || !startDate || !endDate) {
      setError(t("errorRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        city: city.trim() || null,
        start_date: startDate,
        end_date: endDate,
        hotel_id: hotelId || null,
        stadium: stadium.trim() || null,
        match_time: matchTime ? new Date(matchTime).toISOString() : null,
        meal_times: mealTimes.trim() || null,
      };

      if (trip) {
        const { error: err } = await updateTripAction(trip.id, payload);
        if (err) { setError(err); return; }
        onCancel?.();
      } else {
        const { tripId, error: err } = await createTripAction(payload);
        if (err || !tripId) { setError(err ?? tc("error")); return; }
        router.push(`/${locale}/team-manager/trips/${tripId}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className={LABEL}>{t("fieldName")} *</label>
          <input className={INPUT} value={name} onChange={e => setName(e.target.value)}
            placeholder="Ex. Déplacement Lyon — OL · 14–16 juin" />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldCity")}</label>
          <input className={INPUT} value={city} onChange={e => setCity(e.target.value)}
            placeholder="Lyon" />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldHotel")}</label>
          <select className={SELECT} value={hotelId} onChange={e => setHotelId(e.target.value)}>
            <option value="">— {t("noHotel")} —</option>
            {hotels.map(h => (
              <option key={h.id} value={h.id}>{h.name}{h.city ? ` · ${h.city}` : ""}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldStartDate")} *</label>
          <input type="date" className={INPUT} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldEndDate")} *</label>
          <input type="date" className={INPUT} value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldStadium")}</label>
          <input className={INPUT} value={stadium} onChange={e => setStadium(e.target.value)}
            placeholder="Groupama Stadium" />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL}>{t("fieldMatchTime")}</label>
          <input type="datetime-local" className={INPUT} value={matchTime}
            onChange={e => setMatchTime(e.target.value)} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className={LABEL}>{t("fieldMealTimes")}</label>
          <input className={INPUT} value={mealTimes} onChange={e => setMealTimes(e.target.value)}
            placeholder="Petit-déj 7h30 · Déjeuner 12h30 · Dîner 19h" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <X className="h-3.5 w-3.5" />
            {tc("cancel")}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium",
            "text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          )}
        >
          <Save className="h-3.5 w-3.5" />
          {isPending ? tc("saving") : trip ? tc("save") : t("create")}
        </button>
      </div>
    </div>
  );
}
