import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: tpl } = await supabase
    .from("templates")
    .select("id, likes_count, is_public, is_deleted")
    .eq("id", id)
    .maybeSingle();

  if (!tpl || !tpl.is_public || tpl.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("template_likes")
    .select("user_id")
    .eq("template_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("template_likes").delete().eq("template_id", id).eq("user_id", user.id);
    const next = Math.max(0, (tpl.likes_count ?? 1) - 1);
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      await admin.from("templates").update({ likes_count: next }).eq("id", id);
    }
    return NextResponse.json({ liked: false, likes_count: next });
  }

  await supabase.from("template_likes").insert({ user_id: user.id, template_id: id });
  const next = (tpl.likes_count ?? 0) + 1;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    await admin.from("templates").update({ likes_count: next }).eq("id", id);
  }
  return NextResponse.json({ liked: true, likes_count: next });
}
