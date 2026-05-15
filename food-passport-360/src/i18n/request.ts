import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const localeMessages = (await import(`../../messages/${locale}.json`)).default;
  const frMessages =
    locale === "fr"
      ? localeMessages
      : (await import("../../messages/fr.json")).default;

  return {
    locale,
    messages: localeMessages,
    getMessageFallback({ namespace, key }: { namespace?: string; key: string }) {
      const parts = [namespace, key].filter(Boolean) as string[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = frMessages;
      for (const part of parts) {
        if (typeof current !== "object" || current === null) return key;
        current = current[part];
      }
      return typeof current === "string" ? current : key;
    },
  };
});
