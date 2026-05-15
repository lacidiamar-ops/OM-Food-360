import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";
import type { UserRole } from "./lib/rbac/types";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/auth"];

// Paths sans préfixe locale qui doivent passer sans auth check
const PUBLIC_ROOT_PREFIXES = ["/auth/"];

// Cookie name for caching the user role across requests
const ROLE_COOKIE = "fp360_role";

// Role → base path mapping
const ROLE_HOME: Record<UserRole, string> = {
  joueur: "/joueur",
  admin_nutri: "/nutri",
  admin_resto: "/resto",
  cuisine: "/cuisine",
  hotel: "/hotel",
  admin_team_manager: "/team-manager",
  super_admin: "/admin",
  direction: "/admin",
};

// Paths each role is allowed to access (prefix match)
const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  joueur: ["/joueur", "/profile"],
  admin_nutri: ["/nutri", "/profile"],
  admin_resto: ["/resto", "/profile"],
  cuisine: ["/cuisine", "/profile"],
  hotel: ["/hotel", "/profile"],
  admin_team_manager: ["/team-manager", "/profile"],
  super_admin: [
    "/admin",
    "/joueur",
    "/nutri",
    "/resto",
    "/cuisine",
    "/team-manager",
    "/hotel",
    "/profile",
  ],
  direction: ["/admin", "/profile"],
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) =>
    routing.locales.some(
      (locale) =>
        pathname === `/${locale}${p}` ||
        pathname.startsWith(`/${locale}${p}/`)
    )
  );
}

function getLocaleFromPath(pathname: string) {
  return (
    routing.locales.find(
      (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
    ) ?? routing.defaultLocale
  );
}

// Strip /{locale} prefix to get the bare pathname
function stripLocale(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
    if (pathname === `/${locale}`) return "/";
  }
  return pathname;
}

function isRootOrIndex(bare: string) {
  return bare === "/" || bare === "";
}

function isAllowed(role: UserRole, bare: string) {
  return ROLE_ALLOWED_PREFIXES[role].some((p) => bare === p || bare.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Laisser passer /auth/* sans aucun traitement Supabase
  //    Le callback OTP doit pouvoir échanger le code AVANT qu'une session existe.
  if (PUBLIC_ROOT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Run next-intl first (locale routing + redirects)
  const intlResponse = intlMiddleware(request);

  // 3. Skip Supabase if not configured (dev without .env.local)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return intlResponse;
  }

  // 4. Refresh Supabase session — write session cookies onto the intl response
  let roleFromDb: UserRole | null = null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            intlResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Unauthenticated → redirect to /[locale]/login
  if (!user) {
    if (isPublicPath(pathname)) return intlResponse;

    const locale = getLocaleFromPath(pathname);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // 5. Resolve role: cookie first (fast), then DB (first request after login)
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value as UserRole | undefined;

  if (cachedRole && Object.keys(ROLE_HOME).includes(cachedRole)) {
    roleFromDb = cachedRole;
  } else {
    // Use service-role-free DB call via authenticated client
    const { data } = await supabase
      .schema("food_passport" as never)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    roleFromDb = (data?.role as UserRole) ?? null;

    // Cache the role in a secure cookie for 8 h
    if (roleFromDb) {
      intlResponse.cookies.set(ROLE_COOKIE, roleFromDb, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 8,
        path: "/",
      });
    }
  }

  // No profile yet (new user not onboarded) → let them reach login or a pending page
  if (!roleFromDb) return intlResponse;

  const bare = stripLocale(pathname);
  const locale = getLocaleFromPath(pathname);
  const home = ROLE_HOME[roleFromDb];

  // 6. Root path → redirect to role home
  if (isRootOrIndex(bare)) {
    return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
  }

  // 7. Wrong section for this role → redirect to their home
  if (!isPublicPath(pathname) && !isRootOrIndex(bare) && !isAllowed(roleFromDb, bare)) {
    return NextResponse.redirect(new URL(`/${locale}${home}`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Exclut : API routes, callback auth, assets statiques Next.js, fichiers statiques
    "/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
