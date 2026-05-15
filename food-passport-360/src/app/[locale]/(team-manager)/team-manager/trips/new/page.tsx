import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listHotels } from "@/lib/supabase/queries";
import TripForm from "@/components/domain/TripForm";

export default async function NewTripPage() {
  const supabase = await createClient();
  const t = await getTranslations("trips");
  const hotels = await listHotels(supabase);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{t("newTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("newSubtitle")}</p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <TripForm hotels={hotels} />
      </div>
    </div>
  );
}
