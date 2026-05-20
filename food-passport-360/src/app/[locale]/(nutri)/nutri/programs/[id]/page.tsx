import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatusBadge } from "@/components/ui";
import TrainingLoadCalendar from "@/components/nutrition/TrainingLoadCalendar";
import TeamChallenge from "@/components/nutrition/TeamChallenge";
import type { FPNutritionProgram, ProgramStatus } from "@/lib/supabase/food-passport.types";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

function programToStatusBadge(
  status: ProgramStatus
): "pending" | "processing" | "validated" | "refused" | "info" {
  switch (status) {
    case "draft":
      return "pending";
    case "active":
      return "processing";
    case "completed":
      return "validated";
    case "archived":
      return "refused";
    default:
      return "info";
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("nutrition");
  return { title: `${t("programs")} · ${id}` };
}

export default async function NutriProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("nutrition");

  const supabase = await createClient();

  // Auth + role check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin_nutri", "super_admin"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch the program
  const { data: program, error } = await supabase
    .from("nutrition_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !program) {
    notFound();
  }

  const fp = program as FPNutritionProgram;

  // Count daily plans
  const { count: planCount } = await supabase
    .from("daily_nutrition_plans")
    .select("*", { count: "exact", head: true })
    .eq("program_id", id);

  // Avg score
  const { data: scoreData } = await supabase
    .from("daily_scores")
    .select("score_percent")
    .eq("program_id", id)
    .not("score_percent", "is", null);

  const avgScore =
    scoreData && scoreData.length > 0
      ? Math.round(
          scoreData.reduce((sum, s) => sum + (s.score_percent ?? 0), 0) /
            scoreData.length
        )
      : null;

  // Fetch players
  const playerIds: string[] = Array.isArray(fp.player_ids) ? fp.player_ids : [];
  const { data: playerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", playerIds);

  const playerCount = playerProfiles?.length ?? 0;

  const GLASS = {
    background: "rgba(255,255,255,0.03)",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  } as const;

  return (
    <div className="space-y-6 px-4 pb-24">
      {/* Header */}
      <PageHeader
        label={t("programs")}
        title={fp.name}
        action={<StatusBadge status={programToStatusBadge(fp.status)} />}
      />

      {/* Program info cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div style={GLASS} className="px-4 py-3 space-y-1">
          <p className="text-xs opacity-50">{t("startDate")}</p>
          <p className="text-sm font-semibold">
            {new Date(fp.start_date).toLocaleDateString()}
          </p>
        </div>
        <div style={GLASS} className="px-4 py-3 space-y-1">
          <p className="text-xs opacity-50">{t("endDate")}</p>
          <p className="text-sm font-semibold">
            {new Date(fp.end_date).toLocaleDateString()}
          </p>
        </div>
        <div style={GLASS} className="px-4 py-3 space-y-1">
          <p className="text-xs opacity-50">{t("selectPlayers")}</p>
          <p className="text-sm font-semibold">{playerCount}</p>
        </div>
        {fp.match_date && (
          <div style={GLASS} className="px-4 py-3 space-y-1">
            <p className="text-xs opacity-50">{t("matchDate")}</p>
            <p className="text-sm font-semibold">
              {new Date(fp.match_date).toLocaleDateString()}
            </p>
          </div>
        )}
        {avgScore !== null && (
          <div style={GLASS} className="px-4 py-3 space-y-1">
            <p className="text-xs opacity-50">{t("challenge.avgScore")}</p>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--color-active)" }}
            >
              {avgScore}%
            </p>
          </div>
        )}
        <div style={GLASS} className="px-4 py-3 space-y-1">
          <p className="text-xs opacity-50">{t("step2")}</p>
          <p className="text-sm font-semibold">{planCount ?? 0} plans</p>
        </div>
      </div>

      {/* Training load calendar */}
      {fp.training_load && fp.training_load.length > 0 && (
        <div style={GLASS} className="p-4">
          <p className="text-sm font-semibold mb-3 opacity-70">
            {t("trainingLoad")}
          </p>
          <TrainingLoadCalendar
            startDate={fp.start_date}
            endDate={fp.end_date}
            matchDate={fp.match_date}
            value={fp.training_load}
            onChange={() => {}}
            readonly={true}
          />
        </div>
      )}

      {/* Team Challenge */}
      <TeamChallenge
        programId={id}
        currentUserId={user.id}
        isNutri={true}
      />
    </div>
  );
}
