import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  await getSessionUser(); /* optional auth for future personalization */
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("templates")
    .select("id,title,icon,cover,tags,category,likes_count,duplicates_count,created_at,user_id", { count: "exact" })
    .eq("is_public", true)
    .eq("is_deleted", false)
    .order("likes_count", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,category.ilike.%${q}%`);

  query = query.range(from, to);

  const { data, error, count } = await query;
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

  return NextResponse.json({
    templates: enriched,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}
