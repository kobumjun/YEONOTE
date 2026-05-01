import { NextResponse } from "next/server";

/** Legacy OAuth redirect URI; forwards to `/auth/callback` with the same query string. */
export async function GET(request: Request) {
  const u = new URL(request.url);
  u.pathname = "/auth/callback";
  return NextResponse.redirect(u.toString(), 307);
}
