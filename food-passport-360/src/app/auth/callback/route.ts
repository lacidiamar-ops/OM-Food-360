import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

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

  // Capture cookies written by exchangeCodeForSession — we'll apply them to the
  // final response once we know the redirect destination.
  const pendingCookies: Array<{ name: string; value: string; options: Partial<ResponseCookie> }> = [];

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
            pendingCookies.push({ name, value, options });
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

  // Determine redirect destination
  let destination: string;

  if (next) {
    destination = `/${locale}${next}`;
  } else {
    // Read role from DB to redirect to the right module home
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
      const home = role && ROLE_HOME[role] ? ROLE_HOME[role] : "/";
      destination = `/${locale}${home}`;
    } else {
      destination = `/${locale}/`;
    }
  }

  // Build the final response with the correct destination URL, then apply all
  // session cookies that were captured during exchangeCodeForSession.
  const response = NextResponse.redirect(new URL(destination, origin));

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
