"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  color: "var(--foreground)",
  padding: "10px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

export default function ExportForm() {
  const t = useTranslations("export");
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  async function handleExport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = `/api/export/orders?from=${from}&to=${to}`;
      const res = await fetch(url);
      if (!res.ok) { alert(t("error")); return; }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `fp360-commandes-${from}-${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleExport} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="exp-from">
            {t("from")}
          </label>
          <input
            id="exp-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="exp-to">
            {t("to")}
          </label>
          <input
            id="exp-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>
      </div>

      <div
        className="p-4 space-y-1 text-sm"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
        }}
      >
        <p className="font-medium">{t("contentTitle")}</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
          <li>{t("col1")}</li>
          <li>{t("col2")}</li>
          <li>{t("col3")}</li>
          <li>{t("col4")}</li>
          <li>{t("col5")}</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 font-semibold disabled:opacity-60"
        style={{ borderRadius: "16px" }}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />{t("generating")}</>
        ) : (
          <><Download className="h-4 w-4" />{t("download")}</>
        )}
      </button>
    </form>
  );
}
