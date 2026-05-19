"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

const LANGUAGES = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "pt", flag: "🇵🇹", label: "Português" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

interface Props {
  userId: string;
}

export default function LanguagePicker({ userId }: Props) {
  const t = useTranslations("profile");
  const [selected, setSelected] = useState<string>("fr");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("preferred_language")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data && (data as { preferred_language: string }).preferred_language) {
          setSelected((data as { preferred_language: string }).preferred_language);
        }
      });
  }, [userId]);

  async function pick(code: string) {
    if (code === selected || saving) return;
    setSelected(code);
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .schema("food_passport" as never)
      .from("profiles")
      .update({ preferred_language: code })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="p-4 space-y-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t("languageTitle")}</p>
        {saving && (
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            {t("languageSaving")}
          </span>
        )}
        {saved && !saving && (
          <span style={{ fontSize: 11, color: "var(--color-active)" }}>
            {t("languageSaved")}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{t("languageDesc")}</p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => pick(lang.code)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all"
              style={{
                borderRadius: "999px",
                border: isActive
                  ? "1px solid rgba(77,255,180,0.40)"
                  : "0.5px solid rgba(255,255,255,0.10)",
                background: isActive
                  ? "rgba(77,255,180,0.10)"
                  : "rgba(255,255,255,0.04)",
                color: isActive ? "var(--color-active)" : "var(--muted-foreground)",
              }}
              dir={lang.code === "ar" ? "rtl" : "ltr"}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
