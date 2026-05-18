import { useTranslations } from "next-intl";
import type { FeedbackTopic } from "@/lib/supabase/food-passport.types";

const COLORS: Record<string, string> = {
  qualite: "bg-active/10 text-active",
  quantite: "bg-om/10 text-om",
  temperature: "bg-energy/10 text-energy",
  gout: "bg-energy/10 text-energy",
  delai: "bg-warning/10 text-warning",
  presentation: "bg-energy/10 text-energy",
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
