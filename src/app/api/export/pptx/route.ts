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

function estimateTextHeight(text: string, base = 0.8): number {
  const len = text.trim().length;
  if (len === 0) return base;
  return Math.min(1.6, Math.max(base, 0.38 + Math.ceil(len / 85) * 0.22));
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; slides?: PresentationSlide[] } | null;
  if (!body) return NextResponse.json({ error: "Invalid request format." }, { status: 400 });

  const title = body.title?.trim() || "Presentation";
  const slides = Array.isArray(body.slides) ? body.slides : [];
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  // Design tokens
  const COLORS = {
    primary: "6C5CE7",
    primaryLight: "E8E5FC",
    dark: "2D3436",
    gray: "636E72",
    lightGray: "F5F5F5",
    white: "FFFFFF",
    accent: "00B894",
    warning: "FDCB6E",
  } as const;

  const FONTS = {
    title: { fontFace: "Arial", fontSize: 28, bold: true, color: COLORS.dark },
    subtitle: { fontFace: "Arial", fontSize: 16, color: COLORS.gray },
    body: { fontFace: "Arial", fontSize: 14, color: COLORS.dark, lineSpacingMultiple: 1.4 },
    bullet: { fontFace: "Arial", fontSize: 13, color: COLORS.dark, lineSpacingMultiple: 1.3 },
    callout: { fontFace: "Arial", fontSize: 15, bold: true, color: COLORS.primary },
    quote: { fontFace: "Arial", fontSize: 15, italic: true, color: COLORS.gray },
    heading: { fontFace: "Arial", fontSize: 20, bold: true, color: COLORS.dark },
    notes: { fontFace: "Arial", fontSize: 11, color: COLORS.gray },
  } as const;

  for (let index = 0; index < slides.length; index++) {
    const raw = slides[index]!;
    const s = pptx.addSlide();
    const elements = slideElementsForExport(raw);

    const renderElements = (els: SlideElement[], startY: number) => {
      let currentY = startY;
      for (const el of els) {
        if (currentY > 6.4) break;
        switch (el.type) {
          case "text": {
            const content = el.content.trim();
            if (!content) break;
            const h = estimateTextHeight(content, 0.8);
            s.addText(content, {
              x: 0.8, y: currentY, w: 8.4, h,
              ...FONTS.body,
              valign: "top",
            });
            currentY += h + 0.1;
            break;
          }
          case "heading": {
            const content = el.content.trim();
            if (!content) break;
            s.addText(content, {
              x: 0.8, y: currentY, w: 8.4, h: 0.5,
              ...FONTS.heading,
            });
            currentY += 0.6;
            break;
          }
          case "bullet_list": {
            const items = el.items.filter((item) => item.trim()).slice(0, 4);
            for (const item of items) {
              s.addText(item, {
                x: 1.2, y: currentY, w: 7.8, h: 0.45,
                ...FONTS.bullet,
                bullet: { type: "bullet", indent: 10 },
              });
              currentY += 0.45;
              if (currentY > 6.4) break;
            }
            currentY += 0.15;
            break;
          }
          case "numbered_list": {
            for (let i = 0; i < el.items.length; i++) {
              const item = el.items[i]?.trim();
              if (!item) continue;
              s.addText(`${i + 1}.  ${item}`, {
                x: 1.0, y: currentY, w: 8.0, h: 0.45,
                ...FONTS.bullet,
                bold: false,
              });
              currentY += 0.45;
              if (currentY > 6.4) break;
            }
            currentY += 0.15;
            break;
          }
          case "callout": {
            const content = el.content.trim();
            if (!content) break;
            s.addShape("rect", {
              x: 0.8, y: currentY, w: 8.4, h: 0.7,
              fill: { color: COLORS.primaryLight },
              line: { color: COLORS.primary, pt: 0.5 },
            });
            s.addText(content, {
              x: 1.1, y: currentY + 0.1, w: 7.8, h: 0.5,
              ...FONTS.callout,
            });
            currentY += 0.9;
            break;
          }
          case "quote": {
            const content = el.content.trim();
            if (!content) break;
            s.addShape("rect", {
              x: 0.8, y: currentY, w: 0.06, h: 0.7,
              fill: { color: COLORS.primary },
              line: { color: COLORS.primary, pt: 0 },
            });
            s.addText(`"${content}"`, {
              x: 1.1, y: currentY, w: 8.1, h: 0.7,
              ...FONTS.quote,
              valign: "middle",
            });
            currentY += 0.9;
            break;
          }
          case "divider": {
            s.addShape("rect", {
              x: 0.8, y: currentY + 0.15, w: 8.4, h: 0.02,
              fill: { color: COLORS.lightGray },
              line: { color: COLORS.lightGray, pt: 0 },
            });
            currentY += 0.4;
            break;
          }
          case "image": {
            s.addShape("rect", {
              x: 0.8, y: currentY, w: 8.4, h: 2.5,
              fill: { color: COLORS.lightGray },
              line: { color: "E5E7EB", pt: 0.5 },
            });
            s.addText(el.alt || "Image", {
              x: 0.8, y: currentY, w: 8.4, h: 2.5,
              ...FONTS.subtitle,
              align: "center",
              valign: "middle",
            });
            currentY += 2.7;
            break;
          }
          default:
            break;
        }
      }
    };

    if (index === 0) {
      s.background = { color: COLORS.primary };
      s.addText(raw.title || "Untitled", {
        x: 0.8, y: 1.5, w: 8.4, h: 1.5,
        fontFace: "Arial", fontSize: 36, bold: true,
        color: COLORS.white, align: "center", valign: "middle",
      });

      const subtitle = elements.find((e) => e.type === "text");
      if (subtitle?.type === "text" && subtitle.content.trim()) {
        s.addText(subtitle.content, {
          x: 1.5, y: 3.2, w: 7.0, h: 0.8,
          fontFace: "Arial", fontSize: 18, color: "FFFFFFCC",
          align: "center", valign: "top",
        });
      }

      const remaining = elements.filter((e) => e !== subtitle);
      renderElements(remaining, 4.2);
    } else {
      s.background = { color: COLORS.white };
      s.addText(raw.title || "Untitled", {
        x: 0.8, y: 0.55, w: 8.4, h: 0.75,
        ...FONTS.title,
      });
      renderElements(elements, 1.6);
    }

    // 모든 슬라이드에 하단 브랜드 라인 + 페이지 번호
    s.addShape("rect", {
      x: 0, y: 7.2, w: 10, h: 0.05,
      fill: { color: COLORS.primary },
      line: { color: COLORS.primary, pt: 0 },
    });
    s.addText(`${index + 1}`, {
      x: 9.0, y: 6.9, w: 0.6, h: 0.3,
      ...FONTS.notes,
      align: "right",
    });

    const notes = raw.notes?.trim();
    if (notes) s.addNotes(notes);
  }

  const base64 = await pptx.write({ outputType: "base64" });
  return NextResponse.json({
    pptxBase64: base64,
    filename: `${title.replace(/[\\/:*?"<>|]+/g, "_")}.pptx`,
  });
}
