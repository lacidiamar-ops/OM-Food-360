"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronDown, ChevronUp, Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WATER_SOURCES, URINE_COLORS, type WaterSourceKey } from "@/lib/hydration-constants";

interface HydrationTrackerProps {
  playerId: string;
  date: string; // YYYY-MM-DD
  dayType: string;
  targetFlatMl?: number;
  targetStYorreMl?: number;
  targetIsotonicMl?: number;
  prescribedIsotonicBrand?: string; // 'powerbar' | 'apurna' | 'sislab_electrolyte'
}

interface HydrationLog {
  id: string;
  water_type: string;
  quantity_ml: number;
  urine_color?: number | null;
  logged_at: string;
  context?: string | null;
}

interface SourceTotals {
  flat_ml: number;
  st_yorre_ml: number;
  isotonic_ml: number;
  sislab_rego_ml: number;
}

// ── Ring SVG ──────────────────────────────────────────────────────────────────
function ProgressRing({
  percent,
  size = 80,
}: {
  percent: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(percent, 100) / 100;
  const strokeDashoffset = circumference * (1 - filled);

  let ringColor = "var(--danger)";
  if (percent >= 100) ringColor = "var(--warning)";
  else if (percent >= 75) ringColor = "var(--color-active)";
  else if (percent >= 60) ringColor = "#d4b700"; // yellow — acceptable as a ring color derived from token semantics
  else if (percent >= 40) ringColor = "var(--warning)";

  const isPulsing = percent >= 100;

  return (
    <svg
      width={size}
      height={size}
      style={isPulsing ? { animation: "pulse 1.5s ease-in-out infinite" } : undefined}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: 13,
          fontWeight: 700,
          fill: "var(--foreground)",
        }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

// ── Source card ───────────────────────────────────────────────────────────────
interface SourceCardProps {
  sourceKey: WaterSourceKey;
  consumed: number;
  target: number;
  dayType: string;
  onAdd: (sourceKey: WaterSourceKey, ml: number) => void;
  t: ReturnType<typeof useTranslations<"hydration">>;
}

function SourceCard({ sourceKey, consumed, target, dayType, onAdd, t }: SourceCardProps) {
  const source = WATER_SOURCES[sourceKey];
  const percent = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;

  const isStYorrej1 = sourceKey === "st_yorre" && dayType === "j-1";
  const isSislabRegoMatch = sourceKey === "sislab_rego" && dayType === "match";

  return (
    <div
      style={{
        minWidth: 160,
        width: 160,
        flexShrink: 0,
        background: isSislabRegoMatch
          ? "rgba(var(--color-active-rgb, 74,222,128), 0.08)"
          : "rgba(255,255,255,0.03)",
        border: isStYorrej1
          ? `1.5px solid var(--warning)`
          : isSislabRegoMatch
          ? `1.5px solid var(--color-active)`
          : "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 20 }}>{source.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--foreground)",
            lineHeight: 1.2,
            flex: 1,
          }}
        >
          {t(`sources.${sourceKey}` as Parameters<typeof t>[0])}
        </span>
        {isStYorrej1 && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--warning)",
              background: "rgba(255,200,0,0.1)",
              border: "1px solid var(--warning)",
              borderRadius: 4,
              padding: "1px 4px",
            }}
          >
            ×4
          </span>
        )}
      </div>

      {/* Consumed / target */}
      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
        <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{consumed}</span>
        {" / "}
        {target > 0 ? `${target} ml` : "— ml"}
      </div>

      {/* Progress bar */}
      {target > 0 && (
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: source.color,
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}

      {/* Quick-add buttons */}
      <div style={{ display: "flex", gap: 4 }}>
        {[50, 100, 250].map((ml) => (
          <button
            key={ml}
            onClick={() => onAdd(sourceKey, ml)}
            style={{
              flex: 1,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--foreground)",
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "5px 2px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            +{ml}
          </button>
        ))}
      </div>

      {/* Contextual reminders */}
      {isStYorrej1 && (
        <p style={{ fontSize: 10, color: "var(--warning)", margin: 0, lineHeight: 1.3 }}>
          {t("stYorreReminder")}
        </p>
      )}
      {isSislabRegoMatch && (
        <p style={{ fontSize: 10, color: "var(--color-active)", margin: 0, lineHeight: 1.3 }}>
          {t("regoReminder")}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HydrationTracker({
  playerId,
  date,
  dayType,
  targetFlatMl = 2500,
  targetStYorreMl = 0,
  targetIsotonicMl = 0,
  prescribedIsotonicBrand,
}: HydrationTrackerProps) {
  const t = useTranslations("hydration");

  // ── State ──
  const [totals, setTotals] = useState<SourceTotals>({
    flat_ml: 0,
    st_yorre_ml: 0,
    isotonic_ml: 0,
    sislab_rego_ml: 0,
  });
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [selectedUrineLevel, setSelectedUrineLevel] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // ── Computed totals ──
  const totalConsumed =
    totals.flat_ml + totals.st_yorre_ml + totals.isotonic_ml + totals.sislab_rego_ml;
  const totalTarget = targetFlatMl + targetStYorreMl + targetIsotonicMl;
  const overallPercent = totalTarget > 0 ? (totalConsumed / totalTarget) * 100 : 0;

  // Determine isotonic source key
  const isotonicKey: WaterSourceKey =
    prescribedIsotonicBrand === "apurna"
      ? "isotonic_apurna"
      : prescribedIsotonicBrand === "sislab_electrolyte"
      ? "sislab_electrolyte"
      : "isotonic_powerbar";

  // ── Fetch existing logs ──
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/nutrition/hydration?date=${date}&player_id=${playerId}`
      );
      if (!res.ok) return;
      const data: HydrationLog[] = await res.json();
      setLogs(data);
      // Recompute totals
      const newTotals: SourceTotals = {
        flat_ml: 0,
        st_yorre_ml: 0,
        isotonic_ml: 0,
        sislab_rego_ml: 0,
      };
      for (const log of data) {
        if (log.quantity_ml <= 0) continue;
        switch (log.water_type) {
          case "flat":
            newTotals.flat_ml += log.quantity_ml;
            break;
          case "st_yorre":
            newTotals.st_yorre_ml += log.quantity_ml;
            break;
          case "isotonic_powerbar":
          case "isotonic_apurna":
          case "sislab_electrolyte":
            newTotals.isotonic_ml += log.quantity_ml;
            break;
          case "sislab_rego":
            newTotals.sislab_rego_ml += log.quantity_ml;
            break;
        }
      }
      setTotals(newTotals);
      // Restore last urine color
      const lastUrine = [...data]
        .reverse()
        .find((l) => l.urine_color != null);
      if (lastUrine?.urine_color) {
        setSelectedUrineLevel(lastUrine.urine_color);
      }
    } catch {
      // Silently fail
    }
  }, [date, playerId]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // ── Realtime subscription ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`hydration-${playerId}-${date}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "food_passport",
          table: "hydration_log",
          filter: `player_id=eq.${playerId}`,
        },
        (payload) => {
          const newLog = payload.new as HydrationLog;
          // Only include if same date
          const logDate = newLog.logged_at?.slice(0, 10);
          if (logDate !== date) return;
          setLogs((prev) => [...prev, newLog]);
          if (newLog.quantity_ml > 0) {
            setTotals((prev) => {
              const next = { ...prev };
              switch (newLog.water_type) {
                case "flat":
                  next.flat_ml += newLog.quantity_ml;
                  break;
                case "st_yorre":
                  next.st_yorre_ml += newLog.quantity_ml;
                  break;
                case "isotonic_powerbar":
                case "isotonic_apurna":
                case "sislab_electrolyte":
                  next.isotonic_ml += newLog.quantity_ml;
                  break;
                case "sislab_rego":
                  next.sislab_rego_ml += newLog.quantity_ml;
                  break;
              }
              return next;
            });
          }
          if (newLog.urine_color) {
            setSelectedUrineLevel(newLog.urine_color);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [playerId, date]);

  // ── Handlers ──
  const handleAdd = useCallback(
    async (sourceKey: WaterSourceKey, ml: number) => {
      // Optimistic update
      setTotals((prev) => {
        const next = { ...prev };
        switch (sourceKey) {
          case "flat":
            next.flat_ml += ml;
            break;
          case "st_yorre":
            next.st_yorre_ml += ml;
            break;
          case "isotonic_powerbar":
          case "isotonic_apurna":
          case "sislab_electrolyte":
            next.isotonic_ml += ml;
            break;
          case "sislab_rego":
            next.sislab_rego_ml += ml;
            break;
        }
        return next;
      });

      const optimisticLog: HydrationLog = {
        id: `optimistic-${Date.now()}`,
        water_type: sourceKey,
        quantity_ml: ml,
        logged_at: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, optimisticLog]);

      try {
        await fetch("/api/nutrition/hydration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: playerId,
            date,
            water_type: sourceKey,
            quantity_ml: ml,
          }),
        });
      } catch {
        // Silently fail — optimistic state stays
      }
    },
    [playerId, date]
  );

  const handleUrineColor = useCallback(
    async (level: number) => {
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectedUrineLevel(level);

      try {
        await fetch("/api/nutrition/hydration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: playerId,
            date,
            water_type: "flat",
            quantity_ml: 0,
            urine_color: level,
          }),
        });
      } catch {
        // Silently fail
      }
    },
    [playerId, date]
  );

  // ── Urine feedback message ──
  const urineFeedback = (() => {
    if (!selectedUrineLevel) return null;
    if (selectedUrineLevel <= 3)
      return { msg: t("urineOk"), color: "var(--color-active)", icon: null };
    if (selectedUrineLevel <= 5)
      return { msg: t("urineDrinkMore"), color: "var(--warning)", icon: null };
    if (selectedUrineLevel <= 7)
      return {
        msg: t("urineAlert"),
        color: "var(--danger)",
        icon: <AlertTriangle size={14} />,
      };
    return {
      msg: t("urineEmergency"),
      color: "var(--danger)",
      icon: <AlertTriangle size={14} />,
      shake: true,
    };
  })();

  // ── Determine which sources to show ──
  const showIsotonic =
    targetIsotonicMl > 0 || dayType === "match" || dayType === "j-1";
  const showSislabRego = dayType === "match";

  // ── History helpers ──
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const logsWithQty = logs.filter((l) => l.quantity_ml > 0);

  return (
    <section
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Title + total */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <Droplets size={18} style={{ color: "var(--color-om)" }} />
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--foreground)",
                  margin: 0,
                }}
              >
                {t("title")}
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
              {t("total")} :{" "}
              <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                {totalConsumed} ml
              </span>{" "}
              / {totalTarget} ml
            </p>
          </div>

          {/* Ring */}
          <ProgressRing percent={overallPercent} size={80} />
        </div>

        {/* Contextual badge */}
        {dayType === "j-1" && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(255,180,0,0.08)",
              border: "1px solid var(--warning)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--warning)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            {t("jourAvantMatch")}
          </div>
        )}
        {dayType === "match" && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              background: "rgba(220,50,50,0.08)",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--danger)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            {t("jourMatch")}
          </div>
        )}
      </div>

      {/* ── Source cards (horizontal scroll) ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "0 16px 16px",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Eau plate */}
        <SourceCard
          sourceKey="flat"
          consumed={totals.flat_ml}
          target={targetFlatMl}
          dayType={dayType}
          onAdd={handleAdd}
          t={t}
        />

        {/* St. Yorre */}
        {(targetStYorreMl > 0 || dayType === "j-1" || dayType === "match" || dayType === "j+1") && (
          <SourceCard
            sourceKey="st_yorre"
            consumed={totals.st_yorre_ml}
            target={targetStYorreMl}
            dayType={dayType}
            onAdd={handleAdd}
            t={t}
          />
        )}

        {/* Isotonic */}
        {showIsotonic && (
          <SourceCard
            sourceKey={isotonicKey}
            consumed={totals.isotonic_ml}
            target={targetIsotonicMl}
            dayType={dayType}
            onAdd={handleAdd}
            t={t}
          />
        )}

        {/* SiSLab REGO */}
        {showSislabRego && (
          <SourceCard
            sourceKey="sislab_rego"
            consumed={totals.sislab_rego_ml}
            target={400}
            dayType={dayType}
            onAdd={handleAdd}
            t={t}
          />
        )}
      </div>

      {/* ── Urine color section ── */}
      <div
        style={{
          padding: "16px",
          borderTop: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--foreground)",
            margin: "0 0 4px",
          }}
        >
          {t("urineColor")}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            margin: "0 0 12px",
          }}
        >
          {t("urineColorDesc")}
        </p>

        {/* 4×2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {URINE_COLORS.map((urine) => (
            <button
              key={urine.level}
              onClick={() => handleUrineColor(urine.level)}
              title={urine.label}
              style={{
                width: "100%",
                aspectRatio: "1",
                borderRadius: 12,
                border:
                  selectedUrineLevel === urine.level
                    ? "2.5px solid var(--foreground)"
                    : "1.5px solid rgba(255,255,255,0.12)",
                background: urine.color, // biological color — data constant
                cursor: "pointer",
                transition: "transform 0.15s, border 0.15s",
                transform: selectedUrineLevel === urine.level ? "scale(1.1)" : "scale(1)",
              }}
              aria-label={urine.label}
              aria-pressed={selectedUrineLevel === urine.level}
            />
          ))}
        </div>

        {/* Feedback message */}
        {urineFeedback && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              color: urineFeedback.color,
              fontSize: 13,
              fontWeight: 600,
              animation: (urineFeedback as { shake?: boolean }).shake
                ? "shake 0.4s ease-in-out"
                : undefined,
            }}
          >
            {urineFeedback.icon}
            <span>{urineFeedback.msg}</span>
          </div>
        )}
      </div>

      {/* ── History section ── */}
      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--muted-foreground)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{t("history")}</span>
          {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {historyOpen && (
          <div style={{ padding: "0 16px 16px" }}>
            {logsWithQty.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted-foreground)",
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                {t("noLogs")}
              </p>
            ) : (
              <>
                {/* Log list */}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}
                >
                  {logsWithQty.map((log) => {
                    const src =
                      WATER_SOURCES[log.water_type as WaterSourceKey] ?? WATER_SOURCES.flat;
                    return (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <span style={{ fontVariantNumeric: "tabular-nums", minWidth: 40 }}>
                          {formatTime(log.logged_at)}
                        </span>
                        <span style={{ fontSize: 16 }}>{src.icon}</span>
                        <span style={{ flex: 1, color: "var(--foreground)" }}>
                          +{log.quantity_ml} ml
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Per-source totals */}
                <div
                  style={{
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {(
                    [
                      ["flat", totals.flat_ml],
                      ["st_yorre", totals.st_yorre_ml],
                      [isotonicKey, totals.isotonic_ml],
                      ...(showSislabRego ? ([["sislab_rego", totals.sislab_rego_ml]] as const) : []),
                    ] as [WaterSourceKey, number][]
                  )
                    .filter(([, v]) => v > 0)
                    .map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "var(--muted-foreground)",
                        }}
                      >
                        <span>
                          {WATER_SOURCES[key]?.icon}{" "}
                          {t(`sources.${key}` as Parameters<typeof t>[0])}
                        </span>
                        <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
                          {val} ml
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
