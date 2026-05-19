"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FPConversationWithPreview } from "@/lib/supabase/food-passport.types";
import { EmptyState } from "@/components/ui";

interface Props {
  currentUserId: string;
  onSelect: (conv: FPConversationWithPreview) => void;
  selectedId?: string;
}

function countUnread(conv: FPConversationWithPreview, userId: string): number {
  if (!conv.last_message) return 0;
  if (conv.last_message.sender_id === userId) return 0;
  return conv.last_message.read_by.includes(userId) ? 0 : 1;
}

export default function ConversationList({ currentUserId, onSelect, selectedId }: Props) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [convs, setConvs] = useState<FPConversationWithPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: raw } = await supabase
        .schema("food_passport" as never)
        .from("conversations")
        .select("*")
        .filter("participant_ids", "cs", `{${currentUserId}}`)
        .order("updated_at", { ascending: false });

      if (!raw) { setLoading(false); return; }

      const results: FPConversationWithPreview[] = [];
      for (const conv of raw) {
        const { data: msgs } = await supabase
          .schema("food_passport" as never)
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const otherIds = (conv.participant_ids as string[]).filter((id: string) => id !== currentUserId);
        let other = null;
        if (otherIds.length > 0) {
          const { data: p } = await supabase
            .schema("food_passport" as never)
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", otherIds[0])
            .single();
          other = p;
        }
        results.push({
          ...conv,
          last_message: msgs?.[0] ?? null,
          other_participant: other as FPConversationWithPreview["other_participant"],
        });
      }
      setConvs(results);
      setLoading(false);
    }
    load();
  }, [currentUserId]);

  function formatTime(iso: string) {
    try {
      const d = new Date(iso);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(d);
      }
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
    } catch { return ""; }
  }

  if (loading) {
    return (
      <div className="space-y-2 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.04)" }}
          />
        ))}
      </div>
    );
  }

  if (convs.length === 0) {
    return (
      <div className="px-4 py-4">
        <EmptyState
          icon={<MessageCircle className="h-6 w-6" />}
          title={t("noConversations")}
          description={t("noConversationsDesc")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 px-4 py-4">
      {convs.map((conv) => {
        const unread = countUnread(conv, currentUserId);
        const isSelected = conv.id === selectedId;
        const name = conv.other_participant?.full_name ?? t("unknownContact");
        const lastMsg = conv.last_message?.content ?? "";

        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
            style={{
              background: isSelected ? "rgba(77,255,180,0.08)" : "rgba(255,255,255,0.03)",
              border: isSelected
                ? "0.5px solid rgba(77,255,180,0.25)"
                : "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "14px",
            }}
          >
            {/* Avatar */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold select-none"
              style={{
                background: isSelected ? "rgba(77,255,180,0.15)" : "rgba(255,255,255,0.06)",
                color: isSelected ? "var(--color-active)" : "var(--muted-foreground)",
              }}
            >
              {(name || "?")[0]?.toUpperCase()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate">{name}</p>
                {conv.last_message && (
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>
                    {formatTime(conv.last_message.created_at)}
                  </span>
                )}
              </div>
              <p
                className="truncate mt-0.5"
                style={{ fontSize: 12, color: unread > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                {lastMsg || t("noMessages")}
              </p>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <span
                className="shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={{
                  minWidth: 18, height: 18, borderRadius: "50%",
                  background: "var(--danger)",
                  color: "white",
                  padding: "0 4px",
                }}
              >
                {unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
