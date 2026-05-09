import { getOpenAI } from "@/lib/openai";
import type { PresentationSlide } from "@/types/template";
import { normalizePresentationSlide } from "@/types/template";

export function pickGenerationTitle(prompt: string): string {
  return prompt.slice(0, 80).trim() || "Untitled";
}

const DOCUMENT_SYSTEM = `You are a professional writer. Generate the requested document as clean, well-structured prose.

LANGUAGE
- Match the user's language for all visible text.

RULES (strict)
- Use ONLY these block types: "heading", "paragraph".
- Do NOT use: callout, quote, divider, bulleted_list, numbered_list, toggle, code, columns, tables, or any other block type.
- Write in natural, flowing prose paragraphs.
- Use "heading" blocks only for major section titles (not every sentence).
- The document should read like a professionally written letter, email, essay, or report — not like an AI template.
- No decorative elements, no tip boxes, no highlighted sections, no ornamental dividers.
- Keep formatting minimal and clean.
- Match tone to the request (formal for business, casual for personal, etc.).

OUTPUT
- Return ONLY valid JSON with a single key "blocks" whose value is an array.
- Each block: { "type": "heading", "level": 1 | 2 | 3, "text": "..." } OR { "type": "paragraph", "text": "..." }.
- Nothing else. No markdown outside JSON.

Example shape:
{"blocks":[
  { "type": "heading", "level": 1, "text": "Document Title" },
  { "type": "paragraph", "text": "First paragraph of natural prose..." },
  { "type": "paragraph", "text": "Second paragraph..." },
  { "type": "heading", "level": 2, "text": "Section Title" },
  { "type": "paragraph", "text": "Section content..." }
]}`;

function sanitizeDocumentBlocks(blocks: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const raw of blocks) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as { type?: string; level?: unknown; text?: unknown; content?: unknown };
    const t = b.type;
    if (t === "heading") {
      const level = typeof b.level === "number" && b.level >= 1 && b.level <= 3 ? b.level : 2;
      const text =
        typeof b.text === "string"
          ? b.text
          : typeof b.content === "string"
            ? b.content
            : "";
      if (!text.trim()) continue;
      out.push({ type: "heading", level, text });
    } else if (t === "paragraph") {
      const text = typeof b.text === "string" ? b.text : typeof b.content === "string" ? b.content : "";
      if (!text.trim()) continue;
      out.push({ type: "paragraph", text });
    }
  }
  return out;
}

const PRESENTATION_SYSTEM = `You are a professional presentation designer.
Generate a detailed, high-quality slide deck as JSON.
Rules:

Generate 8-15 slides depending on topic complexity
Each slide should have rich content, not just 3 bullet points
Use diverse element types: bullet_list, text, callout, quote, numbered_list, image placeholders
First slide is always a title slide with subtitle
Last slide is always a summary/thank you slide
Include speaker notes for every slide
Content should be detailed and informative, not generic placeholder text
Each slide should have 3-6 elements mixing different types

Return ONLY valid JSON:
{
"title": "Presentation Title",
"slides": [
{
"title": "Slide Title",
"elements": [
{ "type": "text", "content": "Opening statement..." },
{ "type": "bullet_list", "items": ["Point 1 with detail", "Point 2 with detail"] },
{ "type": "callout", "content": "Key insight or statistic" },
{ "type": "image", "url": "", "alt": "Description of suggested image" }
],
"notes": "Detailed speaker notes for this slide..."
}
]
}`;

export async function generateDocumentBlocksJson(prompt: string): Promise<{ blocks: unknown[]; tokens: number | null }> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DOCUMENT_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  const raw = r.choices[0]?.message?.content ?? '{"blocks":[]}';
  let parsed: { blocks?: unknown[] } = {};
  try {
    parsed = JSON.parse(raw) as { blocks?: unknown[] };
  } catch {
    parsed = { blocks: [] };
  }
  const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
  return {
    blocks: sanitizeDocumentBlocks(rawBlocks),
    tokens: r.usage?.total_tokens ?? null,
  };
}

export async function generatePresentationJson(prompt: string): Promise<{
  deckTitle: string;
  slides: PresentationSlide[];
  tokens: number | null;
}> {
  const openai = getOpenAI();
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.6,
    max_tokens: 6000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PRESENTATION_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  const raw = r.choices[0]?.message?.content ?? '{"slides":[]}';
  let parsed: { title?: string; slides?: unknown[] } = {};
  try {
    parsed = JSON.parse(raw) as { title?: string; slides?: unknown[] };
  } catch {
    parsed = { slides: [] };
  }
  const deckTitle =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : pickGenerationTitle(prompt);
  const slidesRaw = Array.isArray(parsed.slides) ? parsed.slides : [];
  const slides = slidesRaw.map((s) => normalizePresentationSlide(s));
  return { deckTitle, slides, tokens: r.usage?.total_tokens ?? null };
}

export async function generateImageUrl(prompt: string): Promise<{ imageUrl: string; tokens: number | null }> {
  const openai = getOpenAI();
  const r = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });
  return { imageUrl: r.data?.[0]?.url ?? "", tokens: null };
}
