import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function assertSuperAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "Unauthorized" };
  const { data: profile } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") return { supabase: null, user: null, error: "Forbidden" };
  return { supabase, user, error: null };
}

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await assertSuperAdmin();
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  }

  const body = await req.json() as { userId?: string; newPassword?: string };
  const { userId, newPassword } = body;

  if (!userId || !newPassword) {
    return NextResponse.json({ error: "userId and newPassword required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const adminClient = getAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  await supabase
    .schema("food_passport" as never)
    .from("audit_logs")
    .insert({
      action: "admin_password_reset",
      entity_type: "auth_user",
      entity_id: userId,
      performed_by: user.id,
      metadata: { reset_by_role: "super_admin" },
    });

  return NextResponse.json({ success: true });
}
