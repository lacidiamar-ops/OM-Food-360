import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as {
    prescribedSupplementId?: string;
    playerId?: string;
    taken?: boolean;
  } | null;

  if (!body?.prescribedSupplementId || !body?.playerId || body?.taken === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: prescribedSupplementId, playerId, taken" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== body.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .schema("food_passport" as never)
    .from("supplement_consumption")
    .upsert(
      {
        prescribed_supplement_id: body.prescribedSupplementId,
        player_id:                body.playerId,
        taken:                    body.taken,
        taken_at:                 body.taken ? new Date().toISOString() : null,
      },
      { onConflict: "prescribed_supplement_id,player_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
