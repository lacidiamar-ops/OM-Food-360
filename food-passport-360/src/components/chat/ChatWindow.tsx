"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send, X, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FPMessage } from "@/lib/supabase/food-passport.types";
import { StatusBadge } from "@/components/ui";
import type { UserRole } from "@/lib/rbac/types";

function useChatRealtime(conversationId: string, onNew: (m: FPMessage) => void) {
  const stableOnNew = useCallback(onNew, []);
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`chat:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "food_passport",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (p) => stableOnNew(p.new as FPMessage))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, stableOnNew]);
}

function roleToStatusBadge(role: string) {
  const MAP: Record<string, "info" | "processing" | "validated" | "pending" | "urgent"> = {
    admin_nutri: "validated",
    admin_team_manager: "info",
    cuisine: "processing",
    hotel: "info",
    joueur: "pending",
    super_admin: "urgent",
  };
  return MAP[role] ?? "info";
}

interface TranslationState {
  translating: boolean;
  translated: string | null;
  showOriginal: boolean;
  fromLang: string;
}

interface Props {
  conversationId: string;
  currentUserId: string;
  recipientName: string;
  recipientRole: string;
  onClose?: () => void;
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  recipientName,
  recipientRole,
  onClose,
}: Props) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [messages, setMessages] = useState<FPMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserLang, setCurrentUserLang] = useState<string>(locale);
  const [recipientLang, setRecipientLang] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, TranslationState>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load current user's preferred language
  useEffect(() => {
    const supabase = createClient();
    supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("preferred_language")
      .eq("id", currentUserId)
      .single()
      .then(({ data }) => {
        if (data && (data as { preferred_language: string }).preferred_language) {
          setCurrentUserLang((data as { preferred_language: string }).preferred_language);
        }
      });
  }, [currentUserId]);

  // Load recipient's preferred language
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();
    supabase
      .schema("food_passport" as never)
      .from("conversations")
      .select("participant_ids")
      .eq("id", conversationId)
      .single()
      .then(({ data: conv }) => {
        if (!conv) return;
        const otherId = (conv as { participant_ids: string[] }).participant_ids.find(
          (id) => id !== currentUserId
        );
        if (!otherId) return;
        return supabase
          .schema("food_passport" as never)
          .from("profiles")
          .select("preferred_language")
          .eq("id", otherId)
          .single();
      })
      .then((res) => {
        if (res?.data) {
          setRecipientLang((res.data as { preferred_language: string }).preferred_language ?? null);
        }
      });
  }, [conversationId, currentUserId]);

  // Translate a single message if needed
  const translateIfNeeded = useCallback(
    async (msg: FPMessage) => {
      if (msg.sender_id === currentUserId) return;
      const senderLang = (msg as FPMessage & { sender_language?: string }).sender_language ?? "fr";
      if (senderLang === currentUserLang) return;

      setTranslations((prev) => ({
        ...prev,
        [msg.id]: { translating: true, translated: null, showOriginal: false, fromLang: senderLang },
      }));

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: msg.id,
            content: msg.content,
            fromLang: senderLang,
            toLang: currentUserLang,
          }),
        });
        if (res.ok) {
          const { translated } = await res.json();
          setTranslations((prev) => ({
            ...prev,
            [msg.id]: {
              translating: false,
              translated: translated !== msg.content ? translated : null,
              showOriginal: false,
              fromLang: senderLang,
            },
          }));
        } else {
          setTranslations((prev) => ({
            ...prev,
            [msg.id]: { ...prev[msg.id], translating: false },
          }));
        }
      } catch {
        setTranslations((prev) => ({
          ...prev,
          [msg.id]: { ...prev[msg.id], translating: false },
        }));
      }
    },
    [currentUserId, currentUserLang]
  );

  // Initial fetch
  useEffect(() => {
    const supabase = createClient();
    supabase
      .schema("food_passport" as never)
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          const msgs = data as FPMessage[];
          setMessages(msgs);
          msgs.forEach(translateIfNeeded);
        }
      });
  }, [conversationId, translateIfNeeded]);

  // Realtime
  useChatRealtime(conversationId, (msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    translateIfNeeded(msg);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    const supabase = createClient();
    const { data: newMsg } = await supabase
      .schema("food_passport" as never)
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content,
        sender_language: currentUserLang,
      })
      .select()
      .single();
    if (newMsg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === (newMsg as FPMessage).id)) return prev;
        return [...prev, newMsg as FPMessage];
      });
    }
    await supabase
      .schema("food_passport" as never)
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    setSending(false);
  }

  function formatTime(iso: string) {
    try {
      return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
    } catch { return ""; }
  }

  const LANG_NAMES: Record<string, string> = {
    fr: "français", en: "English", es: "español",
    pt: "português", ar: "العربية", de: "Deutsch",
  };

  const autoTranslateActive =
    recipientLang !== null && recipientLang !== currentUserLang;

  function toggleOriginal(id: string) {
    setTranslations((prev) => ({
      ...prev,
      [id]: { ...prev[id], showOriginal: !prev[id]?.showOriginal },
    }));
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "100%", maxHeight: "calc(100dvh - 120px)", minHeight: 300 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold select-none"
            style={{ background: "rgba(77,255,180,0.10)", color: "var(--color-active)" }}
          >
            {(recipientName || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{recipientName}</p>
            {autoTranslateActive && (
              <p
                className="flex items-center gap-1"
                style={{ fontSize: 10, color: "var(--color-active)" }}
              >
                <Globe size={10} />
                {t("autoTranslateActive")}
              </p>
            )}
          </div>
          <StatusBadge status={roleToStatusBadge(recipientRole)} />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">{t("noMessages")}</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId;
          const ts = translations[msg.id];
          const displayContent =
            ts && !ts.showOriginal && ts.translated ? ts.translated : msg.content;
          const isTranslating = ts?.translating ?? false;

          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div style={{ maxWidth: "75%" }}>
                <div
                  className="px-3 py-2 text-sm"
                  style={{
                    borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isTranslating
                      ? "rgba(255,255,255,0.04)"
                      : isOwn
                      ? "rgba(77,255,180,0.12)"
                      : "rgba(255,255,255,0.05)",
                    color: isOwn ? "var(--color-active)" : "var(--foreground)",
                    border: isOwn
                      ? "0.5px solid rgba(77,255,180,0.20)"
                      : "0.5px solid rgba(255,255,255,0.08)",
                    transition: "background 0.2s",
                  }}
                >
                  {isTranslating ? (
                    <span
                      className="inline-block"
                      style={{
                        background: "linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.4s infinite",
                        borderRadius: 6,
                        width: "80px",
                        height: "1em",
                        display: "inline-block",
                        verticalAlign: "middle",
                      }}
                    />
                  ) : (
                    displayContent
                  )}
                </div>

                {/* Translation toggle */}
                {!isOwn && ts?.translated && !isTranslating && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleOriginal(msg.id)}
                      className="flex items-center gap-1 mt-0.5"
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                        cursor: "pointer",
                        background: "none",
                        border: "none",
                        padding: 0,
                        textAlign: isOwn ? "right" : "left",
                      }}
                    >
                      <Globe size={9} />
                      {t("translatedFrom", { lang: LANG_NAMES[ts.fromLang] ?? ts.fromLang })}
                      {" · "}
                      {ts.showOriginal ? t("hideOriginal") : t("showOriginal")}
                    </button>
                    {ts.showOriginal && (
                      <p
                        className="mt-1 px-2"
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.50)",
                          fontStyle: "italic",
                          borderLeft: "2px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        {msg.content}
                      </p>
                    )}
                  </div>
                )}

                <p
                  className={`mt-0.5 ${isOwn ? "text-right" : "text-left"}`}
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}
                >
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 flex items-end gap-2 px-3 py-2"
        style={{
          borderTop: "0.5px solid rgba(255,255,255,0.07)",
          background: "rgba(7,8,15,0.80)",
          backdropFilter: "blur(8px)",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("inputPlaceholder")}
          rows={1}
          className="flex-1 resize-none text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.10)",
            borderRadius: "12px",
            color: "var(--foreground)",
            padding: "8px 12px",
            lineHeight: 1.5,
            overflow: "hidden",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 flex items-center justify-center disabled:opacity-40 transition-colors"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: input.trim() ? "var(--color-active)" : "rgba(255,255,255,0.08)",
            color: input.trim() ? "#07080f" : "var(--muted-foreground)",
          }}
          aria-label={tc("send")}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
