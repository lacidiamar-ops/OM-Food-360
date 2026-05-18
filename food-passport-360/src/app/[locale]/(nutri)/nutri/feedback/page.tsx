import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listFeedbacks, type FeedbackWithPlayer } from "@/lib/supabase/queries";
import FeedbackCard from "@/components/domain/FeedbackCard";
import { Star } from "lucide-react";

export default async function NutriFeedbackPage() {
  const supabase = await createClient();
  const t = await getTranslations("feedback");
  const feedbacks = await listFeedbacks(supabase, 50);

  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum: number, f: FeedbackWithPlayer) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("nutri.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("nutri.subtitle")}</p>
        </div>
        {avgRating && (
          <div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-warning">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-semibold text-sm">{avgRating}</span>
            <span className="text-xs">/ 5</span>
          </div>
        )}
      </div>

      {feedbacks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("nutri.empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb: FeedbackWithPlayer) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}
