"use server";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

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

  const body = await req.json() as {
    userId?: string; fullName?: string; role?: string; preferredLang?: string; active?: boolean;
  };
  const { userId, fullName, role, preferredLang, active } = body;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { error } = await supabase
    .schema("food_passport" as never)
    .from("profiles")
    .update({
      ...(fullName !== undefined && { full_name: fullName }),
      ...(role !== undefined && { role }),
      ...(preferredLang !== undefined && { preferred_lang: preferredLang }),
      ...(active !== undefined && { active }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .schema("food_passport" as never)
    .from("audit_logs")
    .insert({
      action: "admin_user_updated",
      entity_type: "auth_user",
      entity_id: userId,
      performed_by: user.id,
      metadata: { role, active },
    });

  return NextResponse.json({ success: true });
}
