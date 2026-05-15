"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Camera, CheckCircle, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadActionPhotoAction } from "@/app/[locale]/(joueur)/joueur/actions";

async function resizeForUpload(file: File, maxDim = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))),
        "image/webp",
        0.85
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

interface Props {
  orderId: string;
  userId: string;
  tripId?: string | null;
  onSuccess?: (storagePath: string) => void;
}

export default function ActionPhotoUpload({ orderId, userId, tripId, onSuccess }: Props) {
  const t = useTranslations("photo");
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError(t("fileTooLarge"));
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFile(fakeEvent);
    }
  }

  function clear() {
    setPreview(null);
    setCaption("");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !preview) return;
    setError(null);

    startTransition(async () => {
      let blob: Blob;
      try {
        blob = await resizeForUpload(file);
      } catch {
        setError(t("processingError"));
        return;
      }

      const ext = "webp";
      const path = `${userId}/${orderId}/${Date.now()}.${ext}`;
      const supabase = createClient();

      const { error: storageError } = await supabase.storage
        .from("action-photos")
        .upload(path, blob, { contentType: "image/webp", upsert: false });

      if (storageError) {
        setError(storageError.message);
        return;
      }

      const result = await uploadActionPhotoAction({
        storagePath: path,
        orderId,
        tripId: tripId ?? null,
        caption: caption.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setDone(true);
      onSuccess?.(path);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <p className="font-medium text-sm">{t("uploaded")}</p>
        <p className="text-xs text-muted-foreground">{t("pendingValidation")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <Camera className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center space-y-1">
            <p className="font-medium text-sm">{t("dropOrClick")}</p>
            <p className="text-xs text-muted-foreground">{t("formats")}</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
          <img src={preview} alt="" className="w-full h-full object-contain" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/webp,image/jpeg,image/png"
        onChange={handleFile}
        className="sr-only"
      />

      {preview && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="ap-caption">
              {t("captionLabel")}
            </label>
            <input
              id="ap-caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t("captionPlaceholder")}
              className="w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={pending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {t("uploadBtn")}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
