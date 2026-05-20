"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { URINE_COLORS } from "@/lib/hydration-constants";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HydrationMonitorProps {
  programId: string;
  playerIds: string[];
  dates: string[];
}

interface HydrationLogEntry {
  id: string;
  player_id: string;
  date: string;
  water_type: string;
  quantity_ml: number;
  urine_color: number | null;
  logged_at: string;
}

interface PlayerProfile {
  id: string;
  full_name: string | null;
}

interface DaySummary {
  total_ml: number;
  urine_color: number | null; // worst urine_color logged that day
  hasData: boolean;
}

// playerId → date → DaySummary
type HydrationMatrix = Record<string, Record<string, DaySummary>>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_TARGET_ML = 2500;

/** Returns the percentage of target achieved, capped at 100 for display. */
function pctOfTarget(total_ml: number, target = DEFAULT_TARGET_ML): number {
  return Math.min(100, (total_ml / target) * 100);
}

/**
 * Maps hydration percentage to a CSS variable token matching
 * the AvatarEvolution colour scale:
 *   < 40%   → danger
 *  40–59%  → warning
 *  60–74%  → yellow (--warning at reduced opacity used as amber stand-in)
 *  ≥ 75%   → color-active
 *  ≥ 95%   → gold (--color-om)
 */
function pctToColor(pct: number): string {
  if (pct >= 95) return "var(--color-om)";
  if (pct >= 75) return "var(--color-active)";
  if (pct >= 60) return "var(--warning)";
  if (pct >= 40) return "var(--warning)";
  return "var(--danger)";
}

function pctToBg(pct: number): string {
  if (pct >= 95) return "rgba(255,200,80,0.15)";
  if (pct >= 75) return "rgba(77,255,180,0.12)";
  if (pct >= 60) return "rgba(255,200,80,0.10)";
  if (pct >= 40) return "rgba(255,160,40,0.12)";
  return "rgba(255,80,80,0.12)";
}

function formatDateCol(date: string): string {
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Returns the two most-recent dates from the dates array */
function lastTwoDates(dates: string[]): string[] {
  const sorted = [...dates].sort();
  return sorted.slice(-2);
}

/** True if the player has urine_color ≥ 6 on any of the given dates */
function hasRecentUrineAlert(
  playerId: string,
  matrix: HydrationMatrix,
  recentDates: string[]
): boolean {
  return recentDates.some((d) => {
    const s = matrix[playerId]?.[d];
    return s?.hasData && s.urine_color !== null && s.urine_color >= 6;
  });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td className="px-3 py-2.5">
        <div
          style={{
            height:       "14px",
            width:        "100px",
            borderRadius: "6px",
            background:   "rgba(255,255,255,0.06)",
          }}
        />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-2 py-2.5 text-center">
          <div
            style={{
              height:       "32px",
              width:        "32px",
              borderRadius: "8px",
              background:   "rgba(255,255,255,0.05)",
              margin:       "0 auto",
            }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function HydrationCell({ summary }: { summary: DaySummary | undefined }) {
  const t = useTranslations("hydration");

  if (!summary?.hasData) {
    return (
      <td className="px-2 py-2 text-center">
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>—</span>
      </td>
    );
  }

  const pct = pctOfTarget(summary.total_ml);
  const color = pctToColor(pct);
  const bg = pctToBg(pct);
  const urineAlert = summary.urine_color !== null && summary.urine_color >= 6;

  return (
    <td className="px-2 py-2 text-center">
      <div
        className="relative inline-flex flex-col items-center justify-center"
        style={{
          width:        "40px",
          height:       "40px",
          borderRadius: "10px",
          background:   bg,
          border:       `0.5px solid ${color}40`,
        }}
      >
        {/* ml display */}
        <span style={{ fontSize: "9px", fontWeight: 700, color, lineHeight: 1 }}>
          {summary.total_ml >= 1000
            ? `${(summary.total_ml / 1000).toFixed(1)}L`
            : `${summary.total_ml}`}
        </span>
        {/* pct bar at bottom */}
        <div
          style={{
            position:     "absolute",
            bottom:       "3px",
            left:         "4px",
            right:        "4px",
            height:       "2px",
            borderRadius: "1px",
            background:   "rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width:        `${pct}%`,
              height:       "100%",
              borderRadius: "1px",
              background:   color,
            }}
          />
        </div>

        {/* Urine alert badge */}
        {urineAlert && (
          <span
            title={t("monitor.urineAlert")}
            style={{
              position:     "absolute",
              top:          "-5px",
              right:        "-5px",
              fontSize:     "10px",
              lineHeight:   1,
            }}
          >
            💧
          </span>
        )}
      </div>
    </td>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HydrationMonitor({
  programId: _programId,
  playerIds,
  dates,
}: HydrationMonitorProps) {
  const t = useTranslations("hydration");

  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [matrix, setMatrix] = useState<HydrationMatrix>({});
  const [loading, setLoading] = useState(true);
  const [alertsOnly, setAlertsOnly] = useState(false);

  // ── Fetch profiles (one call, filtered by playerIds) ──────────────────────
  useEffect(() => {
    if (playerIds.length === 0) return;

    // We use the API indirectly — profiles are fetched from Supabase client.
    // To avoid a direct Supabase import in this component we do a lightweight
    // internal GET to the existing profiles endpoint if one exists, otherwise
    // we bootstrap placeholder names and let the hydration data load first.
    const load = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .schema("food_passport")
          .from("profiles")
          .select("id, full_name")
          .in("id", playerIds);
        if (data) setProfiles(data as PlayerProfile[]);
      } catch {
        // fallback: show ids
        setProfiles(playerIds.map((id) => ({ id, full_name: null })));
      }
    };
    load();
  }, [playerIds]);

  // ── Fetch hydration data for all player×date combos ───────────────────────
  const fetchMatrix = useCallback(async () => {
    if (playerIds.length === 0 || dates.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Group by player → fetch all dates for that player in parallel
    const perPlayer = await Promise.all(
      playerIds.map(async (playerId) => {
        const daySummaries = await Promise.all(
          dates.map(async (date) => {
            try {
              const resp = await fetch(
                `/api/nutrition/hydration?date=${date}&player_id=${playerId}`,
                { cache: "no-store" }
              );
              if (!resp.ok) return { date, summary: { total_ml: 0, urine_color: null, hasData: false } };
              const { data } = (await resp.json()) as { data: HydrationLogEntry[] };
              if (!data || data.length === 0) {
                return { date, summary: { total_ml: 0, urine_color: null, hasData: false } };
              }
              const total_ml = data.reduce((sum, e) => sum + (e.quantity_ml ?? 0), 0);
              const worstUrine = data.reduce<number | null>((worst, e) => {
                if (e.urine_color == null) return worst;
                return worst === null ? e.urine_color : Math.max(worst, e.urine_color);
              }, null);
              return { date, summary: { total_ml, urine_color: worstUrine, hasData: true } };
            } catch {
              return { date, summary: { total_ml: 0, urine_color: null, hasData: false } };
            }
          })
        );
        return { playerId, daySummaries };
      })
    );

    const built: HydrationMatrix = {};
    for (const { playerId, daySummaries } of perPlayer) {
      built[playerId] = {};
      for (const { date, summary } of daySummaries) {
        built[playerId][date] = summary;
      }
    }
    setMatrix(built);
    setLoading(false);
  }, [playerIds, dates]);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // ── Derived: team average per date ───────────────────────────────────────
  const teamAvgPerDate: Record<string, number> = {};
  for (const date of dates) {
    const totals = playerIds
      .map((pid) => matrix[pid]?.[date])
      .filter((s): s is DaySummary => !!s?.hasData)
      .map((s) => s.total_ml);
    teamAvgPerDate[date] = totals.length
      ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
      : 0;
  }

  // ── Derived: alert players (urine ≥ 6 on last 2 days) ────────────────────
  const recentDates = lastTwoDates(dates);
  const alertPlayerIds = playerIds.filter((pid) =>
    hasRecentUrineAlert(pid, matrix, recentDates)
  );

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const visiblePlayerIds = alertsOnly ? alertPlayerIds : playerIds;

  const playerName = (id: string) =>
    profiles.find((p) => p.id === id)?.full_name ?? id.slice(0, 8);

  // ─── Render ──────────────────────────────────────────────────────────────

  const glass: React.CSSProperties = {
    background:   "rgba(255,255,255,0.03)",
    border:       "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  };

  return (
    <div style={{ ...glass, overflow: "hidden" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between flex-wrap gap-3 px-4 py-3"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 700 }}>
            {t("monitor.title")}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "2px" }}>
            {playerIds.length} {playerIds.length === 1 ? "joueur" : "joueurs"}
            {alertPlayerIds.length > 0 && (
              <span
                style={{
                  marginLeft:   "8px",
                  fontSize:     "11px",
                  fontWeight:   700,
                  padding:      "1px 7px",
                  borderRadius: "999px",
                  background:   "rgba(255,80,80,0.15)",
                  color:        "var(--danger)",
                  border:       "1px solid rgba(255,80,80,0.3)",
                }}
              >
                ⚠ {alertPlayerIds.length} alerte{alertPlayerIds.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setAlertsOnly((v) => !v)}
          style={{
            padding:      "6px 14px",
            borderRadius: "10px",
            fontSize:     "12px",
            fontWeight:   600,
            cursor:       "pointer",
            background:   alertsOnly ? "rgba(255,80,80,0.12)" : "rgba(255,255,255,0.05)",
            color:        alertsOnly ? "var(--danger)" : "var(--muted-foreground)",
            border:       alertsOnly
              ? "1px solid rgba(255,80,80,0.3)"
              : "0.5px solid rgba(255,255,255,0.1)",
            transition:   "all 0.15s",
          }}
        >
          {t("monitor.alertsOnly")}
        </button>
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width:           "100%",
            borderCollapse:  "collapse",
            tableLayout:     "auto",
            fontSize:        "12px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
              <th
                className="text-left px-3 py-2 sticky left-0"
                style={{
                  fontSize:    "11px",
                  fontWeight:  600,
                  color:       "var(--muted-foreground)",
                  background:  "rgba(10,11,15,0.95)",
                  whiteSpace:  "nowrap",
                  minWidth:    "120px",
                }}
              >
                Joueur
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="text-center px-2 py-2"
                  style={{
                    fontSize:   "11px",
                    fontWeight: 600,
                    color:      "var(--muted-foreground)",
                    whiteSpace: "nowrap",
                    minWidth:   "48px",
                  }}
                >
                  {formatDateCol(date)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: Math.min(playerIds.length || 3, 5) }).map((_, i) => (
                <SkeletonRow key={i} cols={dates.length} />
              ))
            ) : visiblePlayerIds.length === 0 ? (
              <tr>
                <td
                  colSpan={dates.length + 1}
                  className="text-center py-8"
                  style={{ color: "var(--muted-foreground)", fontSize: "13px" }}
                >
                  {t("monitor.noData")}
                </td>
              </tr>
            ) : (
              visiblePlayerIds.map((playerId) => {
                const isAlert = alertPlayerIds.includes(playerId);
                return (
                  <tr
                    key={playerId}
                    style={{
                      borderBottom: "0.5px solid rgba(255,255,255,0.04)",
                      background:   isAlert
                        ? "rgba(255,80,80,0.03)"
                        : "transparent",
                    }}
                  >
                    {/* Player name — sticky left */}
                    <td
                      className="px-3 py-2.5 sticky left-0"
                      style={{
                        background: isAlert
                          ? "rgba(20,10,10,0.95)"
                          : "rgba(10,11,15,0.95)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isAlert && (
                          <span
                            style={{
                              width:        "6px",
                              height:       "6px",
                              borderRadius: "50%",
                              background:   "var(--danger)",
                              flexShrink:   0,
                              display:      "inline-block",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize:  "12px",
                            fontWeight: isAlert ? 600 : 400,
                            color:     isAlert ? "var(--danger)" : "var(--foreground)",
                          }}
                        >
                          {playerName(playerId)}
                        </span>
                      </div>
                    </td>

                    {/* Data cells */}
                    {dates.map((date) => (
                      <HydrationCell
                        key={date}
                        summary={matrix[playerId]?.[date]}
                      />
                    ))}
                  </tr>
                );
              })
            )}

            {/* Team average row */}
            {!loading && visiblePlayerIds.length > 0 && (
              <tr
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <td
                  className="px-3 py-2.5 sticky left-0"
                  style={{
                    background: "rgba(14,15,20,0.97)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize:   "11px",
                      fontWeight: 700,
                      color:      "var(--muted-foreground)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {t("monitor.avgTeam")}
                  </span>
                </td>
                {dates.map((date) => {
                  const avg = teamAvgPerDate[date];
                  if (!avg) {
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>—</span>
                      </td>
                    );
                  }
                  const pct = pctOfTarget(avg);
                  const color = pctToColor(pct);
                  return (
                    <td key={date} className="px-2 py-2 text-center">
                      <span
                        style={{
                          fontSize:   "11px",
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {avg >= 1000
                          ? `${(avg / 1000).toFixed(1)}L`
                          : `${avg}`}
                      </span>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        {[
          { label: "< 40%", color: "var(--danger)" },
          { label: "40–59%", color: "var(--warning)" },
          { label: "60–74%", color: "var(--warning)" },
          { label: "≥ 75%", color: "var(--color-active)" },
          { label: "≥ 95%", color: "var(--color-om)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              style={{
                width:        "8px",
                height:       "8px",
                borderRadius: "2px",
                background:   color,
                flexShrink:   0,
                display:      "inline-block",
              }}
            />
            <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: "10px" }}>💧</span>
          <span style={{ fontSize: "10px", color: "var(--muted-foreground)" }}>
            {t("monitor.urineAlertLegend")}
          </span>
        </div>
      </div>
    </div>
  );
}

// Re-export for convenience
export { URINE_COLORS };
