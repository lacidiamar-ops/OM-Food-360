"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, Ban, ChevronLeft, ImageOff, MessageSquare } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import { validateArticleAction, blockArticleAction, commentArticleAction } from "@/app/[locale]/(nutri)/nutri/articles/[id]/actions";

interface Props {
  article: FPArticle;
}

const TEXTAREA = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

export default function ArticleValidationPanel({ article }: Props) {
  const t = useTranslations("articles");
  const tcat = useTranslations("category");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState(article.nutri_comment ?? "");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleValidate() {
    startTransition(async () => {
      const r = await validateArticleAction(article.id, comment || null);
      if (r.error) showToast(r.error);
      else {
        showToast(t("validated"));
        router.push(`/${locale}/nutri/articles`);
      }
    });
  }

  function handleBlock() {
    if (!comment.trim()) {
      showToast(t("commentRequired"));
      return;
    }
    startTransition(async () => {
      const r = await blockArticleAction(article.id, comment);
      if (r.error) showToast(r.error);
      else {
        showToast(t("blocked"));
        router.push(`/${locale}/nutri/articles`);
      }
    });
  }

  function handleSaveComment() {
    startTransition(async () => {
      const r = await commentArticleAction(article.id, comment || null);
      if (r.error) showToast(r.error);
      else showToast(tc("saved"));
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/nutri/articles`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      {/* Article preview */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex gap-3">
          {article.photo_url ? (
            <img
              src={article.photo_url}
              alt={article.name}
              className="h-20 w-20 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted flex-shrink-0">
              <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-semibold text-base">{article.name}</h1>
            <p className="text-xs text-muted-foreground">
              {tcat(article.category as Parameters<typeof tcat>[0])}
              {article.subcategory && ` · ${article.subcategory}`}
              {article.standard_portion_g && ` · ${article.standard_portion_g} g`}
            </p>
            <DietBadges article={article} size="md" />
          </div>
        </div>

        {article.short_description && (
          <p className="text-sm text-foreground/80">{article.short_description}</p>
        )}

        {article.resto_comment && (
          <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
            <span className="font-medium">{t("restoComment")}: </span>
            {article.resto_comment}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {article.nutri_validated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 px-2.5 py-1 text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" />
            {t("validated")}
          </span>
        )}
        {article.nutri_blocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-1 text-xs font-medium">
            <Ban className="h-3 w-3" />
            {t("blocked")}
          </span>
        )}
        {!article.nutri_validated && !article.nutri_blocked && (
          <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-1 text-xs font-medium">
            {t("pending")}
          </span>
        )}
      </div>

      {/* Comment */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("nutriComment")}
          </h2>
        </div>
        <textarea
          className={TEXTAREA}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
        />
        <button
          type="button"
          onClick={handleSaveComment}
          disabled={isPending}
          className="w-full rounded-lg bg-muted text-foreground text-xs py-1.5 hover:bg-muted/70 disabled:opacity-60"
        >
          {tc("save")}
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleBlock}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm py-3 font-medium hover:bg-destructive/10 disabled:opacity-60"
        >
          <Ban className="h-4 w-4" />
          {t("block")}
        </button>
        <button
          type="button"
          onClick={handleValidate}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 text-white text-sm py-3 font-medium hover:bg-green-700 disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("validate")}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-foreground text-background text-sm px-4 py-2.5 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
