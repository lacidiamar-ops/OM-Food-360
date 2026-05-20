"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Forward } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatWindow from "./ChatWindow";
import ForwardModal from "./ForwardModal";

type ForwardRole = "admin_nutri" | "admin_team_manager";

interface Props {
  conversationId: string;
  currentUserId: string;
  backHref: string;
  senderRole?: ForwardRole;
  hasActiveTrip?: boolean;
}

export default function ConversationPageClient({
  conversationId,
  currentUserId,
  backHref,
  senderRole,
  hasActiveTrip,
}: Props) {
  const t = useTranslations("chat");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientRole, setRecipientRole] = useState<string>("");
  const [lastMessage, setLastMessage] = useState<string | undefined>(undefined);
  const [showForward, setShowForward] = useState(false);

  const canForward = senderRole === "admin_nutri" || senderRole === "admin_team_manager";

  useEffect(() => {
    const supabase = createClient();

    async function loadConversation() {
      const { data: conv } = await supabase
        .schema("food_passport" as never)
        .from("conversations")
        .select("participant_ids")
        .eq("id", conversationId)
        .single();

      if (!conv) return;

      const otherId = (conv as { participant_ids: string[] }).participant_ids.find(
        (id) => id !== currentUserId
      );
      if (!otherId) return;

      const { data: profile } = await supabase
        .schema("food_passport" as never)
        .from("profiles")
        .select("full_name, role")
        .eq("id", otherId)
        .single();

      if (profile) {
        setRecipientName((profile as { full_name: string | null }).full_name ?? t("unknownContact"));
        setRecipientRole((profile as { role: string }).role ?? "");
      }

      // Fetch last message for forward context
      const { data: msgs } = await supabase
        .schema("food_passport" as never)
        .from("messages")
        .select("content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (msgs && msgs.length > 0) {
        setLastMessage((msgs[0] as { content: string }).content);
      }
    }

    loadConversation();
  }, [conversationId, currentUserId, t]);

  return (
    <div className="mx-auto max-w-2xl pb-6 flex flex-col h-[100dvh]">
      {/* Back header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          background: "rgba(7,8,15,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
        }}
      >
        <Link
          href={backHref as never}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Link>
        {recipientName && (
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-semibold truncate">{recipientName}</p>
            {recipientRole && (
              <p className="text-xs text-muted-foreground">{recipientRole}</p>
            )}
          </div>
        )}

        {/* Forward button — nutri + team-manager only */}
        {canForward && (
          <button
            type="button"
            onClick={() => setShowForward(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              borderRadius: "999px",
              background: "rgba(255,255,255,0.06)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "var(--muted-foreground)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
          >
            <Forward size={13} />
            {t("relay")}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow
          conversationId={conversationId}
          currentUserId={currentUserId}
          recipientName={recipientName}
          recipientRole={recipientRole as never}
        />
      </div>

      {/* Forward modal */}
      {showForward && canForward && (
        <ForwardModal
          currentUserId={currentUserId}
          senderRole={senderRole}
          contextMessage={lastMessage}
          hasActiveTrip={hasActiveTrip}
          onClose={() => setShowForward(false)}
          onSent={() => setShowForward(false)}
        />
      )}
    </div>
  );
}
