import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listOrdersForExport } from "@/lib/supabase/queries";
import { generateOrdersExcel } from "@/lib/export/excel";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Vérification auth — rôles autorisés uniquement
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .schema("food_passport")
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowed = ["super_admin", "admin_nutri", "admin_resto", "admin_team_manager", "direction"];
  if (!profile || !allowed.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to   = searchParams.get("to")   ?? new Date().toISOString().slice(0, 10);

  const rows = await listOrdersForExport(supabase, from, to);
  const buffer = generateOrdersExcel(rows, from, to);
  const filename = `fp360-commandes-${from}-${to}.xlsx`;

  // Convertir en Uint8Array pour NextResponse (Buffer n'est pas BodyInit dans Edge)
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
