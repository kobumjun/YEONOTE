import { getOpenAI } from "@/lib/openai";
import type { PresentationSlide } from "@/types/template";
import { normalizePresentationSlide } from "@/types/template";

export function pickGenerationTitle(prompt: string): string {
  return prompt.slice(0, 80).trim() || "Untitled";
}

const DOCUMENT_SYSTEM = `Generate the document as a JSON object with a single key "blocks" whose value is an array of blocks.
Each block has a "type" and fields for that type.
Available types: heading, paragraph, bulleted_list, numbered_list, callout, divider, quote.
For heading include "level" (1, 2, or 3) and "text".
For paragraph use "text".
For bulleted_list / numbered_list use "items" (array of strings).
For callout and quote use "text".
For divider use only "type": "divider".

Return ONLY valid JSON:
{"blocks":[
  { "type": "heading", "level": 1, "text": "Document Title" },
  { "type": "paragraph", "text": "Introduction paragraph..." },
  { "type": "callout", "text": "Important note or tip" },
  { "type": "bulleted_list", "items": ["Point 1", "Point 2"] },
  { "type": "divider" },
  { "type": "heading", "level": 2, "text": "Section Title" },
  { "type": "paragraph", "text": "Section content..." }
]}

Make the document rich and well-structured with diverse block types.
Use callouts for important notes, quotes for emphasis, dividers between major sections.`;

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
  return {
    blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
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
