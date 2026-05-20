import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function NutritionIndexPage() {
  const locale = await getLocale();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  redirect(`/${locale}/joueur/nutrition/${today}`);
}
