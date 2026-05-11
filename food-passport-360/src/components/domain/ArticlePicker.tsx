"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, X, Plus, AlertTriangle } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";

interface Props {
  open: boolean;
  onClose: () => void;
  articles: FPArticle[];
  excludeIds?: Set<string>;
  onPick: (article: FPArticle) => void;
  validatedOnly?: boolean;
}

export default function ArticlePicker({
  open,
  onClose,
  articles,
  excludeIds,
  onPick,
  validatedOnly = false,
}: Props) {
  const t = useTranslations("nutriQueue.modal");
  const tcat = useTranslations("category");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles.filter((a) => {
      if (excludeIds?.has(a.id)) return false;
      if (validatedOnly && (!a.nutri_validated || a.nutri_blocked)) return false;
      if (!a.active || a.out_of_stock) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    }).slice(0, 50);
  }, [articles, search, excludeIds, validatedOnly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg bg-background rounded-t-3xl lg:rounded-3xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-base">{t("pickerTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pickerSearch")}
              autoFocus
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {validatedOnly && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("pickerValidatedOnly")}
            </p>
          )}
        </div>

        <ul className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {filtered.length === 0 ? (
            <li className="text-center text-sm text-muted-foreground py-12">
              {t("pickerEmpty")}
            </li>
          ) : (
            filtered.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tcat(a.category as Parameters<typeof tcat>[0])}</span>
                    {a.standard_portion_g && (
                      <>
                        <span>·</span>
                        <span>{a.standard_portion_g} g</span>
                      </>
                    )}
                  </div>
                  <DietBadges article={a} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onPick(a);
                  }}
                  aria-label={t("addToOrder")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
