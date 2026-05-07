import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { templateToMarkdown } from "@/lib/export";
import type { TemplateBlock } from "@/types/template";
import type { TemplateContent } from "@/types/template";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  const body = await req.json().catch(() => null) as {
    templateId?: string;
    title?: string;
    blocks?: TemplateBlock[];
  } | null;

  const supabase = await createClient();

  let title = body?.title ?? "제목 없음";
  let blocks: TemplateBlock[] = body?.blocks ?? [];

  if (body?.templateId) {
    const { data: tpl } = await supabase
      .from("templates")
      .select("title,content,user_id")
      .eq("id", body.templateId)
      .maybeSingle();
    if (!tpl || tpl.user_id !== user.id) {
      return NextResponse.json({ error: "찾을 수 없어요." }, { status: 404 });
    }
    title = tpl.title;
    const c = (tpl.content ?? { blocks: [] }) as TemplateContent;
    blocks = c.blocks ?? [];
  }

  const text = templateToMarkdown(title, blocks);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const maxW = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text.replace(/[#>`]/g, ""), maxW);
  let y = margin;
  const lh = 14;
  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(String(line), margin, y);
    y += lh;
  }
  const b64 = doc.output("datauristring").split(",")[1];
  return NextResponse.json({ pdfBase64: b64, filename: `${title}.pdf` });
}
