import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  await getSessionUser(); /* optional auth for future personalization */
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const supabase = await createClient();
  let query = supabase
    .from("templates")
    .select("id,title,icon,cover,tags,category,likes_count,duplicates_count,created_at,user_id")
    .eq("is_public", true)
    .eq("is_deleted", false)
    .order("likes_count", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%`);

  const { data, error } = await query.limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const templates = data ?? [];
  const userIds = Array.from(new Set(templates.map((t) => t.user_id).filter(Boolean)));
  let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url")
      .in("id", userIds);
    profileMap = new Map(
      (profiles ?? []).map((p) => [p.id as string, { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null }])
    );
  }

  const enriched = templates.map((t) => ({
    ...t,
    creator: profileMap.get(t.user_id) ?? { full_name: null, avatar_url: null },
  }));

  return NextResponse.json({ templates: enriched });
}
