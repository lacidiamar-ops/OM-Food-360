"use client";

import { useTranslations, useLocale } from "next-intl";
import { Calendar, Clock, MapPin, UtensilsCrossed } from "lucide-react";
import type {
  FPArticle,
  FPMenu,
  FPMenuItem,
  FPArticleTranslation,
} from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";

type Item = FPMenuItem & {
  article: FPArticle;
  translation: FPArticleTranslation | null;
};

interface Props {
  menus: Array<{ menu: FPMenu; items: Item[] }>;
  date: string;
}

function formatDate(date: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export default function PlayerMenuView({ menus, date }: Props) {
  const t = useTranslations("menus");
  const tservice = useTranslations("service");
  const tcat = useTranslations("category");
  const locale = useLocale();

  if (menus.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-semibold">{t("noMenuToday")}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(date, locale)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-bold text-lg">{t("todaysMenu")}</h1>
        <p className="text-sm text-muted-foreground capitalize">{formatDate(date, locale)}</p>
      </div>

      {menus.map(({ menu, items }) => {
        const visible = items.filter(
          (i) =>
            i.available &&
            i.article.active &&
            i.article.nutri_validated &&
            !i.article.nutri_blocked &&
            !i.article.out_of_stock
        );
        if (visible.length === 0) return null;

        return (
          <section key={menu.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3 px-1">
              <div className="space-y-1">
                <h2 className="font-semibold text-sm">{menu.title}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tservice(menu.service as Parameters<typeof tservice>[0])}
                    {menu.start_time && ` · ${menu.start_time.slice(0, 5)}`}
                  </span>
                  {menu.location_name && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {menu.location_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ul className="space-y-2">
              {visible.map((item) => {
                const name = item.translation?.name ?? item.article.name;
                const desc = item.translation?.description ?? item.article.short_description;
                return (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-border bg-card p-3 flex gap-3"
                  >
                    {item.article.photo_url ? (
                      <img
                        src={item.article.photo_url}
                        alt={name}
                        className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                        <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-medium text-sm">{name}</div>
                      {desc && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{tcat(item.article.category as Parameters<typeof tcat>[0])}</span>
                        {item.article.standard_portion_g && (
                          <>
                            <span>·</span>
                            <span>{item.article.standard_portion_g} g</span>
                          </>
                        )}
                      </div>
                      <DietBadges article={item.article} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
