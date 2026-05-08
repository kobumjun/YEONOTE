import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { getSessionUser } from "@/lib/auth";
import type { PresentationSlide, SlideElement } from "@/types/template";
import { normalizePresentationSlide } from "@/types/template";

function slideElementsForExport(slide: PresentationSlide): SlideElement[] {
  const normalized = normalizePresentationSlide(slide);
  return normalized.elements?.length
    ? normalized.elements
    : (slide.bullets?.length ? [{ type: "bullet_list" as const, items: slide.bullets }] : []);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; slides?: PresentationSlide[] } | null;
  if (!body) return NextResponse.json({ error: "Invalid request format." }, { status: 400 });

  const title = body.title?.trim() || "Presentation";
  const slides = Array.isArray(body.slides) ? body.slides : [];
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  for (let index = 0; index < slides.length; index++) {
    const raw = slides[index]!;
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };

    const titleSize = index === 0 ? 36 : 28;
    s.addText(raw.title || "Untitled", {
      x: 0.8,
      y: 0.5,
      w: 8.5,
      h: 1,
      fontSize: titleSize,
      bold: true,
      color: "1A1A1A",
    });

    let yPos = index === 0 ? 2.2 : 1.45;
    const elements = slideElementsForExport(raw);

    for (const el of elements) {
      switch (el.type) {
        case "bullet_list": {
          for (const item of el.items) {
            if (!item.trim()) continue;
            s.addText(item, {
              x: 1.0,
              y: yPos,
              w: 8.2,
              h: 0.35,
              fontSize: 16,
              color: "333333",
              bullet: { type: "bullet", indent: 18 },
            });
            yPos += 0.42;
          }
          break;
        }
        case "numbered_list": {
          el.items.forEach((item, i) => {
            if (!item.trim()) return;
            s.addText(`${i + 1}. ${item}`, {
              x: 0.9,
              y: yPos,
              w: 8.3,
              h: 0.4,
              fontSize: 16,
              color: "333333",
            });
            yPos += 0.45;
          });
          break;
        }
        case "text":
        case "heading": {
          const size = el.type === "heading" ? 20 : 16;
          const bold = el.type === "heading";
          if (!el.content.trim()) break;
          s.addText(el.content, {
            x: 0.8,
            y: yPos,
            w: 8.5,
            h: 0.55,
            fontSize: size,
            bold,
            color: el.type === "heading" ? "111111" : "333333",
          });
          yPos += el.type === "heading" ? 0.55 : 0.5;
          break;
        }
        case "callout": {
          if (!el.content.trim()) break;
          s.addText(el.content, {
            x: 0.85,
            y: yPos,
            w: 8.2,
            h: 0.75,
            fontSize: 14,
            color: "6B21A8",
            bold: true,
          });
          yPos += 0.85;
          break;
        }
        case "quote": {
          if (!el.content.trim()) break;
          s.addText(`"${el.content}"`, {
            x: 1.0,
            y: yPos,
            w: 8.0,
            h: 0.55,
            fontSize: 16,
            italic: true,
            color: "555555",
          });
          yPos += 0.65;
          break;
        }
        case "divider": {
          s.addText("— — —", {
            x: 0.8,
            y: yPos,
            w: 8.2,
            fontSize: 12,
            color: "BBBBBB",
            align: "center",
          });
          yPos += 0.35;
          break;
        }
        case "image": {
          const url = el.url?.trim();
          if (url && /^https?:\/\//i.test(url)) {
            try {
              s.addImage({ path: url, x: 1.2, y: yPos, w: 6.5, h: 3.2 });
              yPos += 3.35;
            } catch {
              s.addText(el.alt || "[Image]", {
                x: 0.9,
                y: yPos,
                w: 8.0,
                fontSize: 14,
                italic: true,
                color: "888888",
              });
              yPos += 0.45;
            }
          } else if (el.alt?.trim()) {
            s.addText(`[Image: ${el.alt}]`, {
              x: 0.9,
              y: yPos,
              w: 8.0,
              fontSize: 14,
              italic: true,
              color: "888888",
            });
            yPos += 0.45;
          }
          break;
        }
        default:
          break;
      }
    }

    const notes = raw.notes?.trim();
    if (notes) s.addNotes(notes);
  }

  const base64 = await pptx.write({ outputType: "base64" });
  return NextResponse.json({
    pptxBase64: base64,
    filename: `${title.replace(/[\\/:*?"<>|]+/g, "_")}.pptx`,
  });
}
