import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, water_type, quantity_ml, context, urine_color } = body;

  if (!date || !water_type || !quantity_ml) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .schema("food_passport")
    .from("hydration_log")
    .insert({
      player_id: user.id,
      date,
      water_type,
      quantity_ml,
      context: context ?? null,
      urine_color: urine_color ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Alert nutri if urine_color >= 6
  if (urine_color && urine_color >= 6) {
    const { data: profile } = await supabase
      .schema("food_passport")
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Insert notification for nutri (best effort)
    await supabase
      .schema("food_passport")
      .from("audit_logs")
      .insert({
        action: "hydration_alert",
        entity_type: "hydration_log",
        entity_id: data.id,
        performed_by: user.id,
        metadata: {
          urine_color,
          player_name: profile?.full_name ?? "Joueur inconnu",
          date,
          alert: "Indicateur déshydratation — urine_color >= 6",
        },
      })
      .then(() => {});
  }

  return NextResponse.json({ data });
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const player_id = searchParams.get("player_id") ?? user.id;

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const { data, error } = await supabase
    .schema("food_passport")
    .from("hydration_log")
    .select("*")
    .eq("player_id", player_id)
    .eq("date", date)
    .order("logged_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
