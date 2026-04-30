import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeHttpAvatarUrl } from "@/lib/profile-display";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
