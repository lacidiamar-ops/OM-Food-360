"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FeedbackWithPlayer } from "@/lib/supabase/queries";
import FeedbackTopicBadge from "./FeedbackTopicBadge";
import type { FeedbackTopic } from "@/lib/supabase/food-passport.types";

interface Props {
  feedback: FeedbackWithPlayer;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function FeedbackCard({ feedback }: Props) {
  const t = useTranslations("feedback");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">
            {feedback.player_first_name} {feedback.player_last_name}
          </p>
          {feedback.order_reference && (
            <p className="text-xs text-muted-foreground font-mono">{feedback.order_reference}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            {feedback.smiley && <span className="text-lg">{feedback.smiley}</span>}
            <Stars rating={feedback.rating} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {new Date(feedback.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {feedback.topic.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {feedback.topic.map((tp) => (
            <FeedbackTopicBadge key={tp} topic={tp as FeedbackTopic} />
          ))}
        </div>
      )}

      {feedback.comment_original && (
        <p className="text-sm text-muted-foreground border-l-2 border-border pl-3 italic">
          &ldquo;{feedback.comment_original}&rdquo;
        </p>
      )}
    </div>
  );
}
