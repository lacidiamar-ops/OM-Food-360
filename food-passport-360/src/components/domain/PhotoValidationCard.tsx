"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, ShieldAlert, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ActionPhotoWithPlayer } from "@/lib/supabase/queries";
import { validatePhotoAction } from "@/app/[locale]/(nutri)/nutri/photos/actions";

interface Props {
  photo: ActionPhotoWithPlayer;
  onDone: (id: string) => void;
}

export default function PhotoValidationCard({ photo, onDone }: Props) {
  const t = useTranslations("photoValidation");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase.storage
      .from("action-photos")
      .createSignedUrl(photo.storage_path, 3600)
      .then(({ data }) => { if (data?.signedUrl) setSignedUrl(data.signedUrl); });
  }, [photo.storage_path]);

  function act(status: "validee" | "refusee" | "non_conforme") {
    setError(null);
    startTransition(async () => {
      const result = await validatePhotoAction(photo.id, status, comment.trim() || null);
      if (result.error) { setError(result.error); return; }
      onDone(photo.id);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {signedUrl ? (
          <img
            src={signedUrl}
            alt={photo.caption ?? ""}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            {(photo.player_first_name || photo.player_last_name) && (
              <p className="font-medium text-sm">
                {photo.player_first_name} {photo.player_last_name}
              </p>
            )}
            {photo.order_reference && (
              <p className="text-xs text-muted-foreground font-mono">{photo.order_reference}</p>
            )}
            {photo.caption && (
              <p className="text-xs text-muted-foreground italic">&ldquo;{photo.caption}&rdquo;</p>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground shrink-0">
            {new Date(photo.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("commentPlaceholder")}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {error && (
          <p className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-1.5">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => act("validee")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {t("validate")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("non_conforme")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            {t("nonConforme")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => act("refusee")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" />
            {t("refuse")}
          </button>
        </div>
      </div>
    </div>
  );
}
