import { createClient } from "@/lib/supabase/server";
import { listHotelOrdersToday, checkHotelHasActiveAccess } from "@/lib/supabase/queries";
import HotelPortal from "@/components/domain/HotelPortal";
import { getTranslations } from "next-intl/server";
import { ShieldOff } from "lucide-react";

export default async function HotelPage() {
  const supabase = await createClient();
  const t = await getTranslations("hotelPortal");
  const today = new Date().toISOString().slice(0, 10);

  const hasAccess = await checkHotelHasActiveAccess(supabase);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <ShieldOff size={40} className="text-muted-foreground/40" />
        <h1 className="text-lg font-semibold">{t("noAccessTitle")}</h1>
        <p className="text-sm text-muted-foreground max-w-xs">{t("noAccessDesc")}</p>
      </div>
    );
  }

  const orders = await listHotelOrdersToday(supabase, today);
  return <HotelPortal orders={orders} date={today} />;
}
