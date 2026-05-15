import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByProfileId, getOnboardingForm } from "@/lib/supabase/queries";
import PlayerPassportView from "@/components/domain/PlayerPassportView";

export async function generateMetadata() {
  const t = await getTranslations("passport");
  return { title: t("title") };
}

export default async function JoueurPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const [player, form] = await Promise.all([
    getPlayerByProfileId(supabase, user.id),
    // form fetched after we have player id
    getPlayerByProfileId(supabase, user.id).then((p) =>
      p ? getOnboardingForm(supabase, p.id) : null
    ),
  ]);

  return <PlayerPassportView player={player} form={form} />;
}
