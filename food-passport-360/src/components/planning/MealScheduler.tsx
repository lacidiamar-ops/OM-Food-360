"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FPMealSchedule, MealService } from "@/lib/supabase/food-passport.types";
import ScheduleModal from "./ScheduleModal";
import { PageHeader } from "@/components/ui";

interface Props {
  initialSchedules: FPMealSchedule[];
  currentUserId: string;
}

const SERVICES: MealService[] = ["breakfast", "lunch", "dinner", "snack"];

const SERVICE_STYLE: Record<MealService, { color: string; bg: string; border: string }> = {
  breakfast: { color: "var(--color-energy)", bg: "rgba(139,127,245,0.08)", border: "rgba(139,127,245,0.20)" },
  lunch:     { color: "var(--color-active)", bg: "rgba(77,255,180,0.08)",  border: "rgba(77,255,180,0.20)"  },
  dinner:    { color: "var(--color-om)",     bg: "rgba(0,91,172,0.10)",    border: "rgba(0,91,172,0.25)"    },
  snack:     { color: "var(--warning)",      bg: "rgba(255,215,0,0.08)",   border: "rgba(255,215,0,0.20)"   },
};

function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MealScheduler({ initialSchedules, currentUserId }: Props) {
  const t = useTranslations("planning");
  const locale = useLocale();
  const [anchor, setAnchor] = useState(new Date());
  const [schedules, setSchedules] = useState<FPMealSchedule[]>(initialSchedules);
  const [modal, setModal] = useState<{
    open: boolean;
    date?: string;
    service?: MealService;
    existing?: FPMealSchedule;
  }>({ open: false });

  const weekDays = getWeekDates(anchor);

  function prevWeek() {
    setAnchor((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; });
  }
  function nextWeek() {
    setAnchor((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; });
  }

  function getSlots(date: Date, service: MealService): FPMealSchedule[] {
    return schedules.filter((s) => s.date === isoDate(date) && s.service === service);
  }

  async function handleSave(data: Omit<FPMealSchedule, "id" | "created_at">) {
    const supabase = createClient();
    if (modal.existing) {
      const { error } = await supabase
        .schema("food_passport" as never)
        .from("meal_schedules")
        .update({ ...data })
        .eq("id", modal.existing.id);
      if (!error) {
        setSchedules((prev) => prev.map((s) => s.id === modal.existing!.id ? { ...s, ...data } : s));
      }
    } else {
      const { data: created, error } = await supabase
        .schema("food_passport" as never)
        .from("meal_schedules")
        .insert({ ...data, created_by: currentUserId })
        .select()
        .single();
      if (!error && created) {
        setSchedules((prev) => [...prev, created as FPMealSchedule]);
        // Insert notifications for all players
        const { data: players } = await supabase
          .schema("food_passport" as never)
          .from("profiles")
          .select("id")
          .eq("role", "joueur");
        if (players && players.length > 0) {
          const notifs = players.map((p: { id: string }) => ({
            recipient_id: p.id,
            type: "meal_schedule",
            title_key: "notification.mealScheduled",
            body_key: "notification.mealScheduledBody",
            body_params: { service: data.service, date: data.date, time: data.time_start, location: data.location },
          }));
          await supabase.schema("food_passport" as never).from("notifications").insert(notifs);
        }
      }
    }
  }

  async function handleDelete() {
    if (!modal.existing) return;
    const supabase = createClient();
    await supabase
      .schema("food_passport" as never)
      .from("meal_schedules")
      .delete()
      .eq("id", modal.existing.id);
    setSchedules((prev) => prev.filter((s) => s.id !== modal.existing!.id));
  }

  const weekLabel = (() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  })();

  return (
    <div className="px-4 py-6 space-y-4 max-w-4xl mx-auto">
      <PageHeader
        label={t("label")}
        title={t("title")}
        subtitle={weekLabel}
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevWeek}
          className="flex items-center justify-center h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-muted-foreground">{weekLabel}</span>
        <button
          type="button"
          onClick={nextWeek}
          className="flex items-center justify-center h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid: scroll horizontally on mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div style={{ minWidth: 560 }}>
          {/* Day headers */}
          <div
            className="grid mb-2"
            style={{ gridTemplateColumns: "80px repeat(7, 1fr)", gap: 4 }}
          >
            <div />
            {weekDays.map((day) => {
              const isToday = isoDate(day) === isoDate(new Date());
              return (
                <div key={isoDate(day)} className="text-center space-y-0.5">
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: isToday ? "var(--color-active)" : "var(--muted-foreground)",
                    }}
                  >
                    {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day)}
                  </p>
                  <p
                    className="font-bold"
                    style={{
                      fontSize: 14,
                      color: isToday ? "var(--color-active)" : "var(--foreground)",
                    }}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Service rows */}
          {SERVICES.map((svc) => {
            const style = SERVICE_STYLE[svc];
            return (
              <div
                key={svc}
                className="grid mb-1"
                style={{ gridTemplateColumns: "80px repeat(7, 1fr)", gap: 4 }}
              >
                {/* Service label */}
                <div
                  className="flex items-center justify-end pr-2 text-right"
                  style={{ minHeight: 48 }}
                >
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: style.color,
                    }}
                  >
                    {t(`service.${svc}`)}
                  </span>
                </div>

                {/* Day cells */}
                {weekDays.map((day) => {
                  const slots = getSlots(day, svc);
                  return (
                    <div
                      key={isoDate(day)}
                      className="relative"
                      style={{ minHeight: 48 }}
                    >
                      {slots.length > 0 ? (
                        slots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setModal({ open: true, existing: slot })}
                            className="w-full text-left p-1.5 space-y-0.5 transition-all"
                            style={{
                              background: style.bg,
                              border: `0.5px solid ${style.border}`,
                              borderRadius: "10px",
                            }}
                          >
                            <p style={{ fontSize: 10, fontWeight: 700, color: style.color }}>
                              {slot.time_start.slice(0, 5)}–{slot.time_end.slice(0, 5)}
                            </p>
                            <p style={{ fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase" }}>
                              {t(`location.${slot.location}`)}
                            </p>
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          onClick={() => setModal({ open: true, date: isoDate(day), service: svc })}
                          className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          style={{
                            minHeight: 48,
                            border: "1px dashed rgba(255,255,255,0.12)",
                            borderRadius: "10px",
                          }}
                          aria-label={t("addSlot")}
                        >
                          <Plus size={12} className="text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {modal.open && (
        <ScheduleModal
          initialDate={modal.date}
          initialService={modal.service}
          existing={modal.existing}
          onSave={handleSave}
          onDelete={modal.existing ? handleDelete : undefined}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
