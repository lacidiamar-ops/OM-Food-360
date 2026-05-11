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
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Link
            href={`/${locale}/joueur/commander`}
            className="text-sm font-medium text-primary"
          >
            {t("emptyCta")} →
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
