"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
    <form onSubmit={handleExport} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="exp-from">{t("from")}</label>
          <input
            id="exp-from"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="exp-to">{t("to")}</label>
          <input
            id="exp-to"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-muted/40 border border-border p-4 space-y-1 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("contentTitle")}</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
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
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60"
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
