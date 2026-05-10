"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import type {
  FPArticleTranslation,
  SupportedLang,
} from "@/lib/supabase/food-passport.types";

const LANGS: { code: SupportedLang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "it", label: "IT" },
  { code: "pt", label: "PT" },
  { code: "ar", label: "AR" },
];

const INPUT = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const TEXTAREA = `${INPUT} resize-none`;

interface Props {
  articleId: string;
  baseFr: string;
  translations: FPArticleTranslation[];
  onSave: (
    lang: SupportedLang,
    values: { name: string; description: string | null }
  ) => Promise<void>;
}

export default function ArticleTranslations({ baseFr, translations, onSave }: Props) {
  const t = useTranslations("articles");
  const tc = useTranslations("common");
  const [activeLang, setActiveLang] = useState<SupportedLang>("en");
  const [isSaving, setIsSaving] = useState(false);

  const current = translations.find((tr) => tr.lang === activeLang);
  const [name, setName] = useState(current?.name ?? "");
  const [description, setDescription] = useState(current?.description ?? "");

  // Reset state when switching lang
  function switchLang(lang: SupportedLang) {
    const tr = translations.find((tt) => tt.lang === lang);
    setActiveLang(lang);
    setName(tr?.name ?? "");
    setDescription(tr?.description ?? "");
  }

  async function handleSave() {
    setIsSaving(true);
    await onSave(activeLang, { name, description: description || null });
    setIsSaving(false);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("section.translations")}
        </h2>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("baseFrLabel")}: <span className="font-medium text-foreground">{baseFr}</span>
      </p>

      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {LANGS.map((l) => {
          const has = translations.some((tt) => tt.lang === l.code);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => switchLang(l.code)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                activeLang === l.code
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
              {has && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("field.name")} ({activeLang.toUpperCase()})
          </label>
          <input
            className={INPUT + " mt-1"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={baseFr}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {t("field.description")} ({activeLang.toUpperCase()})
          </label>
          <textarea
            className={TEXTAREA + " mt-1"}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="w-full rounded-xl bg-primary text-primary-foreground text-sm py-2 hover:bg-primary/90 disabled:opacity-60"
        >
          {isSaving ? tc("saving") : t("saveTranslation")}
        </button>
      </div>
    </section>
  );
}
