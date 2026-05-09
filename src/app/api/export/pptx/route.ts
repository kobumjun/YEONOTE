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
    primaryLight: "F8F7FF",
    dark: "2D3436",
    gray: "636E72",
    lightGray: "F5F5F5",
    white: "FFFFFF",
    tableBorder: "E2E8F0",
    tableStripe: "FAFAFA",
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
            const cleanContent = content
              .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
              .replace(/[\u2600-\u27BF]/g, "")
              .trim();
            s.addShape("roundRect", {
              x: 0.8, y: currentY, w: 8.4, h: 0.65,
              fill: { color: COLORS.primaryLight },
              line: { color: COLORS.primary, pt: 0.8 },
            });
            s.addText(cleanContent, {
              x: 1.1, y: currentY + 0.08, w: 7.8, h: 0.5,
              fontFace: "Arial",
              fontSize: 13,
              bold: true,
              color: COLORS.primary,
              valign: "middle",
            });
            currentY += 0.85;
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
          case "table": {
            if (!el.headers.length) break;
            const border = { type: "solid" as const, color: COLORS.tableBorder, pt: 0.5 };
            const margin: [number, number, number, number] = [6, 8, 6, 8];
            const tableRows = [
              el.headers.map((h) => ({
                text: h,
                options: {
                  bold: true,
                  fontSize: 11,
                  color: "FFFFFF",
                  fill: { color: COLORS.primary },
                  align: "left" as const,
                  border,
                  margin,
                },
              })),
              ...el.rows.map((row, i) =>
                row.map((cell) => ({
                  text: cell,
                  options: {
                    fontSize: 11,
                    color: COLORS.dark,
                    fill: { color: i % 2 === 0 ? COLORS.tableStripe : COLORS.white },
                    border,
                    margin,
                  },
                }))
              ),
            ];
            s.addTable(tableRows, {
              x: 0.8,
              y: currentY,
              w: 8.4,
              colW: Array(el.headers.length).fill(8.4 / el.headers.length),
            });
            currentY += 0.4 * (el.rows.length + 1) + 0.3;
            break;
          }
          case "stat_box": {
            if (!el.stats.length) break;
            const statWidth = 8.4 / el.stats.length;
            el.stats.forEach((stat, i) => {
              const sx = 0.8 + statWidth * i + (i > 0 ? 0.1 : 0);
              const sw = statWidth - (el.stats.length > 1 ? 0.1 : 0);
              s.addShape("roundRect", {
                x: sx, y: currentY, w: sw, h: 1.1,
                fill: { color: COLORS.primaryLight },
                line: { color: COLORS.primaryLight, pt: 0 },
              });
              s.addText(stat.value, {
                x: sx, y: currentY + 0.1, w: sw, h: 0.55,
                fontSize: 26, bold: true, color: COLORS.primary,
                align: "center", valign: "middle",
              });
              s.addText(stat.label, {
                x: sx, y: currentY + 0.65, w: sw, h: 0.35,
                fontSize: 10, color: COLORS.gray,
                align: "center", valign: "top",
              });
            });
            currentY += 1.3;
            break;
          }
          case "timeline": {
            el.items.forEach((item, i) => {
              if (i < el.items.length - 1) {
                s.addShape("rect", {
                  x: 1.05, y: currentY + 0.15, w: 0.03, h: 0.55,
                  fill: { color: COLORS.primaryLight },
                  line: { color: COLORS.primaryLight, pt: 0 },
                });
              }
              s.addShape("ellipse", {
                x: 0.95, y: currentY + 0.02, w: 0.22, h: 0.22,
                fill: { color: COLORS.primary },
                line: { color: COLORS.primary, pt: 0 },
              });
              s.addText(item.title, {
                x: 1.4, y: currentY, w: 7.5, h: 0.28,
                fontSize: 13, bold: true, color: COLORS.dark,
              });
              s.addText(item.description, {
                x: 1.4, y: currentY + 0.28, w: 7.5, h: 0.3,
                fontSize: 11, color: COLORS.gray,
              });
              currentY += 0.65;
            });
            currentY += 0.15;
            break;
          }
          case "two_column": {
            s.addShape("roundRect", {
              x: 0.8, y: currentY, w: 4.0, h: 1.2,
              fill: { color: COLORS.lightGray },
              line: { color: COLORS.lightGray, pt: 0 },
            });
            s.addText(el.left, {
              x: 1.0, y: currentY + 0.1, w: 3.6, h: 1.0,
              fontSize: 12, color: COLORS.dark, valign: "top",
              lineSpacingMultiple: 1.3,
            });
            s.addShape("roundRect", {
              x: 5.0, y: currentY, w: 4.0, h: 1.2,
              fill: { color: COLORS.lightGray },
              line: { color: COLORS.lightGray, pt: 0 },
            });
            s.addText(el.right, {
              x: 5.2, y: currentY + 0.1, w: 3.6, h: 1.0,
              fontSize: 12, color: COLORS.dark, valign: "top",
              lineSpacingMultiple: 1.3,
            });
            currentY += 1.4;
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
        x: 0.8, y: 2.0, w: 8.4, h: 1.2,
        fontFace: "Arial", fontSize: 34, bold: true,
        color: COLORS.white, align: "center", valign: "middle",
      });

      const subtitle = elements.find((e) => e.type === "text");
      if (subtitle?.type === "text" && subtitle.content.trim()) {
        s.addText(subtitle.content, {
          x: 1.5, y: 3.4, w: 7.0, h: 0.7,
          fontFace: "Arial", fontSize: 16, color: "FFFFFFCC",
          align: "center",
        });
      }

      const statEl = elements.find((e) => e.type === "stat_box");
      if (statEl?.type === "stat_box" && statEl.stats.length) {
        renderElements([statEl], 4.3);
      }
      s.addShape("rect", {
        x: 0, y: 7.2, w: 10, h: 0.05,
        fill: { color: "FFFFFF33" },
        line: { color: "FFFFFF33", pt: 0 },
      });
      const notes = raw.notes?.trim();
      if (notes) s.addNotes(notes);
      continue;
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
      x: 0, y: 7.2, w: 10, h: 0.04,
      fill: { color: COLORS.primary },
      line: { color: COLORS.primary, pt: 0 },
    });
    s.addText(`${index + 1}`, {
      x: 9.0, y: 6.85, w: 0.5, h: 0.3,
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
