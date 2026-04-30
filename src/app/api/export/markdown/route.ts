import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { templateToMarkdown } from "@/lib/export";
import { canUseExport, effectivePlan } from "@/lib/plan";
import type { TemplateBlock } from "@/types/template";
import type { TemplateContent } from "@/types/template";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    templateId?: string;
    title?: string;
    blocks?: TemplateBlock[];
  } | null;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = effectivePlan(profile ?? { plan: "free" });
  if (!canUseExport(plan)) {
    return NextResponse.json({ error: "Export is available on Pro and Team plans." }, { status: 403 });
  }

  let title = body?.title ?? "Untitled";
  let blocks: TemplateBlock[] = body?.blocks ?? [];

  if (body?.templateId) {
    const { data: tpl } = await supabase
      .from("templates")
      .select("title,content,user_id")
      .eq("id", body.templateId)
      .maybeSingle();
    if (!tpl || tpl.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    title = tpl.title;
    const c = (tpl.content ?? { blocks: [] }) as TemplateContent;
    blocks = c.blocks ?? [];
  }

  const md = templateToMarkdown(title, blocks);
  return NextResponse.json({ markdown: md });
}
