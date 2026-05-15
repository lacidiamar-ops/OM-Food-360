import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listTrips } from "@/lib/supabase/queries";
import TripList from "@/components/domain/TripList";

export default async function TripsPage() {
  const supabase = await createClient();
  const t = await getTranslations("trips");
  const trips = await listTrips(supabase);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/team-manager/trips/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t("new")}</span>
        </Link>
      </div>

      <TripList trips={trips} />
    </div>
  );
}
