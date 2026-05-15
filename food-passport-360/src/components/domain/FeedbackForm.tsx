"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { submitFeedbackAction } from "@/app/[locale]/(joueur)/joueur/actions";
import type { FeedbackTopic, SupportedLang } from "@/lib/supabase/food-passport.types";

const ALL_TOPICS: FeedbackTopic[] = [
  "qualite",
  "quantite",
  "temperature",
  "gout",
  "delai",
  "presentation",
];

const SMILEYS = ["😞", "😕", "😐", "🙂", "😄"];

interface Props {
  orderId: string;
  tripId?: string | null;
  hotelId?: string | null;
  playerLang: SupportedLang;
  onSuccess: () => void;
}

export default function FeedbackForm({ orderId, tripId, hotelId, playerLang, onSuccess }: Props) {
  const t = useTranslations("feedback");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [topics, setTopics] = useState<FeedbackTopic[]>([]);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleTopic(topic: FeedbackTopic) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(t("ratingRequired")); return; }
    setError(null);

    startTransition(async () => {
      const result = await submitFeedbackAction({
        orderId,
        tripId: tripId ?? null,
        hotelId: hotelId ?? null,
        topic: topics,
        rating,
        smiley: SMILEYS[rating - 1],
        commentOriginal: comment.trim() || null,
        commentLang: comment.trim() ? playerLang : null,
      });
      if (result.error) { setError(result.error); return; }
      onSuccess();
    });
  }

  const displayRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star rating */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("ratingLabel")}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(n)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  n <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-2xl" aria-hidden>
              {SMILEYS[rating - 1]}
            </span>
          )}
        </div>
      </div>

      {/* Topics */}
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("topicLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {ALL_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                topics.includes(topic)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50"
              }`}
            >
              {t(`topic.${topic}` as "topic.qualite")}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="fb-comment">
          {t("commentLabel")}
        </label>
        <textarea
          id="fb-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
