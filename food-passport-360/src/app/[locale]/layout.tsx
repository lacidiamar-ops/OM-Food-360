import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import PushNotificationProvider from "@/components/pwa/PushNotificationProvider";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "FOOD PASSPORT 360",
    template: "%s · FOOD PASSPORT 360",
  },
  description:
    "Interface alimentaire performance joueur — nutrition, restauration, hôtel.",
};

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="dark h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <PushNotificationProvider userId={user?.id ?? null} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
