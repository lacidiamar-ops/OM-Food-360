import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import ConversationPageClient from "@/components/chat/ConversationPageClient";

export async function generateMetadata() {
  const t = await getTranslations("chat");
  return { title: t("messages") };
}

export default async function CuisineConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  return (
    <ConversationPageClient
      conversationId={id}
      currentUserId={user.id}
      backHref="/cuisine/messages"
    />
  );
}
