import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getArticleWithTranslations } from "@/lib/supabase/queries";
import ArticleEditor from "@/components/domain/ArticleEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { article, translations } = await getArticleWithTranslations(supabase, id);
  if (!article) notFound();
  return <ArticleEditor article={article} translations={translations} />;
}
