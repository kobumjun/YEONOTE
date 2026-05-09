import { createClient } from "@/lib/supabase/server";

function bearerFromRequest(request: Request | undefined): string | null {
  if (!request) return null;
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  const t = h.slice(7).trim();
  return t || null;
}

/**
 * Resolves the current user from the incoming request (optional Bearer JWT)
 * and/or Supabase auth cookies. Pass the route `Request` from API handlers.
 */
export async function getSessionUser(request?: Request) {
  const supabase = await createClient();
  const jwt = bearerFromRequest(request);
  if (jwt) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(jwt);
    if (!error && user) return user;
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
