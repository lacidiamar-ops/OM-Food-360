import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ExportForm from "./ExportForm";

export default async function ExportPage() {
  const t = await getTranslations("export");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/resto" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <ExportForm />
      </div>
    </div>
  );
}
