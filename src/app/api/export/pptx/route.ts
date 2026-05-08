import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { getSessionUser } from "@/lib/auth";
import type { PresentationSlide } from "@/types/template";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; slides?: PresentationSlide[] } | null;
  if (!body) return NextResponse.json({ error: "Invalid request format." }, { status: 400 });

  const title = body.title?.trim() || "Presentation";
  const slides = Array.isArray(body.slides) ? body.slides : [];
  const pptx = new PptxGenJS();

  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.addText(s.title || "Untitled", { x: 0.5, y: 0.5, w: 12, h: 0.8, fontSize: 28, bold: true });
    slide.addText((s.bullets ?? []).map((b) => ({ text: b || "" })), {
      x: 0.9,
      y: 1.6,
      w: 11.2,
      h: 4.5,
      fontSize: 18,
      bullet: { indent: 22 },
    });
    if (s.notes) slide.addNotes(s.notes);
  }

  const base64 = await pptx.write({ outputType: "base64" });
  return NextResponse.json({
    pptxBase64: base64,
    filename: `${title.replace(/[\\/:*?"<>|]+/g, "_")}.pptx`,
  });
}
