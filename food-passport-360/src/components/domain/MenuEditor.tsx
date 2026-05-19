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
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";
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

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "8px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

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
    (a) => !itemArticleIds.has(a.id) && a.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAdd(article: FPArticle) {
    startTransition(async () => {
      const order = items.length > 0 ? Math.max(...items.map((i) => i.display_order)) + 1 : 0;
      const r = await addMenuItemAction(menu.id, article.id, order);
      if (r.error) { showToast(r.error); return; }
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), menu_id: menu.id, article_id: article.id, display_order: order, available: true, portions_available: null, notes: null, article, translation: null },
      ]);
      setShowPicker(false);
      setSearch("");
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      const r = await removeMenuItemAction(itemId);
      if (r.error) { showToast(r.error); return; }
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    });
  }

  function handleMove(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setItems(next);
    startTransition(async () => {
      await Promise.all([reorderMenuItemAction(next[idx].id, idx), reorderMenuItemAction(next[newIdx].id, newIdx)]);
    });
  }

  function handleSaveTitle() {
    startTransition(async () => {
      const r = await saveMenuAction(menu.id, { title });
      if (r.error) showToast(r.error); else showToast(tc("saved"));
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const r = await publishMenuAction(menu.id);
      if (r.error) showToast(r.error);
      else { showToast(t("published")); router.refresh(); }
    });
  }

  const allValidated = items.length > 0 && items.every((i) => i.article.nutri_validated && !i.article.nutri_blocked);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/resto/menus`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      <PageHeader
        label={t("menuLabel")}
        title={title || t("untitled")}
        subtitle={`${menu.date} · ${menu.service}${menu.location_name ? ` · ${menu.location_name}` : ""}`}
      />

      {/* Title edit */}
      <div
        className="p-4 space-y-2"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
        }}
      >
        <label className="text-xs font-medium text-muted-foreground">{t("field.title")}</label>
        <input
          style={INPUT_STYLE}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
        />
      </div>

      {/* Publish bar */}
      {menu.status !== "published" && (
        <div
          className="flex items-center justify-between gap-3 p-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "14px",
          }}
        >
          <p className="text-xs" style={{ color: allValidated ? "var(--muted-foreground)" : "var(--warning)" }}>
            {!allValidated ? t("publishBlockedNotValidated") : t("readyToPublish")}
          </p>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || !allValidated}
            className="btn-primary flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {t("publish")}
          </button>
        </div>
      )}

      {menu.status === "published" && (
        <div
          className="flex items-center gap-2 p-3 text-sm"
          style={{
            background: "rgba(77,255,180,0.06)",
            border: "0.5px solid rgba(77,255,180,0.20)",
            borderRadius: "14px",
            color: "var(--color-active)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {t("publishedAt")} {menu.published_at && new Date(menu.published_at).toLocaleString(locale)}
        </div>
      )}

      {/* Items section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("composition")} ({items.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="btn-primary flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" />
            {t("addArticle")}
          </button>
        </div>

        {items.length === 0 && (
          <EmptyState
            icon="🥗"
            title={t("emptyMenu")}
            description={t("emptyMenuDesc")}
          />
        )}

        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-2 p-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
              }}
            >
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0 || isPending}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={tc("moveUp")}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === items.length - 1 || isPending}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={tc("moveDown")}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm truncate">{item.article.name}</span>
                  {item.article.nutri_blocked && (
                    <StatusBadge status="refused" />
                  )}
                  {!item.article.nutri_validated && !item.article.nutri_blocked && (
                    <StatusBadge status="pending" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tcat(item.article.category as Parameters<typeof tcat>[0])}
                </p>
                <DietBadges article={item.article} />
              </div>

              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="rounded-lg p-1.5 disabled:opacity-40 transition-colors"
                style={{ color: "var(--danger)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,106,0.10)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                aria-label={tc("delete")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Article picker */}
      {showPicker && (
        <section
          className="p-4 space-y-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: "16px",
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder={t("searchArticle")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...INPUT_STYLE, paddingLeft: "36px" }}
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
                  className="w-full flex items-center gap-2 p-2.5 text-left transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "0.5px solid rgba(255,255,255,0.07)",
                    borderRadius: "12px",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)"; }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tcat(a.category as Parameters<typeof tcat>[0])}
                      {!a.nutri_validated && ` · ${t("pending")}`}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-active flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-sm px-4 py-2.5 shadow-lg"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
            borderRadius: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
