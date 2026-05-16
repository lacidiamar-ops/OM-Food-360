import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  const locale =
    request.cookies.get("NEXT_LOCALE")?.value ??
    (request.headers.get("accept-language") ?? "fr")
      .split(",")[0]
      .split("-")[0]
      .toLowerCase() ??
    "fr";

  // ── Diagnostic: log incoming request state ────────────────────────────────
  console.log("[auth/callback] origin:", origin);
  console.log("[auth/callback] code present:", !!code);
  console.log(
    "[auth/callback] cookies:",
    request.cookies
      .getAll()
      .map((c) => c.name)
      .join(", ") || "(none)"
  );

  if (!code) {
    console.error("[auth/callback] no code in query — redirecting to login");
    return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, origin));
  }

  // Destination after auth: explicit ?next or root (proxy handles role bounce)
  const destination = next ? `/${locale}${next}` : `/${locale}/`;

  // ── Official Supabase SSR pattern ─────────────────────────────────────────
  // Response is created BEFORE createServerClient so setAll can write session
  // cookies directly onto it when exchangeCodeForSession fires SIGNED_IN.
  const response = NextResponse.redirect(new URL(destination, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          console.log(
            "[auth/callback] setAll called with",
            cookiesToSet.map((c) => c.name).join(", ")
          );
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message, error.code);
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?error=${encodeURIComponent(error.message)}`,
        origin
      )
    );
  }

  console.log("[auth/callback] success — redirecting to", destination);
  return response;
}
