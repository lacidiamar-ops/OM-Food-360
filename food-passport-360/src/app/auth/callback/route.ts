import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Redirect target: explicit next param, or root (proxy handles role redirect)
  const destination = next ? `/${locale}${next}` : `/${locale}/`;

  // ── Official Supabase SSR pattern for Route Handlers ─────────────────────
  // The response MUST exist before createServerClient so that setAll can write
  // session cookies directly to it as exchangeCodeForSession fires SIGNED_IN.
  // Any mutation of Location header after the fact is unreliable — instead we
  // always redirect to /{locale}/ and rely on the proxy to bounce the user to
  // their role-specific home page on the next request.
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
          // Write session cookies directly onto the response that will be sent.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/login?error=${encodeURIComponent(error.message)}`,
        origin
      )
    );
  }

  return response;
}
