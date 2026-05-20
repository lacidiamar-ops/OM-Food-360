"use client";

import { useTranslations } from "next-intl";
import type { TrainingLoad, TrainingLoadEntry } from "@/lib/supabase/food-passport.types";

interface Props {
  startDate: string;
  endDate:   string;
  matchDate: string | null;
  value:     TrainingLoadEntry[];
  onChange:  (entries: TrainingLoadEntry[]) => void;
  readonly?: boolean;
}

type LoadConfig = {
  label:      string;
  bg:         string;
  color:      string;
  border?:    string;
  pulse?:     boolean;
};

const LOAD_CYCLE: TrainingLoad[] = ["rest", "light", "medium", "high", "double", "match"];

const LOAD_CONFIG: Record<TrainingLoad, LoadConfig> = {
  rest:   { label: "Repos",    bg: "rgba(255,255,255,0.10)", color: "var(--muted-foreground)" },
  light:  { label: "Légère",   bg: "rgba(77,255,180,0.20)",  color: "var(--color-active)" },
  medium: { label: "Moyenne",  bg: "rgba(77,255,180,0.40)",  color: "var(--color-active)" },
  high:   { label: "Haute",    bg: "rgba(255,215,0,0.30)",   color: "var(--warning)" },
  double: { label: "Double",   bg: "rgba(255,77,106,0.30)",  color: "var(--danger)" },
  match:  {
    label: "Match",
    bg:     "rgba(255,215,0,0.15)",
    color:  "var(--warning)",
    border: "var(--warning)",
    pulse:  true,
  },
};

const DAY_SHORTS = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

function buildDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  while (s <= e) {
    dates.push(s.toISOString().slice(0, 10));
    s.setDate(s.getDate() + 1);
  }
  return dates;
}

function buildWeeks(dates: string[]): string[][] {
  // Build rows aligned on ISO weeks
  if (dates.length === 0) return [];
  const weeks: string[][] = [];
  let week: string[] = [];

  // Find the weekday of the first date (0=Sun, pad start)
  const firstDay = new Date(dates[0] + "T12:00:00").getDay(); // 0=Sun..6=Sat
  // We display Lu=0..Di=6, so Monday-first
  const paddingCount = (firstDay + 6) % 7; // 0=Mon, 6=Sun
  for (let i = 0; i < paddingCount; i++) week.push("");

  for (const date of dates) {
    week.push(date);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push("");
    weeks.push(week);
  }
  return weeks;
}

export default function TrainingLoadCalendar({
  startDate,
  endDate,
  matchDate,
  value,
  onChange,
  readonly = false,
}: Props) {
  const t = useTranslations("nutrition");

  const dates = buildDateRange(startDate, endDate);
  const weeks = buildWeeks(dates);

  const getLoad = (date: string): TrainingLoad => {
    if (date === matchDate) return "match";
    return value.find((e) => e.date === date)?.load ?? "rest";
  };

  const handleClick = (date: string) => {
    if (readonly || !date) return;
    if (date === matchDate) return; // match day is immutable
    const current = getLoad(date);
    const idx = LOAD_CYCLE.findIndex((l) => l === current);
    const next = LOAD_CYCLE[(idx + 1) % LOAD_CYCLE.length];
    const existing = value.filter((e) => e.date !== date);
    onChange([...existing, { date, load: next }]);
  };

  const weekLabels = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {LOAD_CYCLE.map((load) => {
          const cfg = LOAD_CONFIG[load];
          return (
            <span
              key={load}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                fontSize:   "11px",
                fontWeight: 600,
                background: cfg.bg,
                color:      cfg.color,
                border:     `1px solid ${cfg.border ?? "transparent"}`,
              }}
            >
              {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: "340px" }}>
          {/* Header: day names */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}
          >
            {weekLabels.map((d) => (
              <div
                key={d}
                className="text-center"
                style={{ fontSize: "10px", color: "var(--muted-foreground)", fontWeight: 600 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid mb-1"
              style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}
            >
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} />;
                }

                const load = getLoad(date);
                const cfg  = LOAD_CONFIG[load];
                const isMatch = date === matchDate;
                const dayNum  = new Date(date + "T12:00:00").getDate();

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => handleClick(date)}
                    disabled={readonly || isMatch}
                    title={`${date} — ${cfg.label}`}
                    className={cfg.pulse ? "animate-pulse" : ""}
                    style={{
                      position:     "relative",
                      display:      "flex",
                      flexDirection:"column",
                      alignItems:   "center",
                      justifyContent: "center",
                      padding:      "6px 2px",
                      borderRadius: "8px",
                      background:   cfg.bg,
                      color:        cfg.color,
                      border:       `1px solid ${cfg.border ?? "rgba(255,255,255,0.07)"}`,
                      cursor:       readonly || isMatch ? "default" : "pointer",
                      fontWeight:   isMatch ? 700 : 500,
                      fontSize:     "12px",
                      transition:   "opacity 0.15s",
                      minHeight:    "48px",
                    }}
                  >
                    <span style={{ fontSize: "11px", lineHeight: 1 }}>{dayNum}</span>
                    {isMatch && (
                      <span style={{ fontSize: "10px", marginTop: "2px" }}>⚽</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!readonly && (
        <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "8px" }}>
          {t("calendarClickHint")}
        </p>
      )}
    </div>
  );
}
