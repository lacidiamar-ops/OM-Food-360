"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Trash2 } from "lucide-react";
import type { FPMealSchedule, MealService, MealLocation } from "@/lib/supabase/food-passport.types";

interface Props {
  initialDate?: string;         // YYYY-MM-DD
  initialService?: MealService;
  existing?: FPMealSchedule;    // if editing
  onSave: (data: Omit<FPMealSchedule, "id" | "created_at">) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const SERVICES: MealService[] = ["breakfast", "lunch", "dinner", "snack"];
const LOCATIONS: MealLocation[] = ["centre", "hotel", "deplacement"];

const SERVICE_COLOR: Record<MealService, string> = {
  breakfast: "var(--color-energy)",
  lunch:     "var(--color-active)",
  dinner:    "var(--color-om)",
  snack:     "var(--warning)",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

export default function ScheduleModal({ initialDate, initialService, existing, onSave, onDelete, onClose }: Props) {
  const t = useTranslations("planning");
  const tc = useTranslations("common");

  const [date, setDate] = useState(existing?.date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [service, setService] = useState<MealService>(existing?.service ?? initialService ?? "lunch");
  const [location, setLocation] = useState<MealLocation>(existing?.location ?? "centre");
  const [timeStart, setTimeStart] = useState(existing?.time_start ?? "12:00");
  const [timeEnd, setTimeEnd] = useState(existing?.time_end ?? "13:30");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [playerGroup, setPlayerGroup] = useState(existing?.player_group ?? "all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      date,
      service,
      location,
      time_start: timeStart,
      time_end: timeEnd,
      player_group: playerGroup,
      notes: notes || null,
      created_by: null,
      trip_id: existing?.trip_id ?? null,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm space-y-4 p-5"
        style={{
          background: "rgba(13,15,30,0.98)",
          border: "0.5px solid rgba(255,255,255,0.10)",
          borderRadius: "24px",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">
            {existing ? t("editSlot") : t("addSlot")}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("date")}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT_STYLE} />
        </div>

        {/* Service pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("service")}</label>
          <div className="flex gap-1.5 flex-wrap">
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                className="px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  borderRadius: "999px",
                  background: service === s ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.03)",
                  border: `0.5px solid ${service === s ? SERVICE_COLOR[s] : "rgba(255,255,255,0.08)"}`,
                  color: service === s ? SERVICE_COLOR[s] : "var(--muted-foreground)",
                }}
              >
                {t(`service.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("location")}</label>
          <div className="flex gap-1.5">
            {LOCATIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocation(l)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  borderRadius: "12px",
                  background: location === l ? "rgba(77,255,180,0.08)" : "rgba(255,255,255,0.03)",
                  border: `0.5px solid ${location === l ? "rgba(77,255,180,0.25)" : "rgba(255,255,255,0.07)"}`,
                  color: location === l ? "var(--color-active)" : "var(--muted-foreground)",
                }}
              >
                {t(`location.${l}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("timeStart")}</label>
            <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("timeEnd")}</label>
            <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Player group */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("playerGroup")}</label>
          <input
            value={playerGroup}
            onChange={(e) => setPlayerGroup(e.target.value)}
            placeholder={t("playerGroupPlaceholder")}
            style={INPUT_STYLE}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={t("notesPlaceholder")}
            style={{ ...INPUT_STYLE, resize: "none" }}
          />
        </div>

        {/* Actions */}
        <div className={`flex gap-2 ${existing ? "flex-row" : ""}`}>
          {existing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium disabled:opacity-60 transition-colors"
              style={{
                border: "0.5px solid rgba(255,77,106,0.30)",
                color: "var(--danger)",
                background: "rgba(255,77,106,0.06)",
                borderRadius: "14px",
              }}
            >
              <Trash2 size={14} />
              {tc("delete")}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !date || !timeStart || !timeEnd}
            className="btn-primary flex-1 py-2.5 text-sm font-semibold disabled:opacity-40"
            style={{ borderRadius: "14px" }}
          >
            {saving ? tc("saving") : tc("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
