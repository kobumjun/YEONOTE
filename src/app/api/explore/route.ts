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
  return NextResponse.json({ templates: data ?? [] });
}
