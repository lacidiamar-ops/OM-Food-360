"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Search, Plus, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import ArticleCard from "./ArticleCard";

type Filter = "all" | "validated" | "pending" | "blocked";

interface Props {
  articles: FPArticle[];
}

export default function RestoArticlesList({ articles }: Props) {
  const t = useTranslations("articles");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = articles.filter((a) => {
    if (filter === "validated" && (!a.nutri_validated || a.nutri_blocked)) return false;
    if (filter === "pending" && (a.nutri_validated || a.nutri_blocked)) return false;
    if (filter === "blocked" && !a.nutri_blocked) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: articles.length,
    validated: articles.filter((a) => a.nutri_validated && !a.nutri_blocked).length,
    pending: articles.filter((a) => !a.nutri_validated && !a.nutri_blocked).length,
    blocked: articles.filter((a) => a.nutri_blocked).length,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">{t("catalog")}</h1>
        <Link
          href={`/${locale}/resto/articles/new`}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm px-3 py-2 font-medium hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("new")}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { key: "all" as const, label: t("filter.all"), icon: null },
          { key: "validated" as const, label: t("filter.validated"), icon: CheckCircle2 },
          { key: "pending" as const, label: t("filter.pending"), icon: AlertTriangle },
          { key: "blocked" as const, label: t("filter.blocked"), icon: Ban },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
            <span className="opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t("empty")}</p>
      )}
      <ul className="space-y-2">
        {filtered.map((a) => (
          <li key={a.id}>
            <ArticleCard article={a} href={`/resto/articles/${a.id}`} showStatus />
          </li>
        ))}
      </ul>
    </div>
  );
}
