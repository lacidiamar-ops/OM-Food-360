import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByProfileId, listMyOrders } from "@/lib/supabase/queries";
import OrderListItem from "@/components/domain/OrderListItem";

export async function generateMetadata() {
  const t = await getTranslations("orders");
  return { title: t("title") };
}

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const player = await getPlayerByProfileId(supabase, user.id);
  const t = await getTranslations("orders");

  if (!player) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  const orders = await listMyOrders(supabase, player.id);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-lg">{t("title")}</h1>
        <Link
          href={`/${locale}/joueur/commander`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-sm px-3 py-1.5 font-medium active:scale-95 transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newOrder")}
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div>
            <p className="empty-state__title">{t("empty")}</p>
            <p className="empty-state__sub">{t("emptyDesc")}</p>
          </div>
          <Link
            href={`/${locale}/joueur/commander`}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <OrderListItem key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
}
