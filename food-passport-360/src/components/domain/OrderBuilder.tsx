"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Check, Clock, MapPin, ShoppingBag, X } from "lucide-react";
import type {
  FPArticle,
  FPMenu,
  FPMenuItem,
  FPArticleTranslation,
  FPOrderItemInput,
  ServiceType,
} from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import { PageHeader, EmptyState } from "@/components/ui";
import { createOrderAction } from "@/app/[locale]/(joueur)/joueur/commander/actions";

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

export default function OrderBuilder({ menus, date }: Props) {
  const t = useTranslations("commander");
  const tservice = useTranslations("service");
  const tcat = useTranslations("category");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Record<string, FPMenu>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cartCount = Object.keys(selected).length;

  function toggle(articleId: string, menu: FPMenu) {
    setSelected((prev) => {
      if (prev[articleId]) {
        const next = { ...prev };
        delete next[articleId];
        return next;
      }
      return { ...prev, [articleId]: menu };
    });
  }

  function handleSubmit() {
    if (cartCount === 0) { setError(t("errorEmpty")); return; }
    const firstEntry = Object.values(selected)[0];
    const targetMenu = firstEntry;
    const items: FPOrderItemInput[] = Object.keys(selected).map((articleId) => ({
      article_id: articleId,
      quantity: 1,
    }));
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction({
        service: targetMenu.service as ServiceType,
        scheduledAt: `${targetMenu.date}T${targetMenu.start_time ?? "12:00:00"}`,
        items,
        locationLabel: targetMenu.location_name,
        playerComment: comment.trim() || null,
        submitNow: true,
      });
      if (result.error || !result.orderId) {
        setError(t("errorGeneric"));
        return;
      }
      router.push(`/${locale}/joueur/orders/${result.orderId}`);
    });
  }

  if (menus.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title={t("emptyMenu")}
          description={formatDate(date, locale)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-36">
        <PageHeader
          label={t("label")}
          title={t("title")}
          subtitle={formatDate(date, locale)}
        />

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
              <div className="px-1 space-y-0.5">
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

              <ul className="space-y-2">
                {visible.map((item) => {
                  const name = item.translation?.name ?? item.article.name;
                  const desc = item.translation?.description ?? item.article.short_description;
                  const isSelected = !!selected[item.article.id];

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.article.id, menu)}
                        className="w-full text-left flex gap-3 items-center p-3 transition-all duration-150 active:scale-[0.99]"
                        style={{
                          background: isSelected
                            ? "rgba(77,255,180,0.05)"
                            : "rgba(255,255,255,0.03)",
                          border: isSelected
                            ? "1px solid rgba(77,255,180,0.40)"
                            : "0.5px solid rgba(255,255,255,0.07)",
                          borderRadius: "16px",
                        }}
                      >
                        {/* Photo */}
                        {item.article.photo_url ? (
                          <img
                            src={item.article.photo_url}
                            alt={name}
                            className="h-14 w-14 object-cover flex-shrink-0"
                            style={{ borderRadius: "12px" }}
                          />
                        ) : (
                          <div
                            className="flex h-14 w-14 items-center justify-center flex-shrink-0 text-muted-foreground"
                            style={{ background: "var(--muted)", borderRadius: "12px" }}
                          >
                            🍽️
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1">
                          <p style={{ fontSize: "15px", fontWeight: 700 }}>{name}</p>
                          {desc && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{desc}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              style={{
                                background: "var(--primary)",
                                border: "1px solid var(--primary-border)",
                                color: "var(--primary-foreground)",
                                borderRadius: "999px",
                                padding: "1px 7px",
                                fontSize: "10px",
                                fontWeight: 600,
                              }}
                            >
                              {tcat(item.article.category as Parameters<typeof tcat>[0])}
                            </span>
                            <DietBadges article={item.article} size="sm" />
                          </div>
                        </div>

                        {/* Check indicator */}
                        <div
                          className="flex h-6 w-6 items-center justify-center flex-shrink-0"
                          style={{
                            borderRadius: "50%",
                            background: isSelected
                              ? "var(--color-active)"
                              : "rgba(255,255,255,0.06)",
                            border: isSelected
                              ? "none"
                              : "1px solid rgba(255,255,255,0.12)",
                            transition: "all 0.15s",
                          }}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5" style={{ color: "var(--background)" }} />
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Sticky bottom cart bar */}
      <div
        className="fixed bottom-16 lg:bottom-4 left-0 right-0 px-4 z-40"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => cartCount > 0 && setReviewOpen(true)}
            disabled={cartCount === 0}
            className="w-full btn-primary inline-flex items-center justify-between gap-3 rounded-2xl px-5 py-4 font-semibold active:scale-[0.99] transition-transform"
            style={{ opacity: cartCount === 0 ? 0.4 : 1 }}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0
                ? t("itemCount", { count: cartCount })
                : t("noItems")}
            </span>
            <span>{t("review")}</span>
          </button>
        </div>
      </div>

      {/* Review / confirm sheet */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setReviewOpen(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              background: "var(--nav-bg)",
              borderRadius: "24px 24px 0 0",
              border: "0.5px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">{t("review")}</h2>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                aria-label="close"
                className="inline-flex h-8 w-8 items-center justify-center"
                style={{ borderRadius: "50%", background: "var(--muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="comment" className="text-sm font-medium block mb-1.5">
                {t("comment")}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.10)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  focusRingColor: "var(--color-active)",
                }}
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2"
                style={{
                  background: "rgba(255,77,106,0.10)",
                  color: "var(--danger)",
                  borderRadius: "12px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending || cartCount === 0}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-semibold active:scale-[0.99] transition-transform disabled:opacity-60"
            >
              {pending ? t("confirming") : t("submitWithCount", { count: cartCount })}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
