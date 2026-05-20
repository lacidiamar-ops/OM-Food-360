import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateDailyScore } from "@/lib/nutrition-score";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as {
    dailyPlanId?: string;
    playerId?: string;
    service?: string;
    vegetables_g_actual?: number;
    starch_g_actual?: number;
    protein_g_actual?: number;
    water_ml_actual?: number;
  } | null;

  if (!body?.dailyPlanId || !body?.playerId || !body?.service) {
    return NextResponse.json({ error: "Missing required fields: dailyPlanId, playerId, service" }, { status: 400 });
  }

  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== body.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build upsert payload — only include numeric fields that are present
  const upsertPayload: Record<string, unknown> = {
    daily_plan_id: body.dailyPlanId,
    player_id:     body.playerId,
    service:       body.service,
    consumed_at:   new Date().toISOString(),
  };

  if (body.vegetables_g_actual !== undefined) upsertPayload.vegetables_g_actual = body.vegetables_g_actual;
  if (body.starch_g_actual     !== undefined) upsertPayload.starch_g_actual     = body.starch_g_actual;
  if (body.protein_g_actual    !== undefined) upsertPayload.protein_g_actual    = body.protein_g_actual;
  if (body.water_ml_actual     !== undefined) upsertPayload.water_ml_actual     = body.water_ml_actual;

  const { error } = await supabase
    .schema("food_passport" as never)
    .from("meal_consumption")
    .upsert(upsertPayload, { onConflict: "daily_plan_id,player_id,service" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate score after upsert
  try {
    const score = await calculateDailyScore(supabase, body.dailyPlanId, body.playerId);
    return NextResponse.json(score);
  } catch {
    // Score calc failure is non-blocking
    return NextResponse.json({ ok: true });
  }
}
