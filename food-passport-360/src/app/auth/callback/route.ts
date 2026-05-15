import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    return NextResponse.redirect(new URL("/fr/login?error=no_code", origin));
  }

  const locale =
    request.cookies.get("NEXT_LOCALE")?.value ??
    (request.headers.get("accept-language") ?? "fr")
      .split(",")[0]
      .split("-")[0]
      .toLowerCase() ??
    "fr";

  // Destination provisoire — sera remplacée après la lecture du rôle
  const response = NextResponse.redirect(new URL(`/${locale}/`, origin));

  // ── Pattern officiel Supabase SSR pour Route Handler ──────────────────────
  // La response doit exister AVANT exchangeCodeForSession pour que setAll
  // puisse écrire les cookies de session directement sur la réponse HTTP.
  // createClient() de next/headers ne fonctionne PAS ici : ses cookies ne
  // se propagent pas automatiquement vers le NextResponse.redirect retourné.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Écriture directe sur la response — seul chemin garanti
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  // Si destination explicite demandée (ex: ?next=/nutri/players/xxx)
  if (next) {
    response.headers.set(
      "Location",
      new URL(`/${locale}${next}`, origin).toString()
    );
    return response;
  }

  // Résoudre le rôle pour rediriger vers le bon module
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;
    const home = (role && ROLE_HOME[role]) ? ROLE_HOME[role] : "/";

    response.headers.set(
      "Location",
      new URL(`/${locale}${home}`, origin).toString()
    );
  }

  return response;
}
