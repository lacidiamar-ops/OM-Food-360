"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Ban, ChevronRight, ImageOff } from "lucide-react";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";
import { StatusBadge } from "@/components/ui";

interface Props {
  article: FPArticle;
  href?: string;
  showStatus?: boolean;
  variant?: "list" | "menu" | "player";
  translatedName?: string | null;
}

function articleBadgeStatus(article: FPArticle): "refused" | "validated" | "pending" {
  if (article.nutri_blocked) return "refused";
  if (article.nutri_validated) return "validated";
  return "pending";
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
    <div
      className="flex items-start gap-3 p-3 transition-colors active:scale-[0.99]"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      {/* Photo 48px round */}
      {article.photo_url ? (
        <img
          src={article.photo_url}
          alt={displayName}
          className="h-12 w-12 object-cover flex-shrink-0"
          style={{ borderRadius: "50%" }}
        />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center flex-shrink-0"
          style={{ background: "var(--muted)", borderRadius: "50%" }}
        >
          <ImageOff className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name + out-of-stock */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm truncate">{displayName}</span>
          {article.out_of_stock && (
            <span
              style={{
                background: "rgba(255,77,106,0.10)",
                color: "var(--danger)",
                borderRadius: "999px",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {t("outOfStock")}
            </span>
          )}
          {article.nutri_blocked && (
            <Ban className="h-3 w-3 text-danger flex-shrink-0" />
          )}
        </div>

        {/* Category + portion + validation badge */}
        <div className="flex items-center gap-2 flex-wrap">
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
            {tcat(article.category as Parameters<typeof tcat>[0])}
          </span>
          {article.standard_portion_g && (
            <span className="text-xs text-muted-foreground">
              {article.standard_portion_g} g
            </span>
          )}
          {showStatus && (
            <StatusBadge status={articleBadgeStatus(article)} />
          )}
        </div>

        <DietBadges article={article} />

        {variant === "list" && article.nutri_comment && (
          <p className="text-xs text-warning italic line-clamp-2">
            {article.nutri_comment}
          </p>
        )}
      </div>

      {href && (
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 self-center" />
      )}
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
