import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import UsersPageClient from "./UsersPageClient";

export default async function AdminUsersPage() {
  const locale = await getLocale();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect(`/${locale}/admin`);

  const { data: profiles } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("id, full_name, email, role, preferred_lang, active, created_at")
    .order("created_at", { ascending: false });

  return <UsersPageClient profiles={profiles ?? []} />;
}
