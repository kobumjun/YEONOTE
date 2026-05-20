import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveDeckCount, checkDeckLimit } from "@/lib/deck-limits";
import { normalizePlan } from "@/lib/subscription";
import type { CreationContent } from "@/types/template";

const PAGE_SIZE = 24;
const BLANK_DECK: CreationContent = {
  title: "Untitled deck",
  slides: [{ title: "Title slide", elements: [{ type: "heading", content: "Untitled deck" }] }],
};

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "all";
  const sort = searchParams.get("sort") ?? "recent";
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("templates")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .eq("creation_type", "presentation");

  if (view === "trash") query = query.eq("is_deleted", true);
  else query = query.eq("is_deleted", false);

  if (q) query = query.ilike("title", `%${q}%`);

  if (sort === "alphabetical") query = query.order("title", { ascending: true });
  else query = query.order("updated_at", { ascending: false });

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const templates = (data ?? []).map((t) => ({ ...t, creationType: "presentation" as const }));
  return NextResponse.json({
    templates,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = normalizePlan(profile?.plan);
  const deckCount = await getActiveDeckCount(user.id);
  const limitCheck = checkDeckLimit(plan, deckCount);
  if (!limitCheck.ok) {
    return NextResponse.json(
      { error: limitCheck.message, code: "upgrade_required" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({})) as {
    title?: string;
    content?: CreationContent;
    ai_prompt?: string | null;
    blank?: boolean;
  };

  const content: CreationContent = body.content ?? BLANK_DECK;
  const title = body.title?.trim() || content.title || "Untitled deck";

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: user.id,
      title,
      icon: "📊",
      creation_type: "presentation",
      content,
      ai_prompt: body.ai_prompt ?? null,
      is_public: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: { ...data, creationType: "presentation" as const } });
}
