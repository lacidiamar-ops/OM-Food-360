"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageOff } from "lucide-react";
import type { ActionPhotoWithPlayer } from "@/lib/supabase/queries";
import PhotoValidationCard from "./PhotoValidationCard";

interface Props {
  photos: ActionPhotoWithPlayer[];
}

export default function PhotoValidationQueue({ photos: initial }: Props) {
  const t = useTranslations("photoValidation");
  const [photos, setPhotos] = useState(initial);

  function remove(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <ImageOff className="h-10 w-10 text-muted-foreground/30" />
        <p className="font-medium text-sm">{t("emptyTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("emptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo) => (
        <PhotoValidationCard key={photo.id} photo={photo} onDone={remove} />
      ))}
    </div>
  );
}
