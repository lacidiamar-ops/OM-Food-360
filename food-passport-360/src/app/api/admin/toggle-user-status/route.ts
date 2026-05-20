import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as { userId?: string; active?: boolean };
  const { userId, active } = body;
  if (!userId || active === undefined) {
    return NextResponse.json({ error: "userId and active required" }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const adminClient = getAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : "876600h",
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  await supabase
    .schema("food_passport" as never)
    .from("audit_logs")
    .insert({
      action: active ? "admin_user_reactivated" : "admin_user_deactivated",
      entity_type: "auth_user",
      entity_id: userId,
      performed_by: user.id,
      metadata: { new_status: active },
    });

  return NextResponse.json({ success: true });
}
