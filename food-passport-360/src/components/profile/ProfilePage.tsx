"use client";

import { useTranslations } from "next-intl";
import { ProfileHero, LanguagePicker } from "@/components/ui";

interface Props {
  userId: string;
}

export default function ProfilePage({ userId }: Props) {
  const t = useTranslations("profile");

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <ProfileHero />
      <div className="px-4 space-y-4 py-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Language section */}
        <LanguagePicker userId={userId} />
      </div>
    </div>
  );
}
