import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listMenus } from "@/lib/supabase/queries";
import MenuCard from "@/components/domain/MenuCard";

export async function generateMetadata() {
  const t = await getTranslations("menus");
  return { title: t("title") };
}

export default async function MenusPage() {
  const supabase = await createClient();
  const t = await getTranslations("menus");
  const locale = await getLocale();

  // 30 days back / 30 days forward
  const today = new Date();
  const from = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);

  const menus = await listMenus(supabase, { from, to });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">{t("title")}</h1>
        <Link
          href={`/${locale}/resto/menus/new`}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground text-sm px-3 py-2 font-medium hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("new")}
        </Link>
      </div>

      {menus.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">{t("empty")}</p>
      )}

      <ul className="space-y-2">
        {menus.map((m) => (
          <li key={m.id}>
            <MenuCard menu={m} href={`/resto/menus/${m.id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
