import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listArticles } from "@/lib/supabase/queries";
import RestoArticlesList from "@/components/domain/RestoArticlesList";

export async function generateMetadata() {
  const t = await getTranslations("articles");
  return { title: t("catalog") };
}

export default async function ArticlesPage() {
  const supabase = await createClient();
  const articles = await listArticles(supabase);
  return <RestoArticlesList articles={articles} />;
}
