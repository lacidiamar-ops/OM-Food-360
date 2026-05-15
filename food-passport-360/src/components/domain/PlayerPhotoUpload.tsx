"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { savePlayerAction } from "@/app/[locale]/(nutri)/nutri/players/[id]/actions";
import { cn } from "@/lib/utils";

interface Props {
  playerId: string;
  currentPhotoUrl: string | null;
  initials: string;
  onSuccess: (url: string) => void;
}

// Resize + center-crop image to square WebP ≤ 400×400
async function resizeToSquare(file: File, size = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No canvas context"));
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob failed"))),
        "image/webp",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    img.src = objectUrl;
  });
}

export default function PlayerPhotoUpload({
  playerId,
  currentPhotoUrl,
  initials,
  onSuccess,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Resize client-side
      const blob = await resizeToSquare(file);

      // Upload to Supabase Storage
      const supabase = createClient();
      const path = `players/${playerId}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from("player-photos")
        .upload(path, blob, { contentType: "image/webp", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("player-photos")
        .getPublicUrl(path);

      // Cache-bust so the browser reloads the new image
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // Persist URL in DB via server action
      const { error: saveError } = await savePlayerAction(playerId, {
        photo_url: data.publicUrl,
      });
      if (saveError) throw new Error(saveError);

      setPreviewUrl(publicUrl);
      onSuccess(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "group relative h-20 w-20 rounded-2xl overflow-hidden",
          "ring-2 ring-border hover:ring-primary/50 transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isUploading && "opacity-60 pointer-events-none"
        )}
        aria-label="Modifier la photo du joueur"
      >
        {/* Photo or initials */}
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Photo joueur"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1",
            "bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            isUploading && "opacity-100"
          )}
        >
          {isUploading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Camera size={18} />
              <span className="text-[10px] font-medium">Modifier</span>
            </>
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {error && (
        <p className="max-w-[160px] text-center text-[11px] text-destructive">{error}</p>
      )}

      <p className="text-[10px] text-muted-foreground/70">JPG, PNG ou WebP · max 2 Mo</p>
    </div>
  );
}
