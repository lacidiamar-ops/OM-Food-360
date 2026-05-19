import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import MessagesClient from "@/components/chat/MessagesClient";

export async function generateMetadata() {
  const t = await getTranslations("chat");
  return { title: t("conversations") };
}

export default async function JoueurMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  return <MessagesClient currentUserId={user.id} basePath="/joueur/messages" />;
}
