"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ProfileHero } from "@/components/ui";
import ConversationList from "./ConversationList";
import JoueurContactPicker from "./JoueurContactPicker";
import type { FPConversationWithPreview } from "@/lib/supabase/food-passport.types";
import type { UserRole } from "@/lib/rbac/types";

interface Props {
  currentUserId: string;
  basePath: string;
  role?: UserRole;
}

export default function MessagesClient({ currentUserId, basePath, role }: Props) {
  const t = useTranslations("chat");
  const router = useRouter();

  // Joueur sees a fixed contact picker (Team Manager + Nutritionniste)
  if (role === "joueur") {
    return (
      <JoueurContactPicker currentUserId={currentUserId} basePath={basePath} />
    );
  }

  function handleSelect(conv: FPConversationWithPreview) {
    router.push(`${basePath}/${conv.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <ProfileHero />
      <div className="px-4 space-y-4 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t("conversations")}</h1>
          <p className="text-sm text-muted-foreground">{t("conversationsDesc")}</p>
        </div>
        <ConversationList
          currentUserId={currentUserId}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
