"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { ServiceType } from "@/lib/supabase/food-passport.types";
import { createMenuAction } from "./actions";

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const SELECT = `${INPUT} cursor-pointer`;

const SERVICES: ServiceType[] = [
  "petit_dejeuner",
  "dejeuner",
  "collation_pre",
  "collation_post",
  "collation_recup",
  "diner",
  "room_service",
  "after_match",
  "pre_match",
];

export default function NewMenuPage() {
  const t = useTranslations("menus");
  const tservice = useTranslations("service");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [service, setService] = useState<ServiceType>("dejeuner");
  const [locationType, setLocationType] = useState("centre");
  const [locationName, setLocationName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const r = await createMenuAction({
        title,
        date,
        service,
        location_type: locationType,
        location_name: locationName || null,
        start_time: startTime || null,
        end_time: endTime || null,
      });
      if (r.error) setError(r.error);
      else if (r.id) router.push(`/${locale}/resto/menus/${r.id}`);
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/resto/menus`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      <h1 className="font-bold text-lg">{t("new")}</h1>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("field.title")}</label>
          <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Déjeuner Lundi" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.date")}</label>
            <input type="date" className={INPUT} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.service")}</label>
            <select className={SELECT} value={service} onChange={(e) => setService(e.target.value as ServiceType)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{tservice(s)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.locationType")}</label>
            <select className={SELECT} value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="centre">Centre d'entraînement</option>
              <option value="hotel">Hôtel</option>
              <option value="stade">Stade</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.locationName")}</label>
            <input className={INPUT} value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Optionnel" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.startTime")}</label>
            <input type="time" className={INPUT} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("field.endTime")}</label>
            <input type="time" className={INPUT} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl p-2">{error}</p>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending || !title.trim()}
        className="w-full rounded-xl bg-primary text-primary-foreground text-sm py-3 font-medium hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? tc("saving") : t("create")}
      </button>
    </div>
  );
}
