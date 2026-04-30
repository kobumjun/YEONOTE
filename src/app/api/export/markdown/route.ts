import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { templateToMarkdown } from "@/lib/export";
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
