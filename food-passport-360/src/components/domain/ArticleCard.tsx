"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertTriangle, Ban, ChevronRight, ImageOff } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";

interface Props {
  article: FPArticle;
  href?: string;
  showStatus?: boolean;
  variant?: "list" | "menu" | "player";
  translatedName?: string | null;
}

function StatusIcon({ article }: { article: FPArticle }) {
  if (article.nutri_blocked) {
    return <Ban className="h-3.5 w-3.5 text-destructive flex-shrink-0" />;
  }
  if (article.nutri_validated) {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />;
  }
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
}

export default function ArticleCard({
  article,
  href,
  showStatus = false,
  variant = "list",
  translatedName,
}: Props) {
  const t = useTranslations("articles");
  const tcat = useTranslations("category");
  const locale = useLocale();

  const displayName = translatedName ?? article.name;
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-muted/50 transition-colors active:scale-[0.99]">
      {/* Photo */}
      {article.photo_url ? (
        <img
          src={article.photo_url}
          alt={displayName}
          className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted flex-shrink-0">
          <ImageOff className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {showStatus && <StatusIcon article={article} />}
          <span className="font-medium text-sm truncate">{displayName}</span>
          {article.out_of_stock && (
            <span className="rounded-full bg-destructive/15 text-destructive text-[10px] font-medium px-1.5 py-0.5">
              {t("outOfStock")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {tcat(article.category as Parameters<typeof tcat>[0])}
          </span>
          {article.standard_portion_g && (
            <>
              <span>·</span>
              <span>{article.standard_portion_g} g</span>
            </>
          )}
        </div>

        <DietBadges article={article} />

        {variant === "list" && article.nutri_comment && (
          <p className="text-xs text-amber-700 dark:text-amber-400 italic line-clamp-2">
            {article.nutri_comment}
          </p>
        )}
      </div>

      {href && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 self-center" />}
    </div>
  );

  if (href) {
    return (
      <Link href={`/${locale}${href}`} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
