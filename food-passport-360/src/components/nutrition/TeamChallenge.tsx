"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Send, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AvatarColor } from "@/lib/supabase/food-passport.types";

interface PlayerRanking {
  player_id: string;
  full_name: string | null;
  avatar_url: string | null;
  avg_score: number;
  streak_days: number;
  points_earned: number;
  avatar_color: AvatarColor;
  delta_vs_yesterday: number;
}

interface Props {
  programId: string;
  currentUserId: string;
  isNutri: boolean;
}

interface BroadcastMessage {
  id: string;
  content: string;
  sent_at: string;
  sender_name: string | null;
}

const AVATAR_COLOR_CSS: Record<
  AvatarColor,
  { bg: string; border: string; text: string }
> = {
  red: {
    bg: "rgba(255,77,106,0.12)",
    border: "rgba(255,77,106,0.30)",
    text: "var(--danger)",
  },
  orange: {
    bg: "rgba(255,140,50,0.12)",
    border: "rgba(255,140,50,0.30)",
    text: "rgba(255,140,50,1)",
  },
  yellow: {
    bg: "rgba(255,215,0,0.12)",
    border: "rgba(255,215,0,0.30)",
    text: "var(--warning)",
  },
  green: {
    bg: "rgba(77,255,180,0.12)",
    border: "rgba(77,255,180,0.30)",
    text: "var(--color-active)",
  },
  blue: {
    bg: "rgba(0,91,172,0.12)",
    border: "rgba(0,91,172,0.30)",
    text: "var(--color-om)",
  },
  gold: {
    bg: "rgba(255,215,0,0.15)",
    border: "rgba(255,215,0,0.50)",
    text: "var(--warning)",
  },
};

const POSITION_BADGE: Record<1 | 2 | 3, { bg: string; text: string; border: string }> = {
  1: { bg: "rgba(255,215,0,0.15)", text: "var(--warning)", border: "rgba(255,215,0,0.60)" },
  2: { bg: "rgba(192,192,192,0.15)", text: "#C0C0C0", border: "rgba(192,192,192,0.50)" },
  3: { bg: "rgba(205,127,50,0.15)", text: "#CD7F32", border: "rgba(205,127,50,0.50)" },
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AvatarBadge({
  player,
  size = "md",
}: {
  player: PlayerRanking;
  size?: "sm" | "md" | "lg";
}) {
  const colors = AVATAR_COLOR_CSS[player.avatar_color];
  const sizeClass =
    size === "lg"
      ? "w-14 h-14 text-lg"
      : size === "sm"
      ? "w-8 h-8 text-xs"
      : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        color: colors.text,
      }}
    >
      {player.avatar_url ? (
        <img
          src={player.avatar_url}
          alt={player.full_name ?? ""}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        getInitials(player.full_name)
      )}
    </div>
  );
}

function RankingCard({
  player,
  position,
  isCurrentUser,
}: {
  player: PlayerRanking;
  position: number;
  isCurrentUser: boolean;
}) {
  const t = useTranslations("nutrition");
  const podiumBadge = position <= 3 ? POSITION_BADGE[position as 1 | 2 | 3] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.05 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: isCurrentUser
          ? "0.5px solid var(--color-active)"
          : "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
        padding: "12px 16px",
      }}
      className="flex items-center gap-3"
    >
      {/* Position */}
      <div className="w-7 flex-shrink-0 text-center">
        {podiumBadge ? (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: podiumBadge.bg,
              color: podiumBadge.text,
              border: `0.5px solid ${podiumBadge.border}`,
            }}
          >
            #{position}
          </span>
        ) : (
          <span className="text-xs opacity-40">#{position}</span>
        )}
      </div>

      <AvatarBadge player={player} size="md" />

      {/* Name + streak */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: isCurrentUser ? "var(--color-active)" : undefined }}
        >
          {player.full_name ?? "—"}
        </p>
        {player.streak_days > 0 && (
          <p className="text-xs opacity-50">
            {t("score.streakBadge", { days: player.streak_days })}
          </p>
        )}
      </div>

      {/* Score + delta */}
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-bold" style={{ color: "var(--color-energy)" }}>
          {Math.round(player.avg_score)}%
        </span>
        <span className="text-xs opacity-40">{player.points_earned} pts</span>
      </div>

      {/* Delta */}
      <div className="w-6 flex-shrink-0 flex justify-center">
        {player.delta_vs_yesterday > 0 ? (
          <TrendingUp className="w-4 h-4" style={{ color: "var(--color-active)" }} />
        ) : player.delta_vs_yesterday < 0 ? (
          <TrendingDown className="w-4 h-4" style={{ color: "var(--danger)" }} />
        ) : (
          <span className="text-xs opacity-30">—</span>
        )}
      </div>
    </motion.div>
  );
}

function PodiumView({
  rankings,
  currentUserId,
  teamAvg,
}: {
  rankings: PlayerRanking[];
  currentUserId: string;
  teamAvg: number;
}) {
  const t = useTranslations("nutrition");
  const top3 = rankings.slice(0, 3);
  const myIndex = rankings.findIndex((r) => r.player_id === currentUserId);
  const myRanking = myIndex >= 0 ? rankings[myIndex] : null;
  const myDelta =
    myRanking ? Math.round(myRanking.avg_score - teamAvg) : null;

  // Reorder for visual podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as PlayerRanking[];
  const podiumHeights = [top3[1] ? "h-20" : "h-0", "h-28", top3[2] ? "h-14" : "h-0"];

  return (
    <div className="space-y-6">
      {/* Podium visuel */}
      <div className="flex items-end justify-center gap-3 pt-4">
        {podiumOrder.map((player, vi) => {
          const realPos = top3.indexOf(player) + 1;
          const height = vi === 1 ? "h-28" : vi === 0 ? "h-20" : "h-14";
          const isMe = player.player_id === currentUserId;
          return (
            <div key={player.player_id} className="flex flex-col items-center gap-2">
              <AvatarBadge player={player} size={vi === 1 ? "lg" : "md"} />
              <p className="text-xs text-center truncate max-w-[80px] opacity-70">
                {player.full_name?.split(" ")[0] ?? "—"}
              </p>
              <div
                className={`${height} w-16 rounded-t-lg flex items-start justify-center pt-1`}
                style={{
                  background:
                    vi === 1
                      ? "rgba(255,215,0,0.15)"
                      : vi === 0
                      ? "rgba(192,192,192,0.12)"
                      : "rgba(205,127,50,0.12)",
                  border: `0.5px solid ${
                    vi === 1
                      ? "rgba(255,215,0,0.40)"
                      : vi === 0
                      ? "rgba(192,192,192,0.30)"
                      : "rgba(205,127,50,0.30)"
                  }`,
                  borderBottom: "none",
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      vi === 1
                        ? "var(--warning)"
                        : vi === 0
                        ? "#C0C0C0"
                        : "#CD7F32",
                  }}
                >
                  #{realPos}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* My position */}
      {myRanking && myIndex >= 3 && (
        <RankingCard
          player={myRanking}
          position={myIndex + 1}
          isCurrentUser={true}
        />
      )}

      {/* vs average */}
      {myDelta !== null && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}
        >
          <span className="text-sm opacity-60">
            {t("challenge.vsAverage")}
          </span>
          <span
            className="text-sm font-semibold"
            style={{
              color: myDelta >= 0 ? "var(--color-active)" : "var(--danger)",
            }}
          >
            {myDelta >= 0 ? "+" : ""}
            {myDelta}% {myDelta >= 0 ? t("challenge.aboveAverage") : t("challenge.belowAverage")}
          </span>
        </div>
      )}
    </div>
  );
}

export default function TeamChallenge({ programId, currentUserId, isNutri }: Props) {
  const t = useTranslations("nutrition");
  const supabase = createClient();

  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [encourageText, setEncourageText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchRankings = useCallback(async () => {
    // Fetch daily_scores for this program, aggregate by player
    const { data: scores } = await supabase
      .from("daily_scores")
      .select("player_id, score_percent, points_earned, streak_days, avatar_color, date")
      .eq("program_id", programId)
      .order("date", { ascending: false });

    if (!scores || scores.length === 0) {
      setRankings([]);
      setLoading(false);
      return;
    }

    // Group by player_id
    const byPlayer: Record<
      string,
      { scores: number[]; points: number; streak: number; color: AvatarColor; dates: string[] }
    > = {};

    for (const row of scores) {
      if (!byPlayer[row.player_id]) {
        byPlayer[row.player_id] = {
          scores: [],
          points: 0,
          streak: row.streak_days ?? 0,
          color: (row.avatar_color as AvatarColor) ?? "green",
          dates: [],
        };
      }
      if (row.score_percent !== null) {
        byPlayer[row.player_id].scores.push(row.score_percent);
      }
      byPlayer[row.player_id].points += row.points_earned ?? 0;
      byPlayer[row.player_id].dates.push(row.date);
    }

    // Fetch profile names
    const playerIds = Object.keys(byPlayer);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", playerIds);

    const profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    }

    // Build rankings
    const built: PlayerRanking[] = playerIds.map((pid) => {
      const data = byPlayer[pid];
      const avgScore =
        data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;

      // delta: compare last two score dates
      const sortedScores = scores
        .filter((s) => s.player_id === pid && s.score_percent !== null)
        .sort((a, b) => b.date.localeCompare(a.date));
      const delta =
        sortedScores.length >= 2
          ? (sortedScores[0].score_percent ?? 0) - (sortedScores[1].score_percent ?? 0)
          : 0;

      return {
        player_id: pid,
        full_name: profileMap[pid]?.full_name ?? null,
        avatar_url: profileMap[pid]?.avatar_url ?? null,
        avg_score: avgScore,
        streak_days: data.streak,
        points_earned: data.points,
        avatar_color: data.color,
        delta_vs_yesterday: delta,
      };
    });

    built.sort((a, b) => b.avg_score - a.avg_score);
    setRankings(built);
    setLoading(false);
  }, [programId]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("broadcast_messages")
      .select("id, content, sent_at, sender_name")
      .eq("program_id", programId)
      .order("sent_at", { ascending: false })
      .limit(5);

    setMessages((data as BroadcastMessage[]) ?? []);
  }, [programId]);

  useEffect(() => {
    fetchRankings();
    fetchMessages();

    const interval = setInterval(() => {
      fetchRankings();
      fetchMessages();
    }, 30000);

    // Realtime subscription on daily_scores
    const channel = supabase
      .channel(`team-challenge-${programId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "food_passport",
          table: "daily_scores",
          filter: `program_id=eq.${programId}`,
        },
        () => fetchRankings()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchRankings, fetchMessages, programId]);

  const handleSendEncouragement = async () => {
    if (!encourageText.trim()) return;
    setSending(true);

    try {
      await fetch("/api/chat/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          content: encourageText.trim(),
          participant_ids: rankings.map((r) => r.player_id),
        }),
      });
      setEncourageText("");
      fetchMessages();
    } finally {
      setSending(false);
    }
  };

  const teamAvg =
    rankings.length > 0
      ? rankings.reduce((sum, r) => sum + r.avg_score, 0) / rankings.length
      : 0;

  const GLASS = {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  } as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-active)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("challenge.title")}</h2>
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(77,255,180,0.10)",
            color: "var(--color-active)",
            border: "0.5px solid rgba(77,255,180,0.25)",
          }}
        >
          <Radio className="w-3 h-3" />
          {t("challenge.live")}
        </span>
      </div>

      {isNutri ? (
        <>
          {/* Nutri view: full ranking list */}
          <div className="space-y-2">
            {rankings.map((player, idx) => (
              <RankingCard
                key={player.player_id}
                player={player}
                position={idx + 1}
                isCurrentUser={player.player_id === currentUserId}
              />
            ))}
          </div>

          {/* Team average */}
          <div
            style={GLASS}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm opacity-60">{t("challenge.avgScore")}</span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-energy)" }}
            >
              {Math.round(teamAvg)}%
            </span>
          </div>

          {/* Encouragement form */}
          <div style={GLASS} className="p-4 space-y-3">
            <p className="text-sm font-medium">{t("challenge.encourage")}</p>
            <textarea
              value={encourageText}
              onChange={(e) => setEncourageText(e.target.value)}
              placeholder={t("challenge.encouragePlaceholder")}
              rows={3}
              className="w-full text-sm bg-transparent resize-none outline-none placeholder-white/30"
              style={{
                border: "0.5px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "inherit",
              }}
            />
            <button
              onClick={handleSendEncouragement}
              disabled={sending || !encourageText.trim()}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-opacity disabled:opacity-40"
              style={{
                background: "var(--color-active)",
                color: "#000",
              }}
            >
              <Send className="w-4 h-4" />
              {sending ? "…" : t("challenge.send")}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Player view: podium + own position */}
          <PodiumView
            rankings={rankings}
            currentUserId={currentUserId}
            teamAvg={teamAvg}
          />

          {/* Full ranking below podium */}
          <div className="space-y-2 mt-2">
            {rankings.slice(3).map((player, idx) => (
              <RankingCard
                key={player.player_id}
                player={player}
                position={idx + 4}
                isCurrentUser={player.player_id === currentUserId}
              />
            ))}
          </div>

          {/* Messages from nutri */}
          {messages.length > 0 && (
            <div style={GLASS} className="p-4 space-y-3">
              <p className="text-sm font-semibold opacity-70">{t("messages")}</p>
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-40 mt-1">
                      {msg.sender_name ?? "Nutritionniste"} ·{" "}
                      {new Date(msg.sent_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
