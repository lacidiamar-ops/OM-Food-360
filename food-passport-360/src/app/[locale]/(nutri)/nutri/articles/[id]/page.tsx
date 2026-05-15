import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getArticleWithTranslations } from "@/lib/supabase/queries";
import ArticleValidationPanel from "@/components/domain/ArticleValidationPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NutriArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { article } = await getArticleWithTranslations(supabase, id);
  if (!article) notFound();
  return <ArticleValidationPanel article={article} />;
}
