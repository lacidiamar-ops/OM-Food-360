import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listActionPhotosPending } from "@/lib/supabase/queries";
import PhotoValidationQueue from "@/components/domain/PhotoValidationQueue";

export default async function NutriPhotosPage() {
  const supabase = await createClient();
  const t = await getTranslations("photoValidation");
  const photos = await listActionPhotosPending(supabase, "nutri");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {photos.length > 0 && (
          <span className="rounded-full bg-warning/10 text-warning px-2.5 py-0.5 text-xs font-medium">
            {photos.length}
          </span>
        )}
      </div>
      <PhotoValidationQueue photos={photos} />
    </div>
  );
}
