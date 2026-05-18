import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/supabase/queries";
import AdminDashboard from "@/components/admin/AdminDashboard";

const ADMIN_ROLES = new Set(["super_admin", "direction"]);

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminPage() {
  const locale = await getLocale();
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  // Role check — defense in depth (layout also checks)
  const { data: profile } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role || !ADMIN_ROLES.has(profile.role as string)) {
    redirect(`/${locale}/login`);
  }

  const stats = await getGlobalStats(supabase);

  return <AdminDashboard stats={stats} />;
}
