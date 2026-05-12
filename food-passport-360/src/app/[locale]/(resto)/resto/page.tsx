import { createClient } from "@/lib/supabase/server";
import { getKitchenStats, listRestoOrdersToday } from "@/lib/supabase/queries";
import RestoDashboard from "@/components/domain/RestoDashboard";

export default async function RestoPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [stats, orders] = await Promise.all([
    getKitchenStats(supabase, today),
    listRestoOrdersToday(supabase, today),
  ]);

  return <RestoDashboard stats={stats} orders={orders} date={today} />;
}
