"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FeedbackForm from "@/components/domain/FeedbackForm";
import type { SupportedLang } from "@/lib/supabase/food-passport.types";

interface Props {
  orderId: string;
  tripId: string | null;
  hotelId: string | null;
  playerLang: SupportedLang;
}

export default function FeedbackSuccessWrapper({ orderId, tripId, hotelId, playerLang }: Props) {
  const t = useTranslations("feedback");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="text-4xl">🎉</span>
        <p className="font-medium">{t("thankYou")}</p>
        <p className="text-sm text-muted-foreground">{t("thankYouDesc")}</p>
      </div>
    );
  }

  return (
    <FeedbackForm
      orderId={orderId}
      tripId={tripId}
      hotelId={hotelId}
      playerLang={playerLang}
      onSuccess={() => setDone(true)}
    />
  );
}
