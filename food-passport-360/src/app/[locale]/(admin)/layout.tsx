import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/shell/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  return (
    <AppShell title="Administration" role="super_admin">
      {children}
    </AppShell>
  );
}
