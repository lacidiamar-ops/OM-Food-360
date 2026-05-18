import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";

const ADMIN_ROLES = new Set(["super_admin", "direction"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role || !ADMIN_ROLES.has(profile.role as string)) {
    redirect(`/${locale}/login`);
  }

  return (
    <AppShell title="Administration" role="super_admin">
      {children}
    </AppShell>
  );
}
