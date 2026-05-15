import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    return NextResponse.redirect(new URL("/fr/login?error=no_code", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/fr/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Session établie — lire le rôle pour rediriger directement vers la bonne vue
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale =
    request.cookies.get("NEXT_LOCALE")?.value ??
    request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ??
    "fr";

  // Si une destination explicite est demandée, l'utiliser
  if (next) {
    return NextResponse.redirect(new URL(`/${locale}${next}`, origin));
  }

  // Sinon, résoudre le rôle et rediriger vers le home du rôle
  if (user) {
    const { data: profile } = await supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const ROLE_HOME: Record<string, string> = {
      joueur: "/joueur",
      admin_nutri: "/nutri",
      admin_resto: "/resto",
      cuisine: "/cuisine",
      hotel: "/hotel",
      admin_team_manager: "/team-manager",
      super_admin: "/admin",
      direction: "/admin",
    };

    const role = profile?.role as string | undefined;
    const home = (role && ROLE_HOME[role]) ? ROLE_HOME[role] : "/";
    return NextResponse.redirect(new URL(`/${locale}${home}`, origin));
  }

  return NextResponse.redirect(new URL(`/${locale}/`, origin));
}
