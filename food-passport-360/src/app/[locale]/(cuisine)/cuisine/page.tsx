import { createClient } from "@/lib/supabase/server";
import { listKitchenOrders } from "@/lib/supabase/queries";
import KitchenBoard from "@/components/domain/KitchenBoard";

export default async function CuisinePage() {
  const supabase = await createClient();
  const orders = await listKitchenOrders(supabase);

  return <KitchenBoard initialOrders={orders} />;
}
