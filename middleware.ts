import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/dashboard", "/deck", "/settings", "/pricing"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/") ||
    pathname === "/callback"
  ) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    const u = new URL("/login", request.url);
    u.search = request.nextUrl.search;
    return NextResponse.redirect(u);
  }
  if (pathname === "/forgot-password" || pathname.startsWith("/forgot-password/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/share/")) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  // Legacy template URLs → deck editor
  if (pathname.startsWith("/template/")) {
    const id = pathname.split("/")[2];
    if (id) {
      const rest = pathname.slice(`/template/${id}`.length);
      return NextResponse.redirect(new URL(`/deck/${id}${rest}`, request.url));
    }
  }

  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((pathname === "/login" || pathname.startsWith("/login/")) && user) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const safe =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
    return NextResponse.redirect(new URL(safe, request.url));
  }

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
