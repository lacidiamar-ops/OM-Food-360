"use client";

import { useTranslations } from "next-intl";
import type { FPArticle } from "@/lib/supabase/food-passport.types";

interface Props {
  article: Pick<
    FPArticle,
    "is_halal" | "is_vegetarian" | "is_vegan" | "is_gluten_free" | "is_lactose_free"
  >;
  size?: "sm" | "md";
}

const BADGE_STYLES = {
  halal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  vegetarian: "bg-green-500/15 text-green-700 dark:text-green-400",
  vegan: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  gluten_free: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  lactose_free: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
};

export default function DietBadges({ article, size = "sm" }: Props) {
  const t = useTranslations("diet");
  const items: Array<[boolean, keyof typeof BADGE_STYLES, string]> = [
    [article.is_halal, "halal", t("halal")],
    [article.is_vegetarian, "vegetarian", t("vegetarian")],
    [article.is_vegan, "vegan", t("vegan")],
    [article.is_gluten_free, "gluten_free", t("glutenFree")],
    [article.is_lactose_free, "lactose_free", t("lactoseFree")],
  ];
  const visible = items.filter(([on]) => on);
  if (visible.length === 0) return null;

  const padding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(([, key, label]) => (
        <span
          key={key}
          className={`inline-flex items-center rounded-full font-medium ${padding} ${BADGE_STYLES[key]}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
