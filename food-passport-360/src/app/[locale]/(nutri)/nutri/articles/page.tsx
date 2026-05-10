import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listArticlesPendingValidation, listArticles } from "@/lib/supabase/queries";
import ArticleCard from "@/components/domain/ArticleCard";

export async function generateMetadata() {
  const t = await getTranslations("articles");
  return { title: t("validationQueue") };
}

export default async function NutriArticlesPage() {
  const supabase = await createClient();
  const t = await getTranslations("articles");
  const locale = await getLocale();

  const [pending, all] = await Promise.all([
    listArticlesPendingValidation(supabase),
    listArticles(supabase),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-bold text-lg">{t("validationQueue")}</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} {t("articlesToValidate")}
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          {t("pendingValidation")}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center rounded-2xl bg-muted/30">
            {t("allValidated")}
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.map((a) => (
              <li key={a.id}>
                <ArticleCard article={a} href={`/nutri/articles/${a.id}`} showStatus />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Other articles */}
      <section className="space-y-2">
        <Link
          href={`/${locale}/nutri/articles?filter=all`}
          className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          <span>{t("allArticles")} ({all.length})</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
        <ul className="space-y-2">
          {all.slice(0, 20).map((a) => (
            <li key={a.id}>
              <ArticleCard article={a} href={`/nutri/articles/${a.id}`} showStatus />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
