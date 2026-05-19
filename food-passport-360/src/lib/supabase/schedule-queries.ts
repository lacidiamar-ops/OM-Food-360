import type { SupabaseClient } from "@supabase/supabase-js";
import type { FPMealSchedule } from "./food-passport.types";

export async function getMealSchedulesForWeek(
  supabase: SupabaseClient,
  weekStart: string, // ISO date string YYYY-MM-DD (Monday)
  weekEnd: string    // ISO date string YYYY-MM-DD (Sunday)
): Promise<FPMealSchedule[]> {
  const { data } = await supabase
    .schema("food_passport" as never)
    .from("meal_schedules")
    .select("*")
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("time_start", { ascending: true });

  return (data as FPMealSchedule[]) ?? [];
}

export async function createMealSchedule(
  supabase: SupabaseClient,
  payload: Omit<FPMealSchedule, "id" | "created_at">
): Promise<{ data: FPMealSchedule | null; error: string | null }> {
  const { data, error } = await supabase
    .schema("food_passport" as never)
    .from("meal_schedules")
    .insert(payload)
    .select()
    .single();

  return { data: data as FPMealSchedule | null, error: error?.message ?? null };
}

export async function updateMealSchedule(
  supabase: SupabaseClient,
  id: string,
  payload: Partial<Omit<FPMealSchedule, "id" | "created_at" | "created_by">>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .schema("food_passport" as never)
    .from("meal_schedules")
    .update(payload)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function deleteMealSchedule(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .schema("food_passport" as never)
    .from("meal_schedules")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}
