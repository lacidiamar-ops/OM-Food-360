import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNutriProgram } from "@/lib/nutrition-ai";
import type { TrainingLoadEntry } from "@/lib/supabase/food-passport.types";

interface RequestBody {
  player: {
    weight_kg:             number;
    position:              string;
    age?:                  number;
    dietary_restrictions?: string;
    health_notes?:         string;
  };
  matchDate:    string;
  startDate:    string;
  endDate:      string;
  trainingLoad: TrainingLoadEntry[];
  programName:  string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: RequestBody = await request.json();

  const {
    player,
    matchDate,
    startDate,
    endDate,
    trainingLoad,
    programName,
  } = body;

  const plans = await generateNutriProgram({
    player: {
      weight_kg:             player.weight_kg ?? 75,
      position:              player.position ?? "milieu",
      age:                   player.age,
      dietary_restrictions:  player.dietary_restrictions,
      health_notes:          player.health_notes,
    },
    matchDate,
    startDate,
    endDate,
    trainingLoad: trainingLoad ?? [],
    programName,
  });

  return NextResponse.json(plans);
}
