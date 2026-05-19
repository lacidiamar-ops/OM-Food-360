"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Save, ChevronLeft, ImageOff } from "lucide-react";
import type {
  FPArticle,
  FPArticleTranslation,
  ArticleCategory,
} from "@/lib/supabase/food-passport.types";
import ArticleTranslations from "./ArticleTranslations";
import { PageHeader } from "@/components/ui";
import { saveArticleAction, saveTranslationAction, archiveArticleAction } from "@/app/[locale]/(resto)/resto/articles/[id]/actions";

interface Props {
  article: FPArticle | null;
  translations: FPArticleTranslation[];
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

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "0.5px solid rgba(255,255,255,0.07)",
  borderRadius: "20px",
  padding: "16px",
};

const CATEGORIES: ArticleCategory[] = [
  "feculent",
  "proteine_animale",
  "proteine_vegetale",
  "legume",
  "fruit",
  "produit_laitier",
  "sauce",
  "boisson",
  "epicerie",
  "collation",
  "dessert",
  "autre",
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between gap-2 text-sm transition-colors"
      style={
        value
          ? {
              background: "rgba(77,255,180,0.08)",
              border: "0.5px solid rgba(77,255,180,0.25)",
              borderRadius: "12px",
              padding: "8px 12px",
              color: "var(--color-active)",
            }
          : {
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "8px 12px",
              color: "var(--muted-foreground)",
            }
      }
    >
      <span>{label}</span>
      <span
        className="flex items-center rounded-full px-0.5 transition-colors"
        style={{
          height: 16,
          width: 28,
          background: value ? "var(--color-active)" : "rgba(255,255,255,0.15)",
        }}
      >
        <span
          className="rounded-full transition-transform"
          style={{
            height: 12,
            width: 12,
            background: value ? "#07080f" : "rgba(255,255,255,0.60)",
            transform: value ? "translateX(12px)" : "translateX(0)",
          }}
        />
      </span>
    </button>
  );
}

export default function ArticleEditor({ article, translations }: Props) {
  const t = useTranslations("articles");
  const tcat = useTranslations("category");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState(article?.name ?? "");
  const [category, setCategory] = useState<ArticleCategory>(article?.category ?? "autre");
  const [subcategory, setSubcategory] = useState(article?.subcategory ?? "");
  const [shortDescription, setShortDescription] = useState(article?.short_description ?? "");
  const [portionG, setPortionG] = useState(String(article?.standard_portion_g ?? ""));
  const [unit, setUnit] = useState(article?.unit ?? "");

  const [isHalal, setIsHalal] = useState(article?.is_halal ?? false);
  const [isVegetarian, setIsVegetarian] = useState(article?.is_vegetarian ?? false);
  const [isVegan, setIsVegan] = useState(article?.is_vegan ?? false);
  const [isGlutenFree, setIsGlutenFree] = useState(article?.is_gluten_free ?? false);
  const [isLactoseFree, setIsLactoseFree] = useState(article?.is_lactose_free ?? false);

  const [availCenter, setAvailCenter] = useState(article?.available_center ?? true);
  const [availHotel, setAvailHotel] = useState(article?.available_hotel ?? false);
  const [availRoom, setAvailRoom] = useState(article?.available_room ?? false);
  const [availFridge, setAvailFridge] = useState(article?.available_smart_fridge ?? false);
  const [availMatchDay, setAvailMatchDay] = useState(article?.available_match_day ?? false);
  const [availMatchEve, setAvailMatchEve] = useState(article?.available_match_eve ?? false);
  const [availRecovery, setAvailRecovery] = useState(article?.available_recovery ?? false);

  const [active, setActive] = useState(article?.active ?? true);
  const [outOfStock, setOutOfStock] = useState(article?.out_of_stock ?? false);
  const [restoComment, setRestoComment] = useState(article?.resto_comment ?? "");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveArticleAction(article?.id ?? null, {
        name,
        category,
        subcategory: subcategory || null,
        short_description: shortDescription || null,
        standard_portion_g: portionG ? Number(portionG) : null,
        unit: unit || null,
        is_halal: isHalal,
        is_vegetarian: isVegetarian,
        is_vegan: isVegan,
        is_gluten_free: isGlutenFree,
        is_lactose_free: isLactoseFree,
        available_center: availCenter,
        available_hotel: availHotel,
        available_room: availRoom,
        available_smart_fridge: availFridge,
        available_match_day: availMatchDay,
        available_match_eve: availMatchEve,
        available_recovery: availRecovery,
        active,
        out_of_stock: outOfStock,
        resto_comment: restoComment || null,
      });

      if (result.error) {
        showToast(result.error);
      } else if (!article && result.id) {
        router.push(`/${locale}/resto/articles/${result.id}`);
      } else {
        showToast(tc("saved"));
      }
    });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/resto/articles`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {tc("back")}
      </button>

      <PageHeader
        label={t("articleLabel")}
        title={name || t("newArticle")}
        action={{
          label: isPending ? tc("saving") : tc("save"),
          onClick: handleSave,
        }}
      />

      {/* Identity */}
      <section style={CARD} className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.identity")}
        </h2>
        <Field label={`${t("field.name")} (FR)`}>
          <input style={INPUT_STYLE} value={name} onChange={(e) => setName(e.target.value)} placeholder="Riz basmati" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("field.category")}>
            <select
              style={{ ...INPUT_STYLE, cursor: "pointer" }}
              value={category}
              onChange={(e) => setCategory(e.target.value as ArticleCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ background: "#07080f" }}>
                  {tcat(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("field.subcategory")}>
            <input style={INPUT_STYLE} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder={tc("optional")} />
          </Field>
        </div>
        <Field label={t("field.shortDescription")}>
          <textarea
            style={{ ...INPUT_STYLE, resize: "none" }}
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("field.portionG")}>
            <input type="number" style={INPUT_STYLE} value={portionG} onChange={(e) => setPortionG(e.target.value)} placeholder="200" />
          </Field>
          <Field label={t("field.unit")}>
            <input style={INPUT_STYLE} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="g, mL, pièce…" />
          </Field>
        </div>
      </section>

      {/* Photo placeholder */}
      <section
        className="p-6 flex flex-col items-center gap-2 text-center"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "0.5px dashed rgba(255,255,255,0.12)",
          borderRadius: "20px",
        }}
      >
        <ImageOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t("photoComingSoon")}</p>
      </section>

      {/* Diet flags */}
      <section style={CARD} className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.diet")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label={t("diet.halal")} value={isHalal} onChange={setIsHalal} />
          <Toggle label={t("diet.vegetarian")} value={isVegetarian} onChange={setIsVegetarian} />
          <Toggle label={t("diet.vegan")} value={isVegan} onChange={setIsVegan} />
          <Toggle label={t("diet.glutenFree")} value={isGlutenFree} onChange={setIsGlutenFree} />
          <Toggle label={t("diet.lactoseFree")} value={isLactoseFree} onChange={setIsLactoseFree} />
        </div>
      </section>

      {/* Availability */}
      <section style={CARD} className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.availability")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label={t("avail.center")} value={availCenter} onChange={setAvailCenter} />
          <Toggle label={t("avail.hotel")} value={availHotel} onChange={setAvailHotel} />
          <Toggle label={t("avail.room")} value={availRoom} onChange={setAvailRoom} />
          <Toggle label={t("avail.fridge")} value={availFridge} onChange={setAvailFridge} />
          <Toggle label={t("avail.matchDay")} value={availMatchDay} onChange={setAvailMatchDay} />
          <Toggle label={t("avail.matchEve")} value={availMatchEve} onChange={setAvailMatchEve} />
          <Toggle label={t("avail.recovery")} value={availRecovery} onChange={setAvailRecovery} />
        </div>
      </section>

      {/* Status */}
      <section style={CARD} className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.status")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label={t("status.active")} value={active} onChange={setActive} />
          <Toggle label={t("status.outOfStock")} value={outOfStock} onChange={setOutOfStock} />
        </div>
        <Field label={t("field.restoComment")}>
          <textarea
            style={{ ...INPUT_STYLE, resize: "none" }}
            rows={2}
            value={restoComment}
            onChange={(e) => setRestoComment(e.target.value)}
          />
        </Field>
      </section>

      {article && (
        <ArticleTranslations
          articleId={article.id}
          baseFr={name}
          translations={translations}
          onSave={async (lang, vals) => {
            const r = await saveTranslationAction(article.id, lang, vals);
            if (r.error) showToast(r.error);
            else showToast(tc("saved"));
          }}
        />
      )}

      {article && !article.archived_at && (
        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              const r = await archiveArticleAction(article.id);
              if (r.error) showToast(r.error);
              else router.push(`/${locale}/resto/articles`);
            });
          }}
          className="w-full text-sm py-2 transition-colors"
          style={{
            border: "0.5px solid rgba(255,77,106,0.25)",
            color: "var(--danger)",
            background: "rgba(255,77,106,0.04)",
            borderRadius: "16px",
          }}
        >
          {t("archive")}
        </button>
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
