import { useTranslations } from "next-intl";
import type { FeedbackTopic } from "@/lib/supabase/food-passport.types";

const COLORS: Record<string, string> = {
  qualite: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  quantite: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  temperature: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  gout: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  delai: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  presentation: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
};

interface Props {
  topic: FeedbackTopic | string;
}

export default function FeedbackTopicBadge({ topic }: Props) {
  const t = useTranslations("feedback");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${COLORS[topic] ?? "bg-muted text-muted-foreground"}`}
    >
      {t(`topic.${topic}` as Parameters<typeof t>[0])}
    </span>
  );
}
