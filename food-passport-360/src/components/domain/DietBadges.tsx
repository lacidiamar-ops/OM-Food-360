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
  halal: "bg-active/15 text-active",
  vegetarian: "bg-active/15 text-active",
  vegan: "bg-active/10 text-active",
  gluten_free: "bg-warning/15 text-warning",
  lactose_free: "bg-om/15 text-om",
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
