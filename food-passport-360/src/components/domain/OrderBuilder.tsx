"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Clock, MapPin, ShoppingBag, X } from "lucide-react";
import type {
  FPArticle,
  FPMenu,
  FPMenuItem,
  FPArticleTranslation,
  FPOrderItemInput,
  ServiceType,
} from "@/lib/supabase/food-passport.types";
import OrderCartItem from "./OrderCartItem";
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
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // cart: articleId → { quantity, menu (pour service/scheduledAt) }
  const [cart, setCart] = useState<
    Record<string, { quantity: number; menu: FPMenu }>
  >({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cartCount = Object.values(cart).reduce((n, c) => n + c.quantity, 0);

  function inc(articleId: string, menu: FPMenu) {
    setCart((prev) => {
      const cur = prev[articleId];
      return {
        ...prev,
        [articleId]: { quantity: (cur?.quantity ?? 0) + 1, menu },
      };
    });
  }

  function dec(articleId: string) {
    setCart((prev) => {
      const cur = prev[articleId];
      if (!cur) return prev;
      if (cur.quantity <= 1) {
        const next = { ...prev };
        delete next[articleId];
        return next;
      }
      return { ...prev, [articleId]: { ...cur, quantity: cur.quantity - 1 } };
    });
  }

  function handleSubmit() {
    if (cartCount === 0) {
      setError(t("errorEmpty"));
      return;
    }
    // On suppose ici un seul menu cible (cas le plus fréquent : repas du jour)
    // Si plusieurs menus → on prend celui du premier item ajouté
    const firstEntry = Object.values(cart)[0];
    const targetMenu = firstEntry.menu;
    const items: FPOrderItemInput[] = Object.entries(cart).map(([articleId, c]) => ({
      article_id: articleId,
      quantity: c.quantity,
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
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-semibold">{t("emptyMenu")}</h1>
        <p className="text-sm text-muted-foreground">{formatDate(date, locale)}</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-32">
        <div>
          <h1 className="font-bold text-lg">{t("title")}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDate(date, locale)}
          </p>
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
              <div className="px-1">
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
                  const desc =
                    item.translation?.description ?? item.article.short_description;
                  const qty = cart[item.article.id]?.quantity ?? 0;
                  return (
                    <OrderCartItem
                      key={item.id}
                      article={item.article}
                      displayName={name}
                      description={desc}
                      quantity={qty}
                      onIncrement={() => inc(item.article.id, menu)}
                      onDecrement={() => dec(item.article.id)}
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Sticky bottom cart bar */}
      {cartCount > 0 && !reviewOpen && (
        <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 px-4 z-40 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="w-full inline-flex items-center justify-between gap-3 rounded-2xl bg-primary text-primary-foreground px-5 py-4 shadow-lg font-semibold active:scale-[0.99] transition-transform"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t("itemCount", { count: cartCount })}
              </span>
              <span>{t("review")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Review / confirm sheet */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReviewOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg bg-background rounded-t-3xl lg:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">{t("review")}</h2>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                aria-label="close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="text-sm font-medium block mb-1.5"
              >
                {t("comment")}
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("commentPlaceholder")}
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending || cartCount === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-5 py-3.5 font-semibold disabled:opacity-60 active:scale-[0.99] transition-transform"
            >
              {pending ? t("confirming") : t("submitWithCount", { count: cartCount })}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
