import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveDeckCount, checkDeckLimit } from "@/lib/deck-limits";
import { normalizePlan } from "@/lib/subscription";
import type { CreationContent } from "@/types/template";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getSessionUser(_req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = normalizePlan(profile?.plan);
  const deckCount = await getActiveDeckCount(user.id);
  const limitCheck = checkDeckLimit(plan, deckCount);
  if (!limitCheck.ok) {
    return NextResponse.json(
      { error: limitCheck.message, code: "upgrade_required" },
      { status: 403 }
    );
  }

  const { data: src, error: fetchErr } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !src) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (src.user_id !== user.id && !(src.is_public && !src.is_deleted)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  const content = (src.content ?? { slides: [] }) as CreationContent;

  const { data: created, error: insErr } = await supabase
    .from("templates")
    .insert({
      user_id: user.id,
      title: `${src.title} (Copy)`,
      icon: src.icon ?? "📊",
      creation_type: "presentation",
      cover: src.cover,
      content,
      tags: src.tags ?? [],
      category: src.category,
      is_public: false,
      original_template_id: src.user_id === user.id ? src.original_template_id ?? src.id : src.id,
    })
    .select()
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  if (src.user_id !== user.id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      await admin
        .from("templates")
        .update({ duplicates_count: (src.duplicates_count ?? 0) + 1 })
        .eq("id", src.id);
    } catch {
      /* optional */
    }
  }

  return NextResponse.json({ template: { ...created, creationType: "presentation" as const } });
}
