"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { UtensilsCrossed } from "lucide-react";
import type {
  FPArticle,
  FPMenu,
  FPMenuItem,
  FPArticleTranslation,
} from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import { PageHeader, EmptyState } from "@/components/ui";

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

  const visibleMenus = menus
    .map(({ menu, items }) => ({
      menu,
      items: items.filter(
        (i) =>
          i.available &&
          i.article.active &&
          i.article.nutri_validated &&
          !i.article.nutri_blocked &&
          !i.article.out_of_stock
      ),
    }))
    .filter(({ items }) => items.length > 0);

  const [activeService, setActiveService] = useState<string>(
    visibleMenus[0]?.menu.service ?? ""
  );

  if (visibleMenus.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <EmptyState
          icon="🍽️"
          title={t("noMenuToday")}
          description={formatDate(date, locale)}
        />
      </div>
    );
  }

  const services = visibleMenus.map(({ menu }) => menu.service);
  const activeGroup = visibleMenus.find(({ menu }) => menu.service === activeService) ?? visibleMenus[0];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-8">
      <PageHeader
        label={t("today")}
        title={t("todaysMenu")}
        subtitle={formatDate(date, locale)}
      />

      {/* Service tabs */}
      <div
        className="flex gap-0 overflow-x-auto -mx-4 px-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {services.map((service) => {
          const active = service === (activeGroup.menu.service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => setActiveService(service)}
              className="shrink-0 pb-2.5 px-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: active
                  ? "2px solid var(--color-active)"
                  : "2px solid transparent",
                color: active
                  ? "var(--color-active)"
                  : "rgba(255,255,255,0.40)",
                marginBottom: "-1px",
              }}
            >
              {tservice(service as Parameters<typeof tservice>[0])}
            </button>
          );
        })}
      </div>

      {/* Active menu info */}
      {activeGroup.menu.location_name && (
        <p className="text-xs text-muted-foreground px-1">
          📍 {activeGroup.menu.location_name}
          {activeGroup.menu.start_time && ` · ${activeGroup.menu.start_time.slice(0, 5)}`}
        </p>
      )}

      {/* Dish cards */}
      <ul className="space-y-2">
        {activeGroup.items.map((item) => {
          const name = item.translation?.name ?? item.article.name;
          const desc = item.translation?.description ?? item.article.short_description;
          return (
            <li
              key={item.id}
              className="flex gap-3 items-center p-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
              }}
            >
              {/* Round photo 48px */}
              {item.article.photo_url ? (
                <img
                  src={item.article.photo_url}
                  alt={name}
                  className="h-12 w-12 object-cover flex-shrink-0"
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center flex-shrink-0"
                  style={{ background: "var(--muted)", borderRadius: "50%" }}
                >
                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <p style={{ fontSize: "15px", fontWeight: 700 }}>{name}</p>
                {desc && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Category badge */}
                  <span
                    style={{
                      background: "var(--primary)",
                      border: "1px solid var(--primary-border)",
                      color: "var(--primary-foreground)",
                      borderRadius: "999px",
                      padding: "1px 8px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {tcat(item.article.category as Parameters<typeof tcat>[0])}
                  </span>
                  {item.article.standard_portion_g && (
                    <span className="text-xs text-muted-foreground">
                      {item.article.standard_portion_g} g
                    </span>
                  )}
                  <DietBadges article={item.article} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
