import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getMealSchedulesForWeek } from "@/lib/supabase/schedule-queries";
import MealScheduler from "@/components/planning/MealScheduler";

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("title") };
}

export default async function TeamManagerPlanningPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/login`);
  }

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  const schedules = await getMealSchedulesForWeek(supabase, weekStart, weekEnd);

  return <MealScheduler initialSchedules={schedules} currentUserId={user.id} />;
}
