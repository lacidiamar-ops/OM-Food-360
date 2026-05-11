"use client";

import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FPArticle } from "@/lib/supabase/food-passport.types";
import DietBadges from "./DietBadges";

interface Props {
  article: FPArticle;
  displayName: string;
  description?: string | null;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function OrderCartItem({
  article,
  displayName,
  description,
  quantity,
  onIncrement,
  onDecrement,
}: Props) {
  const t = useTranslations("commander");
  const tcat = useTranslations("category");

  return (
    <li className="rounded-2xl border border-border bg-card p-3 flex gap-3 items-stretch">
      {article.photo_url ? (
        <img
          src={article.photo_url}
          alt={displayName}
          className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted flex-shrink-0">
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <div className="font-medium text-sm leading-tight">{displayName}</div>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{tcat(article.category as Parameters<typeof tcat>[0])}</span>
          {article.standard_portion_g && (
            <>
              <span>·</span>
              <span>{article.standard_portion_g} g</span>
            </>
          )}
        </div>
        <DietBadges article={article} />
      </div>

      {quantity === 0 ? (
        <button
          type="button"
          onClick={onIncrement}
          aria-label={t("add")}
          className="self-center inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
        </button>
      ) : (
        <div className="self-center flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDecrement}
            aria-label={t("remove")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted active:scale-95 transition-transform"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-semibold min-w-[1.25rem] text-center">
            {quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            aria-label={t("add")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}
