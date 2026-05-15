import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/supabase/queries";
import AdminDashboard from "@/components/domain/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const stats = await getGlobalStats(supabase);
  return <AdminDashboard stats={stats} />;
}
