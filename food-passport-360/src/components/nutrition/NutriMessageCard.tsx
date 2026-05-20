"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  message: string;
  fromLang: string;
  userLang: string;
  timestamp: string;
  nutriName: string;
}

function formatTimestamp(ts: string, locale: string): string {
  const d = new Date(ts);
  return new Intl.DateTimeFormat(locale, {
    day:    "numeric",
    month:  "short",
    hour:   "2-digit",
    minute: "2-digit",
  }).format(d);
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function NutriMessageCard({ message, fromLang, userLang, timestamp, nutriName }: Props) {
  const t = useTranslations("nutrition");
  const [displayMessage, setDisplayMessage] = useState(message);
  const [translated, setTranslated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only translate if langs differ
    if (fromLang === userLang || !message) return;

    let cancelled = false;

    async function doTranslate() {
      setLoading(true);
      try {
        const res = await fetch("/api/translate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ content: message, fromLang, toLang: userLang }),
        });
        const data = await res.json() as { translated?: string };
        if (!cancelled && data.translated) {
          setDisplayMessage(data.translated);
          setTranslated(true);
        }
      } catch {
        // Silently fail — show original message
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void doTranslate();
    return () => { cancelled = true; };
  }, [message, fromLang, userLang]);

  return (
    <div
      style={{
        background:   "rgba(0,91,172,0.06)",
        border:       "0.5px solid rgba(0,91,172,0.25)",
        borderRadius: "16px",
        padding:      "16px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div
          className="flex items-center justify-center shrink-0 select-none font-bold rounded-full"
          style={{
            width:      36,
            height:     36,
            fontSize:   13,
            background: "rgba(0,91,172,0.15)",
            border:     "1px solid rgba(0,91,172,0.35)",
            color:      "var(--color-om)",
          }}
        >
          {initials(nutriName)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ fontSize: 13, color: "var(--color-om)" }}>
            {nutriName}
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {t("fromNutri")} · {formatTimestamp(timestamp, userLang)}
          </p>
        </div>

        {/* Translated badge */}
        {translated && (
          <span
            className="shrink-0 text-xs px-2 py-0.5 rounded-full"
            style={{
              color:      "var(--color-om)",
              background: "rgba(0,91,172,0.10)",
              border:     "0.5px solid rgba(0,91,172,0.20)",
            }}
          >
            {t("translatedBadge")}
          </span>
        )}
      </div>

      {/* Message body */}
      {loading ? (
        <div
          className="rounded"
          style={{ height: 16, width: "70%", background: "rgba(255,255,255,0.08)", animation: "pulse 1.5s infinite" }}
        />
      ) : (
        <p
          style={{
            fontSize:   14,
            lineHeight: 1.6,
            color:      "var(--foreground)",
            whiteSpace: "pre-line",
          }}
        >
          {displayMessage}
        </p>
      )}
    </div>
  );
}
