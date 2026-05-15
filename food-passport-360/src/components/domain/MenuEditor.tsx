"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronUp, ChevronDown, Plus, Trash2, Search, CheckCircle2, Send } from "lucide-react";
import type {
  FPArticle,
  FPMenu,
  FPMenuItem,
  FPArticleTranslation,
} from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import {
  saveMenuAction,
  addMenuItemAction,
  removeMenuItemAction,
  reorderMenuItemAction,
  publishMenuAction,
} from "@/app/[locale]/(resto)/resto/menus/[id]/actions";

type MenuItemWithArticle = FPMenuItem & { article: FPArticle; translation: FPArticleTranslation | null };

interface Props {
  menu: FPMenu;
  items: MenuItemWithArticle[];
  availableArticles: FPArticle[];
}

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function MenuEditor({ menu, items: initialItems, availableArticles }: Props) {
  const t = useTranslations("menus");
  const tcat = useTranslations("category");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [title, setTitle] = useState(menu.title);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const itemArticleIds = new Set(items.map((i) => i.article_id));
  const candidates = availableArticles.filter(
    (a) =>
      !itemArticleIds.has(a.id) &&
      a.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(article: FPArticle) {
    startTransition(async () => {
      const order = items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 0;
      const r = await addMenuItemAction(menu.id, article.id, order);
      if (r.error) {
        showToast(r.error);
        return;
      }
      // Optimistic add
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          menu_id: menu.id,
          article_id: article.id,
          display_order: order,
          available: true,
          portions_available: null,
          notes: null,
          article,
          translation: null,
        },
      ]);
      setShowPicker(false);
      setSearch("");
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      const r = await removeMenuItemAction(itemId);
      if (r.error) {
        showToast(r.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    });
  }

  function handleMove(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setItems(next);
    // Persist new order for the two affected items
    startTransition(async () => {
      await Promise.all([
        reorderMenuItemAction(next[idx].id, idx),
        reorderMenuItemAction(next[newIdx].id, newIdx),
      ]);
    });
  }

  function handleSaveTitle() {
    startTransition(async () => {
      const r = await saveMenuAction(menu.id, { title });
      if (r.error) showToast(r.error);
      else showToast(tc("saved"));
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const r = await publishMenuAction(menu.id);
      if (r.error) showToast(r.error);
      else {
        showToast(t("published"));
        router.refresh();
      }
    });
  }

  const allValidated = items.length > 0 && items.every((i) => i.article.nutri_validated && !i.article.nutri_blocked);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/resto/menus`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      {/* Title */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <label className="text-xs font-medium text-muted-foreground">{t("field.title")}</label>
        <div className="flex gap-2">
          <input
            className={INPUT}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
          <span>{menu.date}</span>
          <span>·</span>
          <span>{menu.service}</span>
          {menu.location_name && (
            <>
              <span>·</span>
              <span>{menu.location_name}</span>
            </>
          )}
        </div>
      </div>

      {/* Publish bar */}
      {menu.status !== "published" && (
        <div className="rounded-2xl border border-border bg-card p-3 flex items-center justify-between gap-3">
          <div className="text-xs">
            {!allValidated ? (
              <span className="text-amber-700 dark:text-amber-400">{t("publishBlockedNotValidated")}</span>
            ) : (
              <span className="text-muted-foreground">{t("readyToPublish")}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || !allValidated}
            className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm px-3 py-1.5 font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {t("publish")}
          </button>
        </div>
      )}

      {menu.status === "published" && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          {t("publishedAt")} {menu.published_at && new Date(menu.published_at).toLocaleString(locale)}
        </div>
      )}

      {/* Items */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("composition")} ({items.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 hover:bg-primary/20"
          >
            <Plus className="h-3 w-3" />
            {t("addArticle")}
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t("emptyMenu")}</p>
        )}

        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={item.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0 || isPending}
                  className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                  aria-label={tc("moveUp")}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === items.length - 1 || isPending}
                  className="rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30"
                  aria-label={tc("moveDown")}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{item.article.name}</span>
                  {!item.article.nutri_validated && !item.article.nutri_blocked && (
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-medium px-1.5 py-0.5">
                      {t("pending")}
                    </span>
                  )}
                  {item.article.nutri_blocked && (
                    <span className="rounded-full bg-destructive/15 text-destructive text-[10px] font-medium px-1.5 py-0.5">
                      {t("blocked")}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {tcat(item.article.category as Parameters<typeof tcat>[0])}
                </div>
                <DietBadges article={item.article} />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                aria-label={tc("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Picker */}
      {showPicker && (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("searchArticle")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
          <ul className="max-h-72 overflow-y-auto space-y-1.5">
            {candidates.length === 0 && (
              <li className="text-center text-sm text-muted-foreground py-4">{tc("noData")}</li>
            )}
            {candidates.slice(0, 50).map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => handleAdd(a)}
                  className="w-full flex items-center gap-2 rounded-xl border border-border bg-background p-2.5 hover:bg-muted/50 text-left"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tcat(a.category as Parameters<typeof tcat>[0])}
                      {!a.nutri_validated && ` · ${t("pending")}`}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground text-background text-sm px-4 py-2.5 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
