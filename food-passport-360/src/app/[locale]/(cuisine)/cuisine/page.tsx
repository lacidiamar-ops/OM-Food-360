import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { listKitchenOrders } from "@/lib/supabase/queries";
import KitchenBoard from "@/components/domain/KitchenBoard";

export default async function CuisinePage() {
  const supabase = await createClient();
  const t = await getTranslations("cuisine");
  const orders = await listKitchenOrders(supabase);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6">
      <div>
        <h1 className="text-lg font-semibold capitalize">{t("title")}</h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="text-4xl">✅</span>
          <p className="font-medium">{t("emptyBoard")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyBoardDesc")}</p>
        </div>
      ) : (
        <KitchenBoard initialOrders={orders} />
      )}
    </div>
  );
}
