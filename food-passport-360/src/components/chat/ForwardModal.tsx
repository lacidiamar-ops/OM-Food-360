"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Building2, Hotel, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  currentUserId: string;
  senderRole: "admin_nutri" | "admin_team_manager";
  contextMessage?: string;
  hasActiveTrip?: boolean;
  onClose: () => void;
  onSent: () => void;
}

type Target = "cuisine" | "hotel";

export default function ForwardModal({ currentUserId, senderRole, contextMessage, hasActiveTrip, onClose, onSent }: Props) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const [target, setTarget] = useState<Target | null>(null);
  const [message, setMessage] = useState(contextMessage ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CONV_TYPE: Record<Target, string> = {
    cuisine: senderRole === "admin_nutri" ? "nutri_cuisine" : "manager_cuisine",
    hotel:   senderRole === "admin_nutri" ? "nutri_hotel"   : "manager_hotel",
  };

  async function handleSend() {
    if (!target || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();

      // Find all users with the target role
      const { data: targets } = await supabase
        .schema("food_passport" as never)
        .from("profiles")
        .select("id")
        .eq("role", target);

      const targetIds = (targets ?? []).map((p: { id: string }) => p.id);
      if (targetIds.length === 0) {
        setError(t("noRecipientFound"));
        setSending(false);
        return;
      }

      const participantIds = [currentUserId, ...targetIds];

      // Get or create conversation
      const { data: existConvs } = await supabase
        .schema("food_passport" as never)
        .from("conversations")
        .select("id")
        .eq("type", CONV_TYPE[target])
        .filter("participant_ids", "cs", `{${currentUserId}}`)
        .limit(1);

      let conversationId: string;

      if (existConvs && existConvs.length > 0) {
        conversationId = (existConvs[0] as { id: string }).id;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .schema("food_passport" as never)
          .from("conversations")
          .insert({ type: CONV_TYPE[target], participant_ids: participantIds })
          .select("id")
          .single();
        if (convErr || !newConv) throw new Error(convErr?.message ?? "Failed to create conversation");
        conversationId = (newConv as { id: string }).id;
      }

      // Send message
      const { error: msgErr } = await supabase
        .schema("food_passport" as never)
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: currentUserId, content: message.trim() });

      if (msgErr) throw new Error(msgErr.message);

      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sendError"));
    } finally {
      setSending(false);
    }
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
          <h2 className="font-semibold text-base">{t("forwardTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Target selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTarget("cuisine")}
            className="flex flex-col items-center gap-1.5 py-4 transition-all"
            style={{
              borderRadius: "16px",
              background: target === "cuisine" ? "rgba(0,91,172,0.12)" : "rgba(255,255,255,0.03)",
              border: target === "cuisine"
                ? "0.5px solid rgba(0,91,172,0.40)"
                : "0.5px solid rgba(255,255,255,0.07)",
            }}
          >
            <Building2 size={24} style={{ color: target === "cuisine" ? "var(--color-om)" : "var(--muted-foreground)" }} />
            <span className="text-xs font-medium" style={{ color: target === "cuisine" ? "var(--color-om)" : "var(--muted-foreground)" }}>
              {t("targetCuisine")}
            </span>
          </button>

          {hasActiveTrip !== false && (
            <button
              type="button"
              onClick={() => setTarget("hotel")}
              className="flex flex-col items-center gap-1.5 py-4 transition-all"
              style={{
                borderRadius: "16px",
                background: target === "hotel" ? "rgba(77,255,180,0.08)" : "rgba(255,255,255,0.03)",
                border: target === "hotel"
                  ? "0.5px solid rgba(77,255,180,0.25)"
                  : "0.5px solid rgba(255,255,255,0.07)",
              }}
            >
              <Hotel size={24} style={{ color: target === "hotel" ? "var(--color-active)" : "var(--muted-foreground)" }} />
              <span className="text-xs font-medium" style={{ color: target === "hotel" ? "var(--color-active)" : "var(--muted-foreground)" }}>
                {t("targetHotel")}
              </span>
            </button>
          )}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full resize-none text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            color: "var(--foreground)",
            padding: "10px 12px",
          }}
          placeholder={t("messagePlaceholder")}
        />

        {error && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!target || !message.trim() || sending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 font-semibold disabled:opacity-40"
          style={{ borderRadius: "14px" }}
        >
          <Send size={16} />
          {sending ? tc("sending") : tc("send")}
        </button>
      </div>
    </div>
  );
}
