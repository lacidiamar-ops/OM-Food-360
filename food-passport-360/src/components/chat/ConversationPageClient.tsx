"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import ChatWindow from "./ChatWindow";

interface Props {
  conversationId: string;
  currentUserId: string;
  backHref: string;
}

export default function ConversationPageClient({ conversationId, currentUserId, backHref }: Props) {
  const t = useTranslations("chat");
  const [recipientName, setRecipientName] = useState<string>("");
  const [recipientRole, setRecipientRole] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();

    async function loadConversation() {
      const { data: conv } = await supabase
        .schema("food_passport")
        .from("conversations")
        .select("participant_ids")
        .eq("id", conversationId)
        .single();

      if (!conv) return;

      const otherId = conv.participant_ids.find((id: string) => id !== currentUserId);
      if (!otherId) return;

      const { data: profile } = await supabase
        .schema("food_passport")
        .from("profiles")
        .select("full_name, role")
        .eq("id", otherId)
        .single();

      if (profile) {
        setRecipientName(profile.full_name ?? t("unknownContact"));
        setRecipientRole(profile.role ?? "");
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
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow
          conversationId={conversationId}
          currentUserId={currentUserId}
          recipientName={recipientName}
          recipientRole={recipientRole as never}
        />
      </div>
    </div>
  );
}
