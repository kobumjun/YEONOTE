import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FREE_MAX_TEMPLATES, effectivePlan } from "@/lib/plan";
import { createBlankTemplateBlocks } from "@/lib/blank-template";
import type { TemplateContent } from "@/types/template";

function emptyContent(): TemplateContent {
  return { blocks: [] };
}

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "all";
  const sort = searchParams.get("sort") ?? "recent";
  const q = searchParams.get("q")?.trim();
  const filter = searchParams.get("filter")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  if (view === "shared") {
    return NextResponse.json({ templates: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  }

  if (view === "my" && filter === "shared_with_me") {
    return NextResponse.json({ templates: [], total: 0, page: 1, pageSize: PAGE_SIZE });
  }

  let query = supabase.from("templates").select("*", { count: "exact" }).eq("user_id", user.id);

  if (view === "trash") query = query.eq("is_deleted", true);
  else query = query.eq("is_deleted", false);

  if (view === "favorites") query = query.eq("is_favorited", true);
  if (view === "my") query = query.eq("is_deleted", false);

  if (q) query = query.ilike("title", `%${q}%`);

  if (sort === "alphabetical") query = query.order("title", { ascending: true });
  else if (sort === "updated") query = query.order("updated_at", { ascending: false });
  else query = query.order("updated_at", { ascending: false });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    templates: data ?? [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = effectivePlan(profile ?? { plan: "free" });

  if (plan === "free") {
    const { count } = await supabase
      .from("templates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_deleted", false);
    if ((count ?? 0) >= FREE_MAX_TEMPLATES) {
      return NextResponse.json(
        { error: `Free plan allows up to ${FREE_MAX_TEMPLATES} templates.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json().catch(() => ({})) as {
    title?: string;
    icon?: string;
    cover?: string | null;
    content?: TemplateContent;
    tags?: string[];
    category?: string | null;
    ai_prompt?: string | null;
    blank?: boolean;
  };

  const blank = Boolean(body.blank);
  const content: TemplateContent = blank
    ? { blocks: createBlankTemplateBlocks() }
    : (body.content ?? emptyContent());
  const title = blank ? (body.title?.trim() || "Untitled") : (body.title ?? "Untitled");
  const icon = blank ? (body.icon?.trim() || "📄") : (body.icon ?? "📄");

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: user.id,
      title,
      icon,
      cover: body.cover ?? null,
      content,
      tags: body.tags ?? [],
      category: body.category ?? null,
      ai_prompt: body.ai_prompt ?? null,
      is_public: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}
