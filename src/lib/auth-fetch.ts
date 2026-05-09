"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Merge Supabase access token and default credentials for same-origin API routes
 * when cookie-based session is not visible to the handler (e.g. some edge cases).
 */
export async function withAuth(init: RequestInit = {}): Promise<RequestInit> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return {
    ...init,
    credentials: init.credentials ?? "include",
    headers,
  };
}
