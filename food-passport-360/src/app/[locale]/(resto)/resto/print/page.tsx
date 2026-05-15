import { createClient } from "@/lib/supabase/server";
import { getKitchenStats, listRestoOrdersToday } from "@/lib/supabase/queries";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import OrderStatusBadge from "@/components/domain/OrderStatusBadge";
import PrintButton from "./PrintButton";

export default async function RestoPrintPage() {
  const supabase = await createClient();
  const t = await getTranslations("restoDashboard");
  const today = new Date().toISOString().slice(0, 10);

  const [stats, orders] = await Promise.all([
    getKitchenStats(supabase, today),
    listRestoOrdersToday(supabase, today),
  ]);

  const todayLabel = new Date(today + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Group by service for print layout
  const byService: Record<string, typeof orders> = {};
  for (const order of orders) {
    if (!byService[order.service]) byService[order.service] = [];
    byService[order.service].push(order);
  }

  return (
    <>
      {/* Screen-only controls */}
      <div className="flex items-center gap-3 px-4 py-4 lg:px-6 print:hidden">
        <Link
          href="/resto"
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft size={16} />
          {t("backToDashboard")}
        </Link>
        <PrintButton label={t("print")} />
      </div>

      {/* Print content */}
      <div className="print-document px-6 py-4 print:px-0 print:py-0">
        {/* Print header */}
        <div className="mb-6 border-b border-border pb-4">
          <h1 className="text-xl font-bold">FOOD PASSPORT 360 — {t("printTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">{todayLabel}</p>

          {/* KPI summary row */}
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span>
              <strong>{stats.total_validated_today}</strong> {t("kpiTotal").toLowerCase()}
            </span>
            <span>
              <strong>{stats.transmise_cuisine}</strong> {t("kpiToPrepare").toLowerCase()}
            </span>
            <span>
              <strong>{stats.en_preparation}</strong> {t("kpiInPrep").toLowerCase()}
            </span>
            <span>
              <strong>{stats.prete}</strong> {t("kpiReady").toLowerCase()}
            </span>
            <span>
              <strong>{stats.livree_today}</strong> {t("kpiDelivered").toLowerCase()}
            </span>
          </div>
        </div>

        {/* Orders by service */}
        {Object.keys(byService).length === 0 ? (
          <p className="text-center text-muted-foreground">{t("noOrders")}</p>
        ) : (
          Object.entries(byService).map(([service, serviceOrders]) => (
            <div key={service} className="mb-6 break-inside-avoid-page">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {service.replace(/_/g, " ")} ({serviceOrders.length})
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-1 pr-4 font-medium text-muted-foreground">Joueur</th>
                    <th className="py-1 pr-4 font-medium text-muted-foreground">Heure</th>
                    <th className="py-1 pr-4 font-medium text-muted-foreground">Plats</th>
                    <th className="py-1 font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/40">
                      <td className="py-1.5 pr-4 font-medium">
                        {order.player_first_name} {order.player_last_name}
                      </td>
                      <td className="py-1.5 pr-4 tabular-nums text-muted-foreground">
                        {new Date(order.scheduled_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Paris",
                        })}
                      </td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{order.items_count}</td>
                      <td className="py-1.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        {/* Print footer */}
        <p className="mt-8 text-xs text-muted-foreground print:block hidden">
          Imprimé le {new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} — FOOD PASSPORT 360
        </p>
      </div>
    </>
  );
}
