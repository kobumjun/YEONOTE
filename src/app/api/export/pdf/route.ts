import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { getSessionUser } from "@/lib/auth";
import {
  normalizePresentationSlides,
  presentationToPlainText,
  type PresentationSlide,
} from "@/types/template";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    title?: string;
    slides?: PresentationSlide[];
    watermark?: boolean;
  };

  const title = body.title ?? "Untitled deck";
  const slides = normalizePresentationSlides(body.slides ?? []);
  const watermark = Boolean(body.watermark);

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 48;

  slides.forEach((slide, i) => {
    if (i > 0) doc.addPage();
    doc.setFontSize(22);
    doc.text(slide.title || `Slide ${i + 1}`, margin, margin + 20);
    doc.setFontSize(11);
    const text = presentationToPlainText([slide]);
    const lines = doc.splitTextToSize(text, w - margin * 2);
    let y = margin + 50;
    for (const line of lines) {
      if (y > h - margin - (watermark ? 24 : 0)) break;
      doc.text(String(line), margin, y);
      y += 14;
    }
    if (watermark) {
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text("Made with YEO", w / 2, h - 20, { align: "center" });
      doc.setTextColor(0);
    }
  });

  if (slides.length === 0) {
    doc.text("Empty deck", margin, margin);
    if (watermark) {
      doc.setFontSize(9);
      doc.text("Made with YEO", w / 2, h - 20, { align: "center" });
    }
  }

  const pdfBytes = doc.output("arraybuffer");
  return new NextResponse(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${title}.pdf"`,
    },
  });
}
