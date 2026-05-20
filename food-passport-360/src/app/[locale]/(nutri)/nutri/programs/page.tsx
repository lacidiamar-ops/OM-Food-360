import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProgramCard from "@/components/nutrition/ProgramCard";
import type { FPProgramWithStats } from "@/lib/supabase/food-passport.types";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NutriProgramsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("nutrition");
  const supabase = await createClient();

  const { data } = await supabase
    .schema("food_passport" as never)
    .from("nutrition_programs")
    .select("*")
    .order("created_at", { ascending: false });

  const programs = (data ?? []) as FPProgramWithStats[];

  return (
    <div className="space-y-6 px-4 py-6">
      <PageHeader
        label={t("sectionLabel")}
        title={t("programsTitle")}
        action={
          <Link
            href={`/${locale}/nutri/programs/new`}
            className="btn-primary inline-flex items-center px-4 py-2 text-sm"
          >
            + {t("newProgram")}
          </Link>
        }
      />

      {programs.length === 0 ? (
        <EmptyState
          icon="🥗"
          title={t("emptyProgramsTitle")}
          description={t("emptyProgramsDesc")}
          action={{
            label: t("newProgram"),
            href:  `/${locale}/nutri/programs/new`,
          }}
        />
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}
