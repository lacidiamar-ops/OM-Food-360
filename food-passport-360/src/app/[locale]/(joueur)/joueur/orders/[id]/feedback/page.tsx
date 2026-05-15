import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderWithItems, getPlayerByProfileId, getMyFeedbackForOrder } from "@/lib/supabase/queries";
import FeedbackSuccessWrapper from "./FeedbackSuccessWrapper";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";
import { MessageCircle } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerOrderFeedbackPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("feedback");
  const locale = (await getLocale()) as SupportedLang;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const player = await getPlayerByProfileId(supabase, user.id);
  if (!player) notFound();

  const data = await getOrderWithItems(supabase, id, locale);
  if (!data || data.order.player_id !== player.id) notFound();

  const order = data.order;
  const existing = await getMyFeedbackForOrder(supabase, id);

  if (order.status !== "livree") {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold">{t("pageTitle")}</h1>
        <div className="rounded-2xl border border-border bg-muted/30 p-4 flex gap-3 items-start">
          <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("notDeliveredYet")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-12">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">{t("pageTitle")}</h1>
        <p className="text-sm text-muted-foreground font-mono">{order.reference}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5">
        {existing ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-4xl">✅</span>
            <p className="font-medium">{t("alreadySubmitted")}</p>
          </div>
        ) : (
          <FeedbackSuccessWrapper
            orderId={id}
            tripId={order.trip_id}
            hotelId={order.hotel_id}
            playerLang={player.preferred_lang}
          />
        )}
      </div>
    </div>
  );
}
