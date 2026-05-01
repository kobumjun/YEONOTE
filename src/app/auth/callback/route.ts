import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeHttpAvatarUrl } from "@/lib/profile-display";

function safeNext(next: string | null): string {
  const n = (next?.trim() || "/dashboard").split("#")[0] ?? "/dashboard";
  if (!n.startsWith("/") || n.startsWith("//")) return "/dashboard";
  return n;
}

function redirectOrigin(request: NextRequest, requestUrl: URL): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto");
  if (forwardedHost && !requestUrl.hostname.includes("localhost")) {
    const scheme = proto === "http" || proto === "https" ? proto : "https";
    return `${scheme}://${forwardedHost}`;
  }
  return requestUrl.origin;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const origin = redirectOrigin(request, requestUrl);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  if (code) {
    // Attach session cookies to this redirect response (required in App Router route handlers).
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const picRaw =
        (typeof meta.avatar_url === "string" && meta.avatar_url) ||
        (typeof meta.picture === "string" && meta.picture) ||
        null;
      const pic = safeHttpAvatarUrl(picRaw);
      const fn =
        (typeof meta.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta.name === "string" && meta.name.trim()) ||
        null;
      const patch: { full_name?: string; avatar_url?: string } = {};
      if (fn) patch.full_name = fn;
      if (pic) patch.avatar_url = pic;
      if (Object.keys(patch).length > 0) {
        await supabase.from("profiles").update(patch).eq("id", user.id);
      }
    }

    return redirectResponse;
  }

  const redirectExisting = NextResponse.redirect(`${origin}${next}`);
  const supabaseExisting = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectExisting.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabaseExisting.auth.getUser();

  if (user) {
    return redirectExisting;
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
