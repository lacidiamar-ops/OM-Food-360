"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, Ban, ChevronLeft, ImageOff, MessageSquare } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import { PageHeader, StatusBadge } from "@/components/ui";
import { validateArticleAction, blockArticleAction, commentArticleAction } from "@/app/[locale]/(nutri)/nutri/articles/[id]/actions";

interface Props {
  article: FPArticle;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  resize: "none" as const,
};

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "0.5px solid rgba(255,255,255,0.07)",
  borderRadius: "20px",
  padding: "16px",
};

function articleBadgeStatus(article: FPArticle) {
  if (article.nutri_blocked) return "refused" as const;
  if (article.nutri_validated) return "validated" as const;
  return "pending" as const;
}

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
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      <PageHeader
        label={t("validationLabel")}
        title={article.name}
        subtitle={tcat(article.category as Parameters<typeof tcat>[0])}
        action={<StatusBadge status={articleBadgeStatus(article)} />}
      />

      {/* Article preview */}
      <div style={CARD} className="space-y-3">
        <div className="flex gap-3">
          {article.photo_url ? (
            <img
              src={article.photo_url}
              alt={article.name}
              style={{ height: 80, width: 80, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{ height: 80, width: 80, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}
            >
              <ImageOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">
              {article.subcategory && `${article.subcategory} · `}
              {article.standard_portion_g && `${article.standard_portion_g} g`}
            </p>
            <DietBadges article={article} size="md" />
          </div>
        </div>

        {article.short_description && (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{article.short_description}</p>
        )}

        {article.resto_comment && (
          <div
            className="text-xs"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "8px 10px",
              color: "var(--muted-foreground)",
            }}
          >
            <span className="font-medium">{t("restoComment")}: </span>
            {article.resto_comment}
          </div>
        )}
      </div>

      {/* Nutri comment */}
      <div style={CARD} className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: "var(--color-om)" }} />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("nutriComment")}
          </h2>
        </div>
        <textarea
          style={INPUT_STYLE}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
        />
        <button
          type="button"
          onClick={handleSaveComment}
          disabled={isPending}
          className="w-full text-xs py-1.5 disabled:opacity-60 transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "0.5px solid rgba(255,255,255,0.10)",
            borderRadius: "10px",
            color: "var(--muted-foreground)",
          }}
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
          className="flex items-center justify-center gap-1.5 text-sm py-3 font-medium disabled:opacity-60 transition-colors"
          style={{
            border: "0.5px solid rgba(255,77,106,0.35)",
            color: "var(--danger)",
            background: "rgba(255,77,106,0.06)",
            borderRadius: "16px",
          }}
        >
          <Ban className="h-4 w-4" />
          {t("block")}
        </button>
        <button
          type="button"
          onClick={handleValidate}
          disabled={isPending}
          className="btn-primary flex items-center justify-center gap-1.5 text-sm py-3 font-semibold disabled:opacity-60"
          style={{ borderRadius: "16px" }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {t("validate")}
        </button>
      </div>

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
